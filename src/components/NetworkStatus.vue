<template>
    <v-btn :prepend-icon="statusIcon" :color="statusColor" :v-tooltip:start="`${session.networkStatus.state} ${session.networkStatus.users.length} users`">
        {{ description }}
        <v-menu activator="parent">
            <v-list>
                <v-list-item v-for="user of session.networkStatus.users" :key="user.name">
                    <v-icon icon="mdi-account" :color="user.color" />
                    {{user.name}}
                </v-list-item>
            </v-list>
        </v-menu>
    </v-btn>
</template>

<script lang="ts" setup>
import type { ConnectionStatus } from '@/battlemap'
import { computed } from 'vue';
import { useSession } from '@/session';
const session = useSession();

const description = computed(() => {
    if (session.networkStatus.error)
    {
        return session.networkStatus.error;
    }
    else
    {
        if (session.networkStatus.state == 'online')
        {
            return `${session.roomname} (${session.networkStatus.users.length})`;
        }
        else
        {
            return session.networkStatus.state;
        }
    }
});

const statusMap : Record<ConnectionStatus,{icon:string, color:string}> =
{
    'offline' : { icon: 'mdi-wifi-off', color: 'red' },
    'connecting' : { icon: 'mdi-wifi-sync', color: 'orange' },
    'online' : { icon: 'mdi-wifi', color: 'green' },
};

const statusIcon = computed(() => statusMap[session.networkStatus.state]?.icon || 'mdi-alert-circle')
const statusColor = computed(() => statusMap[session.networkStatus.state]?.color || 'red')

</script>