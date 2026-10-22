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
    <v-overlay
      :model-value="waitingForDiscord"
      class="align-center justify-center"
    >
      <v-progress-circular
        color="primary"
        size="64"
        indeterminate
      ></v-progress-circular>
      <v-label>{{discordStatus}}</v-label>
    </v-overlay>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import SmartStage from '@/components/SmartStage.vue';
import GridLayer from '@/components/GridLayer.vue';
import DrawLayer from '@/components/DrawLayer.vue';
import TokenLayer from '@/components/TokenLayer.vue';
import MainBar from '@/components/MainBar.vue';
import SettingsDialog from './components/SettingsDialog.vue';

import { DiscordSDK } from "@discord/embedded-app-sdk";
let discordSdk: DiscordSDK | null = null;

interface DiscordResult
{
    user:string;
    room:string;
};

const waitingForDiscord = ref(false);
const showSettings = ref(false);
const discordStatus = ref('');

async function setupDiscordSdk() : Promise<DiscordResult>
{
    if (!discordSdk) throw new Error('No Discord SDK');

    discordStatus.value='Starting Discord SDK';
    await discordSdk.ready();
  
    // Authorize with Discord Client
    discordStatus.value='Authorizing client';
    const { code } = await discordSdk.commands.authorize({
        client_id: import.meta.env.VITE_DISCORD_CLIENT_ID,
        response_type: "code",
        state: "",
        prompt: "none",
        scope: [
        "identify",
        "guilds",
        "applications.commands"
        ],
    });

    // Retrieve an access_token from your activity's server
    const response = await fetch('/api/token', {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            code,
        }),
    });
    const { access_token } = await response.json();

    // Authenticate with Discord client (using the access_token)
    discordStatus.value='Authenticating user';
    const auth = await discordSdk.commands.authenticate({
        access_token,
    });

    if (auth == null) {
        throw new Error("Authenticate command failed");
    }

    discordStatus.value='Success';
    console.log(auth);
    console.log(discordSdk);

    return {
        user: auth.user.username,
        room: discordSdk.instanceId
    };
}

import { useSettings } from '@/settings';
import { useSession } from '@/session';

const settings = useSettings();
const session = useSession();

// BUGBUGBUG: update clients with settigns before v1
if ((settings.version<=1) && (settings.palette[1]=='red'))
{
    settings.palette = ['black', 'brown', 'gray', 'red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple'];
}

try
{
    discordSdk = new DiscordSDK(import.meta.env.VITE_DISCORD_CLIENT_ID);
    waitingForDiscord.value=true;
    setupDiscordSdk().then((result: DiscordResult) => {
        console.log(result);
        settings.username = result.user;
        settings.roomname = result.room;
        session.switchRoom(settings.roomname, { name: settings.username, color: settings.usercolor });
        waitingForDiscord.value=false;
    }).catch((e) => {
        discordStatus.value=`ERROR: ${e.message || 'unknown'}, ${e.reason || 'unknown'}`;
    });
} catch (e) {
    console.log(`Discord setup failed: ${e}. Running in standalone mode.`);
    if (settings.isValid())
    {
        session.switchRoom(settings.roomname, { name: settings.username, color: settings.usercolor });
    }
    else
    {
        showSettings.value = true;
    }
}


</script>
