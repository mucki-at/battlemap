<template>
    <v-layer ref="layer">
        <v-line
            v-for="(line, i) in lines"
            :key="i"
            :config="{
                points: line.points,
                stroke: line.color,
                strokeWidth: 5,
                tension: 0.5,
                lineCap: 'round',
                lineJoin: 'round',
                globalCompositeOperation: 'source-over',
            }"
        />
        <v-circle :config="eraseCursor" />
    </v-layer>
</template>

<script setup lang="ts">
import * as Strokes from '@/strokes';
import type { VueKonvaRef } from 'vue-konva';
import type Konva from 'konva';
import { onMounted, ref, triggerRef } from 'vue';
import type { Vector2d } from 'konva/lib/types';
import { deref, keyContainer, type KonvaEvent } from '@/utils';
import { useSettings } from '@/settings.ts';

const settings = useSettings();

const lines = defineModel<Array<Strokes.Line>>({ required: true });
const layer = ref<VueKonvaRef<Konva.Layer>>();

const eraseCursor = ref({
    visible: false,
    stroke: 'gray',
    strokeWidth: 1.0,
    fill: null,
    radius: 25,
    x: 0,
    y: 0,
});

const DRAW_BUTTONS = 1;
const ERASE_KEY = 'Shift';

let isPenDown = false;

function showEraseCursor(show: boolean) {
    eraseCursor.value.visible = show;
    deref(layer)!
        .getStage()
        .container()
        .style.setProperty('cursor', show ? 'none' : 'default');
}

function moveEraseCursor(pos: Vector2d) {
    eraseCursor.value.x = pos.x;
    eraseCursor.value.y = pos.y;
}

function resizeEraseCursor(scale: number) {
    eraseCursor.value.strokeWidth = 1.0 / scale;
    eraseCursor.value.radius = 25.0 / scale;
    eraseCursor.value.visible = true;
}

function handleMouseDown(e: KonvaEvent<PointerEvent>) {
    if (e.target?.getStage() !== e.target) return;

    const stage = e.target?.getStage();
    if (stage && e.evt.buttons === DRAW_BUTTONS) {
        isPenDown = true;

        const pos = stage.getRelativePointerPosition()!;
        if (eraseCursor.value.visible) {
            if (Strokes.trimLines(lines.value, pos, eraseCursor.value.radius)) {
                triggerRef(lines);
            }
        } else {
            lines.value.push({
                color: settings.color,
                points: [pos.x, pos.y],
            });
            triggerRef(lines);
        }
    }
}

function handleMouseMove(e: KonvaEvent<PointerEvent>) {
    const stage = e.target?.getStage();
    if (stage) {
        const point = stage.getRelativePointerPosition()!;

        if (eraseCursor.value.visible) moveEraseCursor(point);
        if (!isPenDown) return;

        if (e.evt.buttons === DRAW_BUTTONS) {
            if (eraseCursor.value.visible) {
                if (Strokes.trimLines(lines.value, point, eraseCursor.value.radius)) {
                    triggerRef(lines);
                }
            } else {
                let lastLine = lines.value[lines.value.length - 1];
                lastLine.points = lastLine.points.concat([point.x, point.y]);
                triggerRef(lines);
            }
        }
    }
}

function handleMouseUp() {
    isPenDown = false;
}

function handleKeyDown(e: KeyboardEvent) {
    const l = deref(layer);
    if (!l) return;

    if (e.key === ERASE_KEY) {
        const pos = l.getRelativePointerPosition();
        if (!pos) return;

        showEraseCursor(true);
        moveEraseCursor(pos);
        resizeEraseCursor(l.getStage().scaleX());
    }
}

function handleKeyUp(e: KeyboardEvent) {
    if (e.key === ERASE_KEY) {
        showEraseCursor(false);
    }
}

onMounted(() => {
    const stage = deref(layer)!.getStage();
    const cont = keyContainer(stage);
    cont.addEventListener('keydown', handleKeyDown);
    cont.addEventListener('keyup', handleKeyUp);

    stage.on('pointerdown', handleMouseDown);
    stage.on('pointermove', handleMouseMove);
    stage.on('pointerup', handleMouseUp);
});
</script>
