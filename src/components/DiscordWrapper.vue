<template>
    <v-overlay
      :model-value="waitingForDiscord"
      class="align-center justify-center"
    >
      <v-card width="20em" height="5em" loading="true" :title="discordStatus" />
    </v-overlay>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { DiscordSDK } from "@discord/embedded-app-sdk";

const emit = defineEmits(['setupComplete'])

const discordStatus = ref('');

let discordSdk: DiscordSDK | null = null;

interface DiscordResult
{
    user:string;
    room:string;
};

const waitingForDiscord = ref(false);
async function setupDiscordSdk() : Promise<DiscordResult>
{
    discordStatus.value='Starting Discord SDK';
    waitingForDiscord.value=true;

    console.log('Determining Discord App ID');
    let response = await fetch('/api/clientid');
    const { clientId } = await response.json();

    console.log(`Trying to set up discord SDK for client id ${clientId}`)

    discordSdk = new DiscordSDK(clientId);
    if (!discordSdk) throw new Error('No Discord SDK');

    discordStatus.value='Starting Discord SDK';
    await discordSdk.ready();
  
    // Authorize with Discord Client
    discordStatus.value='Authorizing client';
    const { code } = await discordSdk.commands.authorize({
        client_id: clientId,
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
    response = await fetch('/api/token', {
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

setupDiscordSdk().then((result: DiscordResult) => {
    console.log(result);
    emit("setupComplete", result.user, result.room);
}).catch((e) => {
    console.log(`Discord setup failed: ${e}. Running in standalone mode.`);
    emit("setupComplete");
}).finally(() => { waitingForDiscord.value=false; })

</script>