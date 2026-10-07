<template>
  <v-sheet theme="light" tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp">
    <v-stage ref="stage" :config="stageSize" @dragstart="handleDragstart" @dragend="handleDragend"
      @pointerdown="handleMouseDown" @pointermove="handleMouseMove" @pointerup="handleMouseUp">

      <v-layer ref="gridLayer">
        <v-line v-for="i in 100" :key="i" :config="{
          points: [0, i * 50, stageSize.width, i * 50],
          stroke: '#ddd',
          strokeWidth: 1
        }" />
        <v-line v-for="i in 100" :key="i" :config="{
          points: [i * 50, 0, i * 50, stageSize.height],
          stroke: '#ddd',
          strokeWidth: 1
        }" />
      </v-layer>
      <v-layer ref="draw
    Layer">
        <v-line v-for="(line, i) in lines" :key="i" :config="{
          points: line.points,
          stroke: line.color,
          strokeWidth: line.color === 'erase' ? 25 : 5,
          tension: 0.5,
          lineCap: 'round',
          lineJoin: 'round',
          globalCompositeOperation: line.color === 'erase' ? 'destination-out' : 'source-over'
        }" />
      </v-layer>
      <v-layer ref="tokenLayer">
        <v-group v-for="item in tokens" :key="item.id"
          :config="{ x: item.x, y: item.y, id: item.id, draggable: true }">
          <v-circle :config="{
            radius: 25,
            fill: 'white',
            stroke: 'black',
            scaleX: dragItemId === item.id ? 1.2 : 1.0,
            scaleY: dragItemId === item.id ? 1.2 : 1.0,
            shadowColor: 'black',
            shadowBlur: 10,
            shadowOffsetX: dragItemId === item.id ? 15 : 5,
            shadowOffsetY: dragItemId === item.id ? 15 : 5,
            shadowOpacity: 0.6
          }">
          </v-circle>
          <v-text :config="{
            x: -25,
            y: -25,
            width: 50,
            height: 50,
            text: `${item.name}${item.serial}`,
            fontSize: 20,
            fontFamily: 'Calibri',
            fill: 'black',
            stroke: 'black',
            strokeWidth: 1,
            padding: 10,
            align: 'center'
          }" />
        </v-group>
      </v-layer>
    </v-stage>
    <v-toolbar collapse floating absolute location="top left" title="Toolbar">
      <v-btn class="ma-2" icon="mdi-theme-light-dark" v-tooltip:bottom="'Cycle through themes'"
        @click="$vuetify.theme.cycle()" />

      <v-btn class="mr-3" icon="mdi-dot" size="small" :color=color variant="elevated" v-tooltip:bottom="'Change color'">
        <v-icon></v-icon>
        <v-speed-dial location="right center" activator="parent" open-on-hover>
          <v-btn class="mr-3" icon="mdi-dot" color="black" @click="color = 'black'" />
          <v-btn class="mr-3" icon="mdi-dot" color="red" @click="color = 'red'" />
          <v-btn class="mr-3" icon="mdi-dot" color="green" @click="color = 'green'" />
          <v-btn class="mr-3" icon="mdi-dot" color="blue" @click="color = 'blue'" />
        </v-speed-dial>
      </v-btn>
    </v-toolbar>
  </v-sheet>

</template>

<script lang="ts" setup>
import type { Layer } from 'konva/lib/Layer';
import type { Node } from 'konva/lib/Node';
import { Stage } from 'konva/lib/Stage';
import { ref, onMounted } from 'vue';
import type { VueKonvaRef } from 'vue-konva';

const stageSize = {
  width: window.innerWidth,
  height: window.innerHeight
};

const stage = ref<VueKonvaRef<Stage> | null>(null);
const gridLayer = ref<VueKonvaRef<Layer> | null>(null);
const drawLayer = ref<VueKonvaRef<Layer> | null>(null);
const tokenLayer = ref<VueKonvaRef<Layer> | null>(null);

interface Token {
  name: string,
  serial: number,
  id: string,
  x: number,
  y: number
}

interface Line {
  color: string,
  points: Array<number>
}

interface KonvaEvent<T> {
  evt: T
  target: Node | null
}

const tokens = ref<Array<Token>>([]);
const dragItemId = ref<string|null>(null);
const lines = ref<Array<Line>>([]);
const isDrawing = ref(false);
const shiftDown = ref(false);
const color = ref('black');

const handleDragstart = (e : KonvaEvent<DragEvent>) => {
  // save drag element:
  dragItemId.value = e.target!.id();
  // move current element to the top:
  const item = tokens.value.find(i => i.id === dragItemId.value);
  if (item)
  {
    const index = tokens.value.indexOf(item);
    tokens.value.splice(index, 1);
    tokens.value.push(item);
  }
};

const handleDragend = () => {
  dragItemId.value = null;
};

const handleMouseDown = (e : KonvaEvent<PointerEvent>) => {
  if (e.target?.getParent()?.getType() === 'Group') {
    return;
  }

  const stage = e.target?.getStage()
  if (stage)
  {    
    isDrawing.value = true;

    const pos = stage.getPointerPosition()!;
    lines.value.push({ color: shiftDown.value ? 'erase' : color.value, points: [pos.x, pos.y] });
  }
};

const handleMouseMove = (e: KonvaEvent<PointerEvent>) => {
  if (!isDrawing.value) {
    return;
  }
  // prevent scrolling on touch devices
  e.evt.preventDefault();

  const stage = e.target?.getStage();
  if (stage)
  {
    const point = stage.getPointerPosition()!;

    let lastLine = lines.value[lines.value.length - 1];
    lastLine.points = lastLine.points.concat([point.x, point.y]);
    lines.value.splice(lines.value.length - 1, 1, { ...lastLine });
  }
};

const handleMouseUp = () => {
  isDrawing.value = false;
};

const handleKeyDown = (e: KeyboardEvent) =>
{
  const scene = stage.value!.getNode();
  const pos = scene.getPointerPosition();
  if (!pos) return;

  if (e.key === 'Backspace' || e.key === 'Delete')
  {
    let shape = scene.getIntersection(pos) as Node;
    if (shape?.getType() === 'Shape')
    {
      if (shape.getParent()?.getType() === 'Group')
      {
        shape = shape.getParent()!;
      }
      const tokId = tokens.value.findIndex((elem) => 
      {
        return elem.id===shape.getAttrs().id
      });
      if (tokId > -1) tokens.value.splice(tokId, 1)
    }
  }
  else if (e.key === 'Shift')
  {
    shiftDown.value = true;
  }
  else if (/^[a-zA-Z]$/.test(e.key))
  {
    tokens.value.push({
      name: e.key.toUpperCase(),
      serial: tokens.value.length + 1,
      id: Math.round(Math.random() * 10000).toString(),
      x: pos.x,
      y: pos.y,
    });
  }
};

const handleKeyUp = (e : KeyboardEvent) => {
  if (e.key === 'Shift')
  {
    shiftDown.value = false;
  }
};

onMounted(() => {
  //appRef.value.focus();
   for (let n = 0; n < 5; n++) {
    tokens.value.push({
      name: 'A',
      serial: n+1,
      id: Math.round(Math.random() * 10000).toString(),
      x: Math.random() * stageSize.width,
      y: Math.random() * stageSize.height,
    });
  }
});


</script>
