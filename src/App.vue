<template>
    <v-sheet theme="light">
        <smart-stage>
            <grid-layer />
            <draw-layer v-model="lines" />
            <token-layer v-model="tokens" />
        </smart-stage>
    </v-sheet>
    <main-bar @show-settings="showSettings=true"/>

    <settings-dialog v-model="showSettings" />
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { BattleMap } from '@/battlemap';
import SmartStage from '@/components/SmartStage.vue';
import GridLayer from '@/components/GridLayer.vue';
import DrawLayer from '@/components/DrawLayer.vue';
import TokenLayer from '@/components/TokenLayer.vue';
import MainBar from '@/components/MainBar.vue';
import SettingsDialog from './components/SettingsDialog.vue';

import { useSettings } from '@/settings.ts';
const settings = useSettings();

const showSettings = ref(!settings.isValid());

const battlemap = new BattleMap();
const lines = battlemap.getLines();
const tokens = battlemap.getTokens();
</script>
