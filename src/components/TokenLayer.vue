<template>
    <v-layer ref="layer">
        <v-group       
            v-for="item in tokens"
            :key="item.id"
            :config="{ x: item.x, y: item.y, id: item.id, draggable: true }"
        >
            <v-circle
                :config="{
                    radius: 25,
                    fill: 'white',
                    stroke: item.color,
                    strokeWidth: 5,
                    scaleX: dragItemId === item.id ? 1.2 : 1.0,
                    scaleY: dragItemId === item.id ? 1.2 : 1.0,
                    shadowColor: 'black',
                    shadowBlur: 10,
                    shadowOffsetX: dragItemId === item.id ? 15 : 5,
                    shadowOffsetY: dragItemId === item.id ? 15 : 5,
                    shadowOpacity: 0.6,
                    shadowForStrokeEnabled: false,
                    perfectDrawEnabled: true, // Fixes many Safari shadow issues
                }"
            >
            </v-circle>
            <v-text
                :config="{
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
                    align: 'center',
                }"
            />
        </v-group>
    </v-layer>
</template>

<script setup lang="ts">
import * as Tokens from '@/tokens';
import { onMounted, ref } from 'vue';
import type { VueKonvaRef } from 'vue-konva';
import type Konva from 'konva';
import { deref, keyContainer, type KonvaEvent } from '@/utils';
import { useSettings } from '@/settings';

const settings = useSettings();

const layer = ref<VueKonvaRef<Konva.Layer>>();

const tokens = defineModel<Array<Tokens.Token>>({ required: true });
const dragItemId = ref<string | null>(null);

function handleDragStart(e: KonvaEvent<DragEvent>) {
    // save drag element:
    dragItemId.value = e.target!.id();
    // move current element to the top:
    const item = tokens.value.find((i) => i.id === dragItemId.value);
    if (item) {
        const index = tokens.value.indexOf(item);
        tokens.value.splice(index, 1);
        tokens.value.push(item);
    }
}

function handleDragEnd()
{
    dragItemId.value = null;
};

function handleKeyDown(e: KeyboardEvent) {
    const scene = deref(layer)?.getStage();
    const pos = scene?.getRelativePointerPosition();
    if (!scene || !pos) return;

    if (e.key === 'Backspace' || e.key === 'Delete') {
       
        let shape = scene.getIntersection(pos) as Konva.Node;
        if (shape?.getType() === 'Shape') {
            if (shape.getParent()?.getType() === 'Group') {
                shape = shape.getParent()!;
            }
            const tokId = tokens.value.findIndex((elem) => {
                return elem.id === shape.getAttrs().id;
            });
            if (tokId > -1) tokens.value.splice(tokId, 1);
        }
    } else if (/^[a-zA-Z]$/.test(e.key)) {
        tokens.value.push({
            name: e.key.toUpperCase(),
            serial: tokens.value.length + 1,
            id: Math.round(Math.random() * 10000).toString(),
            color: settings.color,
            x: pos.x,
            y: pos.y,
        });
    }
}

onMounted(() => {
    const l = deref(layer)!;
    l.on('dragstart', handleDragStart);
    l.on('dragend', handleDragEnd);
    
    const cont = keyContainer(l);
    cont.addEventListener('keydown', handleKeyDown);
});
</script>
