<template>
    <v-shape :config="{ ...config, sceneFunc:drawStroke }" />
</template>

<script setup lang="ts">

import type { MultiPolygon } from '@/strokes'
import type Konva from 'konva';

interface MultiPolygonConfig extends Konva.ShapeConfig
{
    polygons: MultiPolygon;
}

interface Props
{
    config: MultiPolygonConfig
}
defineProps<Props>();

function drawStroke(context: Konva.Context, shape: Konva.Shape)
{
    const polygons = shape.getAttr('polygons') as MultiPolygon || null;
    if (!polygons) return;

    context.beginPath();
    for (const poly of polygons)
    {
        for (const ring of poly)
        {
            if (ring.length<3) continue;
            context.moveTo(ring[0]![0], ring[0]![1]);
            for (let i=1; i<ring.length; ++i)
                context.lineTo(ring[i]![0], ring[i]![1]);
            context.closePath();
        }
    }
    context.fillStrokeShape(shape);
}

</script>