<template>
    <v-layer :config="{ listening: false, clearBeforeDraw: true }">
        <v-shape :config="gridConfig" />
    </v-layer>
</template>

<script setup lang="ts">
import { useSession } from '@/session';
import type Konva from 'konva';
import * as Grid from '@/grid';

const session = useSession();

const gridConfig = {
    x: 0,
    y: 0,
    width: 1000,
    height: 1000,
    //fill: 'white',
    stroke: '#ccc',
    strokeWidth: 1,
    hitFunc: function() {},
    selfRectFunc: (self: Konva.Shape) => {
        const stage = self.getStage();
        if (!stage) {
            return { x: 0, y: 0, width: 0, height: 0 };
        }

        // Invert the shape's absolute transform to map viewport corners to local space
        const invTransform = self.getAbsoluteTransform().copy().invert();
        const w = stage.width();
        const h = stage.height();

        const corners = [
            invTransform.point({ x: 0, y: 0 }),
            invTransform.point({ x: w, y: 0 }),
            invTransform.point({ x: w, y: h }),
            invTransform.point({ x: 0, y: h }),
        ];

        const xs = corners.map((p) => p.x);
        const ys = corners.map((p) => p.y);

        const minX = Math.min(...xs);
        const minY = Math.min(...ys);
        const maxX = Math.max(...xs);
        const maxY = Math.max(...ys);

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        };
    },
    sceneFunc: function(ctx: Konva.Context, self: any) {
        const grid = session.battlemap.grid;
        const viewport = self.getSelfRect();
        const [tl, d1] = grid.getNearest([viewport.x, viewport.y], Grid.PointType.Corner);
        const [br, d2] = grid.getNearest([viewport.x + viewport.width, viewport.y + viewport.height], Grid.PointType.Corner);

        ctx.beginPath();
        for (let x = tl[0]; x <= br[0]; x += grid.size) {
            ctx.moveTo(x, viewport.y);
            ctx.lineTo(x, viewport.y+viewport.height);
        }

        for (let y = tl[1]; y <= br[1]; y += grid.size) {
            ctx.moveTo(viewport.x, y);
            ctx.lineTo(viewport.x+viewport.width, y);
        }

        ctx.fillStrokeShape(self);
    }
};  
</script>