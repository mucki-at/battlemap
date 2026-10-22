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
            <v-btn style="margin: 3px" :icon="settings.snapToGrid ? 'mdi-magnet-on' : 'mdi-magnet'" @click="settings.snapToGrid=!settings.snapToGrid" />
            <v-btn style="margin: 3px" icon="mdi-cog" @click="$emit('showSettings')"/>
            <v-btn style="margin: 3px" icon="mdi-help" id="help-button"/>
            <v-menu activator="#help-button">
                <v-card>
                    <v-card-title>Help</v-card-title>
                    <v-card-subtitle>Controls</v-card-subtitle>
                    <v-card-text>
                        <ul>
                            <li>Left mosue button: Draw or drag tokens.</li>
                            <li>Right mouse button: Move map.</li>
                            <li>Shift: Erase (while drawing) / Zoom (while moving).</li>
                            <li>Ctrl: Snap to grid (while dragging tokens).</li>
                            <li>A-Z: Create token of that type at current position.</li>
                            <li>Backspace/Delete: Delete token under mouse.</li>
                            <li>Click tokens to change color/size.</li>
                        </ul>
                    </v-card-text>
                    <v-spacer />
                    <v-card-subtitle>Network</v-card-subtitle>
                    <v-card-text>
                        <ul>
                            <li>There is currently no permissions. Be careful!</li>
                            <li>Use the same room name to play with friends.</li>
                            <li>The contents get deleted when the last person leaves.</li>
                        </ul>
                    </v-card-text>
                </v-card>
            </v-menu>
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