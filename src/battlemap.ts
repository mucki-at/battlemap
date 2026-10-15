import { syncedStore, getYjsDoc } from '@syncedstore/core';
import * as Y from 'yjs';
import YPartyServerProvider from 'y-partyserver/provider';
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
    $network: YPartyServerProvider | null;
    $awareness: Awareness | null;
    $feedback: NetworkStatus | null = null;

    constructor() {
        this.$store = syncedStore({
            lines: [] as Strokes.Line[],
            tokens: [] as Tokens.Token[],
        });
        this.$doc = getYjsDoc(this.$store);

        this.$network = null;
        this.$awareness = null;

        this.$user = { name: 'icognito', color:'black' };
    }

    public setFeedback(feedback: NetworkStatus | null = null) {
        this.$feedback = feedback;
        this.awarenessChanged();
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

        this.$network = new YPartyServerProvider(
            //'localhost:8787',
            'https://battlemap.login-89a.workers.dev',
            roomname,
            this.$doc,
            {
            }
        );

  
        this.$awareness = this.$network.awareness;
        this.$awareness.on('change', () => this.awarenessChanged());

        this.$awareness.setLocalState({ user: this.$user });
    }

    public disconnect() {
        if (this.$awareness)        {
            this.$awareness?.destroy();
            this.$awareness = null;
        }
        if (this.$network) {
            this.$network.disconnect();
            this.$network.destroy();
            this.$network = null;
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
