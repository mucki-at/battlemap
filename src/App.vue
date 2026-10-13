<template>
    <v-sheet theme="light">
        <smart-stage>
            <grid-layer />
            <draw-layer v-model="lines" />
            <token-layer v-model="tokens" />
        </smart-stage>
    </v-sheet>
    <main-bar />
</template>

<script lang="ts" setup>
import { ref, shallowRef } from 'vue';
import * as Tokens from '@/tokens';
import * as Strokes from '@/strokes';
import SmartStage from '@/components/SmartStage.vue';
import GridLayer from '@/components/GridLayer.vue';
import DrawLayer from '@/components/DrawLayer.vue';
import TokenLayer from '@/components/TokenLayer.vue';
import MainBar from '@/components/MainBar.vue';

const tokens = ref<Array<Tokens.Token>>([]);
const lines = shallowRef<Array<Strokes.Line>>([]);
</script>
