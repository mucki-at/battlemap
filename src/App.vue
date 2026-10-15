<template>
    <v-sheet theme="light">
        <smart-stage>
            <grid-layer />
            <draw-layer v-model="lines" />
            <token-layer v-model="tokens" />
        </smart-stage>
    </v-sheet>
    <main-bar @show-settings="showSettings=true"/>
    <network-status-icon :status="networkStatus" />
    <settings-dialog v-model="showSettings" />
</template>

<script lang="ts" setup>
import { ref, watch, watchPostEffect} from 'vue';
import { BattleMap, type NetworkStatus } from '@/battlemap';
import SmartStage from '@/components/SmartStage.vue';
import GridLayer from '@/components/GridLayer.vue';
import DrawLayer from '@/components/DrawLayer.vue';
import TokenLayer from '@/components/TokenLayer.vue';
import MainBar from '@/components/MainBar.vue';
import SettingsDialog from './components/SettingsDialog.vue';
import NetworkStatusIcon from './components/NetworkStatus.vue';

import { useSettings } from '@/settings.ts';
const settings = useSettings();

const showSettings = ref(!settings.isValid());

const networkStatus = ref({
    state:'offline',
    users: []
} as NetworkStatus)

const battlemap = new BattleMap();
battlemap.setFeedback(networkStatus.value);
if (settings.isValid())
{
    battlemap.setUser({ name: settings.username, color: settings.usercolor });
    battlemap.connect(settings.roomname);
}


const lines = battlemap.getLines();
const tokens = battlemap.getTokens();

watch(
    () => settings.roomname,
    (room) => {
        if (settings.isValid())
        {
            battlemap.setUser({ name: settings.username, color: settings.usercolor });
            battlemap.connect(room);
        }
        else
        {
            battlemap.disconnect();
        }
    },
    {
        flush: 'post'
    }
);

watchPostEffect(
    () => { battlemap.setUser({ name: settings.username, color: settings.usercolor})},
)
 


</script>
