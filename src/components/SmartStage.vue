<template>
    <v-stage
        ref="stageRef"
        :config="stageSize"
        @pointerdown="handleMouseDown"
        @pointermove="handleMouseMove"
        @touchmove="handleTouchMove"
        @pointerup="handleMouseUp"
        @wheel="handleMouseWheel"
        @contextmenu="handleContextMenu"
        @mouseenter="handleMouseEnter"
        v-resize="onResize"
        >
        <slot />
    </v-stage>
</template>

<script lang="ts" setup>

import { onMounted, ref } from 'vue';
import type Konva from 'konva';
import type { VueKonvaRef } from 'vue-konva';
import type { Vector2d } from 'konva/lib/types';
import { deref, keyContainer, type KonvaEvent } from '../utils.ts';

defineEmits(['dragstart', 'dragend'])

const stageSize = ref({
    width: window.innerWidth,
    height: window.innerHeight,
});
const stageRef = ref<VueKonvaRef<Konva.Stage>>();

let isPanning = false;
let lastMousePosition: Vector2d = { x: 0, y: 0 };

const PAN_BUTTONS = 2;

function handleContextMenu(e: KonvaEvent<PointerEvent>)
{
    e.evt.preventDefault();
}

function focus()
{
    const cont = keyContainer(deref(stageRef)!);
    // @ts-expect-error: focusVisible is a new optional parameter (See MDN)
    cont.focus({ preventScroll: true, focusVisible: false });
}

function handleMouseEnter()
{
    focus();
}

function handleMouseDown(e: KonvaEvent<PointerEvent>)
{
    const stage = deref(stageRef);
    if (stage && (stage === e.target)) {
        if (e.evt.buttons === PAN_BUTTONS) {
            // prevent scrolling on touch devices
            e.evt.preventDefault();

            isPanning = true;
            lastMousePosition.x = stage.getPointerPosition()!.x;
            lastMousePosition.y = stage.getPointerPosition()!.y;
        }
    }
};

function handleTouchMove(e: KonvaEvent<ToggleEvent>)
{
    e.evt.preventDefault();
}

function handleMouseMove(e: KonvaEvent<PointerEvent>) 
{
    const stage = deref(stageRef);
    if (stage && (stage === e.target)) {

        if (!isPanning) return;

        // prevent scrolling on touch devices
        e.evt.preventDefault();

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

            if (e.evt.shiftKey)
            {
                const oldScale = stage.scaleX();
                const newScale = oldScale * Math.pow(2.0, -dy/200.0);

                stage.scale({ x: newScale, y: newScale });
            
                const newPos = {
                    x: pointer.x - mousePointTo.x * newScale,
                    y: pointer.y - mousePointTo.y * newScale,
                };
                stage.position(newPos);
            }
            else
            {
                const newPos = {
                    x: pointer.x + dx - mousePointTo.x * stage.scaleX(),
                    y: pointer.y + dy - mousePointTo.y * stage.scaleY(),
                };

                stage.position(newPos);
            }
        }
    }
};

function handleMouseUp()
{
    isPanning = false;
};

function handleMouseWheel(e: KonvaEvent<WheelEvent>)
{
    const stage = deref(stageRef);
    if (stage && (stage === e.target)) {
        e.evt.preventDefault();

        const oldScale = stage.scaleX();
        const pointer = stage.getPointerPosition()!;

        const mousePointTo = {
            x: (pointer.x - stage.x()) / oldScale,
            y: (pointer.y - stage.y()) / oldScale,
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

        stage.scale({ x: newScale, y: newScale });

        const newPos = {
            x: pointer.x - mousePointTo.x * newScale,
            y: pointer.y - mousePointTo.y * newScale,
        };
        stage.position(newPos);
    }
};

function onResize() {
    stageSize.value.width=window.innerWidth;
    stageSize.value.height=window.innerHeight;
}

onMounted(() => {
    const cont = keyContainer(deref(stageRef)!);
    cont.tabIndex = 1;
    focus();
})
</script>