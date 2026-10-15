import { syncedStore, getYjsDoc } from '@syncedstore/core';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { type Awareness } from 'y-protocols/awareness.js';

import * as Tokens from '@/tokens';
import * as Strokes from '@/strokes';

interface StoreType {
    lines: Strokes.Line[];
    tokens: Tokens.Token[];
}

export type ConnectionStatus = 'offline' | 'connecting' | 'online';

export interface User {
    name: string;
    color: string;
}

function isUser(obj: any): obj is User {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "name" in obj && typeof obj.name === "string" &&
    "color" in obj && typeof obj.color === "string"
  );
}

export interface NetworkStatus {
    state: ConnectionStatus;
    error?: string;
    users: User[];
}

export class BattleMap {
    $store: StoreType;
    $doc: Y.Doc;
    $user: User;
    $webrtc: WebrtcProvider | null;
    $awareness: Awareness | null;
    $feedback: NetworkStatus | null = null;

    constructor() {
        this.$store = syncedStore({
            lines: [] as Strokes.Line[],
            tokens: [] as Tokens.Token[],
        });
        this.$doc = getYjsDoc(this.$store);

        this.$webrtc = null;
        this.$awareness = null;

        this.$user = { name: 'icognito', color:'black' };
    }

    public setFeedback(feedback: NetworkStatus | null = null) {
        this.$feedback = feedback;
        this.updateFeedback();
    }

    protected updateFeedback() {
        if (!this.$feedback) return;
        if (!this.$webrtc) {
            this.$feedback.state = 'offline';
            this.$feedback.error = 'No network object!';
            this.$feedback.users = [];
        } else {
            this.$feedback.state = this.$webrtc.connected
                ? 'online'
                : this.$webrtc.shouldConnect
                  ? 'connecting'
                  : 'offline';
        }
    }

    public setUser(user: User) {
        this.$user = user;
        if (this.$awareness)
        {
            this.$awareness.setLocalState({'user' : this.$user});
        }
    }

    public connect(roomname: string) {
        this.disconnect();

        this.$webrtc = new WebrtcProvider(
            roomname,
            this.$doc,
            {
                // Specify signaling servers. The client will connect to every signaling server concurrently to find other peers as fast as possible.
                signaling: ['wss://fail.mucki.dev'],
                // If password is a string, it will be used to encrypt all communication over the signaling servers.
                // No sensitive information (WebRTC connection info, shared data) will be shared over the signaling servers.
                // The main objective is to prevent man-in-the-middle attacks and to allow you to securely use public / untrusted signaling instances.
                password: 'dev.mucki.battlemap',
                // Whether to disable WebRTC connections to other tabs in the same browser.
                // Tabs within the same browser share document updates using BroadcastChannels.
                // WebRTC connections within the same browser are therefore only necessary if you want to share video information too.
                filterBcConns: true,
                // simple-peer options. See https://github.com/feross/simple-peer#peer--new-peeropts for available options.
                // y-webrtc uses simple-peer internally as a library to create WebRTC connections.
                peerOpts: {}
            }
        );

  
        this.$awareness = this.$webrtc.awareness;
        this.$awareness.on('change', () => this.awarenessChanged());

        this.$awareness.setLocalState({ user: this.$user });
    }

    public disconnect() {
        if (this.$awareness)        {
            this.$awareness?.destroy();
            this.$awareness = null;
        }
        if (this.$webrtc) {
            this.$webrtc.disconnect();
            this.$webrtc.destroy();
            this.$webrtc = null;
        }
    }

    protected awarenessChanged()
    {
        if (this.$feedback) {
            const states = [...this.$awareness?.getStates().values() || []];
            const users: Array<User | null> = states.map(state => isUser(state.user) ? state.user as User : null);
            this.$feedback.users = users.filter(u => (u!== null));
            switch (this.$feedback.users.length)
            {
            case 0: this.$feedback.state = 'offline'; break;
            case 1: this.$feedback.state = 'connecting'; break;
            default: this.$feedback.state = 'online'; break;
            }
        }
    }


    public getTokens() {
        return this.$store.tokens;
    }
    public getLines() {
        return this.$store.lines;
    }
}
