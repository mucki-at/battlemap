<template>
    <v-layer ref="layer">
        <token-shape      
            v-for="(item,i) in tokens"
            :key="item.id"
            v-model="tokens[i]"
            @click="onTokenMenu"
        />
    </v-layer>
    <token-menu ref="tokenMenu" v-model="menuToken" />
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

const settings = useSettings();
const layer = ref<VueKonvaRef<Konva.Layer>>();
const tokens = defineModel<Array<Tokens.Token>>({ required: true });
const menuToken = ref<Tokens.Token>();
const tokenMenu = ref();

function handleDragStart(e: KonvaEvent<DragEvent>)
{
}

function handleDragUpdate(e: KonvaEvent<DragEvent>)
{
    const item = e.target?.getAttr('token') as Tokens.Token
    if (item) {
        const pos = e.target!.getPosition();
        item.x = pos.x;
        item.y = pos.y;
    }    
}

function handleDragEnd(e: KonvaEvent<DragEvent>)
{
    // move current element to the top:
    const item = e.target?.getAttr('token') as Tokens.Token
    if (item) {
        const pos = e.target!.getPosition();
        item.x = pos.x;
        item.y = pos.y;
    }
};

function handleKeyDown(e: KeyboardEvent) {
    const scene = deref(layer)?.getStage();
    const pos = scene?.getRelativePointerPosition();
    if (!scene || !pos) return;

    if (e.key === 'Backspace' || e.key === 'Delete') {
       
        let shape = scene.getIntersection(pos) as Konva.Node;
        if (shape?.getType() === 'Shape') {
            const tokId = tokens.value.findIndex((elem) => {
                return elem.id === shape.getAttr('token').id;
            });
            if (tokId > -1) tokens.value.splice(tokId, 1);
        }
    } else if (/^[a-zA-Z]$/.test(e.key)) {
        tokens.value.push({
            name: e.key.toUpperCase(),
            serial: tokens.value.length + 1,
            id: uid(),
            color: settings.color,
            size: 1,
            x: pos.x,
            y: pos.y,
        });
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
    
    const cont = keyContainer(l);
    cont.addEventListener('keydown', handleKeyDown);

});
</script>
