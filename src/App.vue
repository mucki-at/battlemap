<template theme="light">
    <v-sheet>
        <smart-stage>
            <grid-layer />
            <draw-layer v-model="session.lines" />
            <token-layer v-model="session.tokens" />
        </smart-stage>
    </v-sheet>
    <main-bar @show-settings="showSettings=true"/>
    <settings-dialog v-model="showSettings" />
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import SmartStage from '@/components/SmartStage.vue';
import GridLayer from '@/components/GridLayer.vue';
import DrawLayer from '@/components/DrawLayer.vue';
import TokenLayer from '@/components/TokenLayer.vue';
import MainBar from '@/components/MainBar.vue';
import SettingsDialog from './components/SettingsDialog.vue';

import { useSettings } from '@/settings';
import { useSession } from '@/session';

const settings = useSettings();
const session = useSession();

// BUGBUGBUG: update clients with settigns before v1
if ((settings.version<=1) && (settings.palette[1]=='red'))
{
    settings.palette = ['black', 'brown', 'gray', 'red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple'];
}


const showSettings = ref(!settings.isValid());

if (settings.isValid())
{
    session.switchRoom(settings.roomname, { name: settings.username, color: settings.usercolor });
}



</script>
