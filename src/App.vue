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
import type { Token, Line } from '@/types.ts';
import SmartStage from '@/components/SmartStage.vue';
import GridLayer from '@/components/GridLayer.vue';
import DrawLayer from '@/components/DrawLayer.vue';
import TokenLayer from '@/components/TokenLayer.vue';
import MainBar from '@/components/MainBar.vue';

const tokens = ref<Array<Token>>([]);
const lines = shallowRef<Array<Line>>([]);
</script>
