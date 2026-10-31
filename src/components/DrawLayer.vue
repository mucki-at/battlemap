<template>
    <v-layer ref="layer" :config="{ listening: false }">
        <multi-polygon-shape v-for="[id, stroke] in session.strokes" :key="id"
            :config="{
                polygons: stroke.outline,
                fill: Strokes.isEraser(stroke) ? 'white' : stroke.color,
                globalCompositeOperation: Strokes.isEraser(stroke) ? 'destination-out' : 'source-over'
            }"
        />
        <v-line v-if="session.activeStroke"
            :config="{
                points: session.activeStroke.outline[0]![0]!.flatMap(x => x),
                fill: Strokes.isEraser(session.activeStroke) ? 'white' : session.activeStroke.color,
                globalCompositeOperation: Strokes.isEraser(session.activeStroke) ? 'destination-out' : 'source-over',
                closed: true
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
import { deref, keyContainer, uid, type KonvaEvent } from '@/utils';
import MultiPolygonShape from './MultiPolygonShape.vue';
import { useSettings } from '@/settings';
import { useSession } from '@/session';

const settings = useSettings();
const session = useSession();

const layer = ref<VueKonvaRef<Konva.Layer>>();

const eraseCursor = ref({
    id: 'eraseCursor',
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
    if (
        e.target?.attrs.id !== 'eraseCursor' &&
        e.target?.getStage() !== e.target
    )
        return;

    const stage = e.target?.getStage();
    if (stage && e.evt.buttons === DRAW_BUTTONS) {
        isPenDown = true;
        e.evt.preventDefault();

        const pos = stage.getRelativePointerPosition()!;
        Strokes.beginStroke(
            [pos.x, pos.y, e.evt.pressure || 0.5],
            eraseCursor.value.visible ? Strokes.ERASE : settings.color,
            eraseCursor.value.visible ? eraseCursor.value.radius * 2.0 : 8.0,
            e.evt.pointerType !== 'mouse'
        );
    }
}

function handleMouseMove(e: KonvaEvent<PointerEvent>) {
    const stage = e.target?.getStage();
    if (stage) {
        const point = stage.getRelativePointerPosition()!;

        if (eraseCursor.value.visible) moveEraseCursor(point);
        if (!isPenDown) return;

        if (e.evt.buttons === DRAW_BUTTONS) {
            e.evt.preventDefault();
            Strokes.continueStroke([point.x, point.y, e.evt.pressure || 0.5]);
        }
    }
}

function handleMouseUp(e: KonvaEvent<PointerEvent>)
{
    if (isPenDown)
    {
        const stage = e.target?.getStage();
        if (stage) {
            const point = stage.getRelativePointerPosition()!;
            Strokes.endStroke([point.x, point.y, e.evt.pressure || 0.5]);
        }
        else
        {
            Strokes.endStroke();
        }
    }
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
