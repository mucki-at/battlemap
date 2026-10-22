<template>
    <v-layer ref="layer">
        <token-shape      
            v-for="(item,i) in tokens"
            :key="item.id"
            v-model="tokens[i]"
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
import TokenShape from './TokenShape.vue';
import TokenMenu from './TokenMenu.vue';
import type { Point } from '@/strokes.ts';

const settings = useSettings();
const layer = ref<VueKonvaRef<Konva.Layer>>();
const tokens = defineModel<Array<Tokens.Token>>({ required: true });
const menuToken = ref<Tokens.Token>();
const tokenMenu = ref();

const GRIDSIZE = 50.0;
const SNAP = 50.0;

let currentKeyDown = '';

function toGrid(x: number, size: number) : number
{
    if (size<1.0) size=1.0;
    const ofs=(Math.round(size) % 2) * 25.0;

    return Math.round((x+ofs)/GRIDSIZE)*GRIDSIZE-ofs;
}

function snapToGrid(pos: Konva.Vector2d, size: number) : boolean
{
    const gridX=toGrid(pos.x, size);
    const gridY=toGrid(pos.y, size);
    if (Math.hypot(pos.x-gridX,pos.y-gridY) <= SNAP)
    {
        pos.x = gridX;
        pos.y = gridY;
        return true;
    }
    return false;
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
    l.on('dragend', handleDragUpdate);
    l.on('dragmove', handleDragUpdate);
    
    const cont = keyContainer(l);
    cont.addEventListener('keydown', handleKeyDown);
    cont.addEventListener('keyup', handleKeyUp);

});
</script>
