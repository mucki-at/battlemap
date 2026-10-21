<template>
    <v-shape :config="config" />
</template>

<script setup lang="ts">

import * as Tokens from '@/tokens'
import type Konva from 'konva';
import { ref, watch } from 'vue'

const token = defineModel<Tokens.Token>({ required: true });

const RADIUS = 25;

function tokenShapeRectangle(shape: Konva.Shape)
{
    const token = shape.getAttr('token') as Tokens.Token || null;
    if (!token) return { x:0, y:0, width:0, height:0};
    else
    {
        const r = RADIUS*(Math.abs(token.size || 1.0));
        return {x: -r, y: -r, width: 2*r, height: 2*r }
    }
}

function drawTokenShape(context: Konva.Context, shape: Konva.Shape)
{
    const token = shape.getAttr('token') as Tokens.Token || null;
    if (!token) return;
    const r = RADIUS*(Math.abs(token.size || 1.0));

    context.beginPath();
    context.arc(0, 0, r, 0, Math.PI * 2, false);
    context.closePath();
    context.fillStrokeShape(shape);

    context.save();
    context.fillStyle = 'black';
    
    const [ label, discriminator ] = Tokens.getLabel(token);
    if (discriminator)
    {
        context.textAlign='left';
        context.textBaseline='top';
        context.font=`bold ${r}px serif`;
        const labelMetrics = context.measureText(label);
        context.font=`${r*0.6}px serif`;
        const discMetrics = context.measureText(discriminator);
        const totalWidth = labelMetrics.width + discMetrics.width;
        const labelHeight = labelMetrics.actualBoundingBoxDescent;
        const discHeight = discMetrics.actualBoundingBoxDescent;
        const totalHeight = labelHeight+discHeight*0.5;

        context.fillText(discriminator, labelMetrics.width-totalWidth*0.5, (labelHeight-discHeight*0.5)-totalHeight*0.5);
        context.font=`bold ${r}px serif`;
        context.fillText(label, -totalWidth*0.5, -totalHeight*0.5);
    }
    else
    {
        context.textAlign='center';
        context.textBaseline='middle';
        context.font=`bold ${r}px serif`;
        context.strokeText(label, 0, 0);
    }

    context.restore();
}

function drawTokenHitShape(context: Konva.Context, shape: Konva.Shape)
{
    const token = shape.getAttr('token') as Tokens.Token || null;
    if (!token) return;
    const r = RADIUS*(Math.abs(token.size || 1.0));

    context.beginPath();
    context.arc(0, 0, Math.abs(r), 0, Math.PI * 2, false);
    context.closePath();
    context.fillStrokeShape(shape);
}

const config = ref<Konva.ShapeConfig>({
    token: token.value,
    x: token.value.x,
    y: token.value.y,
    fill: 'white',
    stroke: token.value.color,
    strokeWidth: 4,
    draggable: true,
    selfRectFunc: tokenShapeRectangle,
    sceneFunc: drawTokenShape,
    hitFunc: drawTokenHitShape
})

watch(
    token,
    (newToken) => {
        config.value.token = newToken;
        config.value.x = newToken.x;
        config.value.y = newToken.y;
    },
    {
        deep: true
    }
);


</script>