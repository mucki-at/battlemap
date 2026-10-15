<template>
    <v-toolbar floating collapse absolute location="bottom right">
        <v-btn :prepend-icon="statusIcon" :color="statusColor" :v-tooltip:start="`${props.status.state} ${props.status.users.length} users`">
            {{ props.status.users.length }}
            <v-menu activator="parent">
                <v-list-item v-for="user of props.status.users" :key="user.name">
                    <v-icon icon="mdi-account" :color="user.color" />
                    {{user.name}}
                </v-list-item>
            </v-menu>
        </v-btn>
    </v-toolbar>
</template>

<script lang="ts" setup>
import type { ConnectionStatus, User, NetworkStatus} from '@/battlemap'
import { computed } from 'vue';

const props = defineProps<{
  status: NetworkStatus
}>();

const statusMap : Record<ConnectionStatus,{icon:string, color:string}> =
{
    'offline' : { icon: 'mdi-wifi-off', color: 'red' },
    'connecting' : { icon: 'mdi-wifi-sync', color: 'orange' },
    'online' : { icon: 'mdi-wifi', color: 'green' },
};

const statusIcon = computed(() => statusMap[props.status.state]?.icon || 'mdi-alert-circle')
const statusColor = computed(() => statusMap[props.status.state]?.color || 'red')

</script>