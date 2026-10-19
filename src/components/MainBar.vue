<template>
    <v-toolbar :collapse="settings.collapse" floating absolute location="top left" >
        <template v-slot:prepend>
            <v-fade-transition hide-on-leave>
                <v-btn
                    :icon="settings.collapse ? 'mdi-menu' : 'mdi-close'"
                    @click="settings.collapse = !settings.collapse"
                ></v-btn>
          </v-fade-transition>
        </template>
        <template v-slot:append>
            <network-status-icon v-if="!settings.collapse"/>
            <v-btn
                style="margin: 10px" 
                icon="mdi-dot"
                size="small"
                :color="settings.color"
                variant="elevated"
                :v-tooltip="{ location: tooltipLocation, text: 'Change color'}"
            >
                <v-icon></v-icon>
                <v-speed-dial
                    :location="dialLocation"
                    activator="parent"
                    open-on-hover
                >
                    <v-btn v-for="item in settings.palette" :key="item"
                    style="margin: 3px" 
                        icon="mdi-dot"
                        size="small"
                        :color="item"
                        @click="settings.color = item"
                    />
                </v-speed-dial>
            </v-btn>
            <v-btn style="margin: 3px" icon="mdi-grid" disabled/>
            <v-btn style="margin: 3px" icon="mdi-magnet" disabled/>
            <v-btn style="margin: 3px" icon="mdi-cog" @click="$emit('showSettings')"/>
        </template>
    </v-toolbar>
</template>

<script lang="ts" setup>
import { useSettings } from '@/settings.ts';
import { toRef } from 'vue';
import NetworkStatusIcon from '@/components/NetworkStatus.vue';

const settings = useSettings();
const dialLocation = toRef(() => settings.collapse ? 'right center' : 'bottom center')
const tooltipLocation = toRef(() => settings.collapse ? 'bottom' : 'right')

</script>