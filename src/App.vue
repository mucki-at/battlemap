<template>
  <v-sheet theme="light" tabindex="0" @keydown="handleKeyDown" @keyup="handleKeyUp">
    <v-stage ref="stage" :config="stageSize" @dragstart="handleDragstart" @dragend="handleDragend"
      @pointerdown="handleMouseDown" @pointermove="handleMouseMove" @pointerup="handleMouseUp"
      @wheel="handleMouseWheel" @contextmenu="handleContextMenu" v-resize="onResize">

      <v-layer ref="gridLayer" :config="{listening: false, x:-2500, y:-2500}">
        <v-line v-for="i in 100" :key="i" :config="{
          points: [0, i * 50, 5000, i * 50],
          stroke: '#ddd',
          strokeWidth: 1
        }" />
        <v-line v-for="i in 100" :key="i" :config="{
          points: [i * 50, 0, i * 50, 5000],
          stroke: '#ddd',
          strokeWidth: 1
        }" />
      </v-layer>
      <v-layer ref="drawLayer">
        <v-line v-for="(line, i) in lines" :key="i" :config="{
          points: line.points,
          stroke: line.color,
          strokeWidth: line.color === 'erase' ? 50 : 5,
          tension: 0.5,
          lineCap: 'round',
          lineJoin: 'round',
          globalCompositeOperation: line.color === 'erase' ? 'destination-out' : 'source-over'
        }" />
        <v-circle :config="eraseCursor" />
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
            shadowOpacity: 0.6,
            perfectDrawEnabled: true // Fixes many Safari shadow issues
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
    <v-toolbar floating absolute location="bottom right">
      <v-label>Lines: {{ lines.length }}</v-label>
    </v-toolbar>
  </v-sheet>

</template>

<script lang="ts" setup>
import type { Layer } from 'konva/lib/Layer';
import type { Node } from 'konva/lib/Node';
import { Stage } from 'konva/lib/Stage';
import type { Vector2d } from 'konva/lib/types';
import { ref, triggerRef, onMounted, shallowRef } from 'vue';
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
const lines = shallowRef<Array<Line>>([]);
const isDrawing = ref(false);
const shiftDown = ref(false);
const color = ref('black');
let lastMousePosition: Vector2d = { x: 0, y: 0};

const eraseCursor = ref({
  visible: false,
  stroke: 'gray',
  strokeWidth: 1.0,
  fill: null,
  radius: 25,
  x: 0,
  y: 0
});

const DRAW_BUTTONS = 1
const PAN_BUTTONS = 2
const ERASE_KEY = 'Shift'

function showEraseCursor(show: boolean)
{
  eraseCursor.value.visible = show;
  stage.value?.getStage().container().style.setProperty('cursor', show ? 'none' : 'default');
}

function moveEraseCursor(pos: Vector2d)
{
  eraseCursor.value.x = pos.x;
  eraseCursor.value.y = pos.y;
}

function resizeEraseCursor(scale: number)
{
  eraseCursor.value.strokeWidth= 1.0 / scale;
  eraseCursor.value.radius = 25.0 / scale;
  eraseCursor.value.visible = true
}

function findSegements(points: Array<number>, pos: Vector2d, r: number, inside:boolean)
{
  // Step 1: find all the places the line enters or leaves the circle
  const segments = [];
  let prevIn = !inside;
  let i = 0;
  while (i < points.length) {
    const test = Math.hypot(pos.x - points[i], pos.y - points[i + 1]) <= r;
    if (test != prevIn) {
      segments.push(i);
    }
    prevIn = test;
    i += 2;
  }
  if (prevIn === inside) segments.push(points.length);
  return segments;
}

interface Splice {
  index: number,
  delete: number,
  add: Array<Line>
};

function trimPoints(pos: Vector2d, r: number)
{
  const splices = new Array<Splice>();
  let modified = false;
  for (let i=lines.value.length-1; i>=0; --i)
  {
    const points = lines.value[i].points;
    // Step 1: find all the parts of the line which are not inside the circle
    const segments = findSegements(points, pos, r, false);

    // Step 2: trim all the deletd points. might split or delete lines
    if (segments.length == 0) // line is gone
    {
      splices.push({
        index: i,
        delete: 1,
        add: []
      });
      modified = true;
    }
    else if (segments.length == 2)
    {
      if (segments[1]!=points.length)
      {
        points.splice(segments[1]);
        modified = true;
      }
      if (segments[0]!=0)
      {
        points.splice(0, segments[0]);
        modified = true;
      }
    }
    else
    {
      lines.value[i].points = points.slice(segments[0], segments[1]);
      let newLines = []
      for (let j = 2; j<segments.length; j+=2)
      {
        newLines.push({
          color: lines.value[i].color,
          points: points.slice(segments[j], segments[j + 1])
        });
      }
      splices.push({
        index: i+1,
        delete: 0,
        add: newLines
      });
      modified = true;
    }
  }

  // Step 3: insert/delete all the new/deleted line segments in the right slots
  // we do this *after* iterating over the existing lines (and back to front) to
  // make sure the indices are valid
  for (const splice of splices) {
    lines.value.splice(splice.index, splice.delete, ...splice.add);
  }   

  if (modified) triggerRef(lines);
}

function handleContextMenu(e : KonvaEvent<PointerEvent>)
{
  e.evt.preventDefault();
};

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

    if (e.evt.buttons === PAN_BUTTONS)
    {
      lastMousePosition.x = stage.getPointerPosition()!.x;
      lastMousePosition.y = stage.getPointerPosition()!.y;
    }
    else if (e.evt.buttons === DRAW_BUTTONS)
    {
      const pos = stage.getRelativePointerPosition()!;
      if (shiftDown.value)
      {
        trimPoints(pos, eraseCursor.value.radius);
      }
      else
      {
        lines.value.push({ color: color.value, points: [pos.x, pos.y] });
        triggerRef(lines);
      }
    }
  }
};

const handleMouseMove = (e: KonvaEvent<PointerEvent>) => {

  // prevent scrolling on touch devices
  e.evt.preventDefault();

  const stage = e.target?.getStage();
  if (stage)
  {
    const point = stage.getRelativePointerPosition()!;

    if (shiftDown.value) moveEraseCursor(point);
    if (!isDrawing.value) {
      return;
    }

    if (e.evt.buttons === PAN_BUTTONS)
    {
      const pointer = stage.getPointerPosition()!;
      const mousePointTo = {
        x: (pointer.x - stage.x()) / stage.scaleX(),
        y: (pointer.y - stage.y()) / stage.scaleY(),
      };

      let dx = pointer.x - lastMousePosition.x;
      let dy = pointer.y - lastMousePosition.y;
      lastMousePosition.x = pointer.x;
      lastMousePosition.y = pointer.y;

      const newPos = {
        x: pointer.x + dx - mousePointTo.x * stage.scaleX(),
        y: pointer.y + dy - mousePointTo.y * stage.scaleY(),
      };

      stage.position(newPos)

    }
    else if (e.evt.buttons === DRAW_BUTTONS)
    {
      if (shiftDown.value)
      {
        trimPoints(point, eraseCursor.value.radius);
      }
      else
      {
        let lastLine = lines.value[lines.value.length - 1];
        lastLine.points = lastLine.points.concat([point.x, point.y]);
        triggerRef(lines);
        //lines.value.splice(lines.value.length - 1, 1, { ...lastLine });
      }
    }
  }
};

const handleMouseUp = () => {
  isDrawing.value = false;
};

const handleMouseWheel = (e: KonvaEvent<WheelEvent>) => {
  e.evt.preventDefault();

  const scene = stage.value!.getNode();
  const oldScale = scene.scaleX();
  const pointer = scene.getPointerPosition()!;

  const mousePointTo = {
    x: (pointer.x - scene.x()) / oldScale,
    y: (pointer.y - scene.y()) / oldScale,
  };

  // how to scale? Zoom in? Or zoom out?
  let direction = e.evt.deltaY > 0 ? -1 : 1;

  // when we zoom on trackpad, e.evt.ctrlKey is true
  // in that case lets revert direction
  if (e.evt.ctrlKey) {
    direction = -direction;
  }

  const scaleBy = 1.1;
  const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

  scene.scale({ x: newScale, y: newScale });
  resizeEraseCursor(newScale);

  const newPos = {
    x: pointer.x - mousePointTo.x * newScale,
    y: pointer.y - mousePointTo.y * newScale,
  };
  scene.position(newPos);
};


const handleKeyDown = (e: KeyboardEvent) =>
{
  const scene = stage.value!.getNode();
  const pos = scene.getRelativePointerPosition();
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
  else if (e.key === ERASE_KEY)
  {
    shiftDown.value = true;
    showEraseCursor(true);
    moveEraseCursor(pos);
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
  if (e.key === ERASE_KEY)
  {
    shiftDown.value = false;
    showEraseCursor(false);
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

function onResize() {
  const scene = stage.value!.getStage();
  scene.width(window.innerWidth);
  scene.height(window.innerHeight);
}

</script>
