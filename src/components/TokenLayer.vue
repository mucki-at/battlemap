<template>
    <v-layer ref="layer">
        <token-shape      
            v-for="(item,i) in tokens"
            :key="item.id"
            v-model="tokens[i]!"
            @click="onTokenMenu"
        />
    </v-layer>
    <token-menu ref="tokenMenu" v-model="menuToken!" />
</template>

<script setup lang="ts">
import * as Tokens from '@/tokens';
import { onMounted, ref, } from 'vue';
import type { VueKonvaRef } from 'vue-konva';
import type Konva from 'konva';
import { deref, uid, keyContainer, type KonvaEvent } from '@/utils';
import { useSettings } from '@/settings';
import { useSession } from '@/session';
import TokenShape from './TokenShape.vue';
import TokenMenu from './TokenMenu.vue';
import * as Grid from '@/grid';

const settings = useSettings();
const session = useSession();
const layer = ref<VueKonvaRef<Konva.Layer>>();
const tokens =  defineModel<Array<Tokens.Token>>({ required: true });
const menuToken = ref<Tokens.Token>();
const tokenMenu = ref();

let currentKeyDown = '';

const SNAP = Number.MAX_VALUE;

function snapToGrid(pos: Konva.Vector2d, size: number) : boolean
{
    const [point, distance] = session.battlemap.grid.getNearest([pos.x, pos.y], size % 2 === 0 ? Grid.PointType.Corner : Grid.PointType.Center);
    if (distance < SNAP) {
       
        pos.x = point[0];
        pos.y = point[1];
        return true;
    }
    return false;
}

function handleDragStart(e: KonvaEvent<DragEvent>)
{
    const shape = e.target;
    if (!shape) return;
    shape.getStage()!.container().style.cursor = 'grabbing';
    shape.setAttrs({
        shadowBlur: 10,
        shadowOffsetX: 4,
        shadowOffsetY: 4,
    });
}

function handleDragUpdate(e: KonvaEvent<DragEvent>)
{
    const shape = e.target;
    if (!shape) return;
    const token = shape.getAttr('token') as Tokens.Token
    if (!token) return;

    const pos=shape.getPosition();
    if (e.evt.ctrlKey !== settings.snapToGrid)
    {
        if (snapToGrid(pos, token.size)) shape.setPosition(pos);
    }

    token.x = pos.x;
    token.y = pos.y;
}

function handleDragEnd(e: KonvaEvent<DragEvent>)
{
    handleDragUpdate(e);

    const shape = e.target;
    if (!shape) return;
    shape.getStage()!.container().style.cursor = 'grab';
    shape.setAttrs({
        cursor: 'grab',
        shadowBlur: 5,
        shadowOffsetX: 2,
        shadowOffsetY: 2,
    });
}


function handleKeyDown(e: KeyboardEvent) {
    const scene = deref(layer)?.getStage();
    const pos = scene?.getRelativePointerPosition();
    if (!scene || !pos) return;

    if (e.key === 'Backspace' || e.key === 'Delete') {   
        let shape = scene.getIntersection(scene.getPointerPosition()!) as Konva.Node;
        if (shape?.getType() === 'Shape') {
            const tokId = tokens.value.findIndex((elem) => {
                return elem.id === shape.getAttr('token').id;
            });
            if (tokId > -1) tokens.value.splice(tokId, 1);
        }
    } else if ((!currentKeyDown) && (/^[a-zA-Z]$/.test(e.key)))
    {
        currentKeyDown=e.key;
        if (settings.snapToGrid)
        {
            snapToGrid(pos, 1.0);
        }

        const n = e.key.toUpperCase();
        const s = Tokens.getSerial(n,tokens.value);
        tokens.value.push({
            name: e.key.toUpperCase(),
            serial: s,
            id: uid(),
            color: settings.color,
            size: 1,
            x: pos.x,
            y: pos.y,
        });
    }
}

function handleKeyUp(e: KeyboardEvent)
{
    if (currentKeyDown===e.key)
    {
        currentKeyDown='';        
    }
}

function onTokenMenu(e: KonvaEvent<MouseEvent>)
{
    const item = e.target?.getAttr('token') as Tokens.Token
    if (item) {
        menuToken.value=item;
        tokenMenu.value.showAt(e.evt.clientX,e.evt.clientY)
    }
}

onMounted(() => {
    const l = deref(layer)!;
    l.on('dragstart', handleDragStart);
    l.on('dragend', handleDragEnd);
    l.on('dragmove', handleDragUpdate);
    
    l.on('pointerenter', () => { l.getStage().container().style.cursor = 'grab' });
    l.on('pointerleave', () => { l.getStage().container().style.cursor = 'crosshair' });

    const cont = keyContainer(l);
    cont.addEventListener('keydown', handleKeyDown);
    cont.addEventListener('keyup', handleKeyUp);

});
</script>
