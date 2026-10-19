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
        typeof obj === 'object' &&
        obj !== null &&
        'name' in obj &&
        typeof obj.name === 'string' &&
        'color' in obj &&
        typeof obj.color === 'string'
    );
}

export interface NetworkStatus {
    state: ConnectionStatus;
    error: string | null;
    users: User[];
}

export class BattleMap {
    $store: StoreType | null;
    $doc: Y.Doc | null;
    $user: User;
    $network: YPartyServerProvider | null;
    $awareness: Awareness | null;
    $feedback: NetworkStatus | null = null;

    constructor() {
        this.$store = null;
        this.$doc = null;
        this.$network = null;
        this.$awareness = null;

        this.$user = { name: 'icognito', color: 'black' };
    }

    public setFeedback(feedback: NetworkStatus | null = null) {
        this.$feedback = feedback;
        if (this.$network && this.$feedback) {
            this.$feedback.state = this.$network.wsconnected
                ? 'online'
                : this.$network.wsconnecting
                  ? 'connecting'
                  : 'offline';
        }
        this.onAwarenessChanged();
    }

    public getRoomName(): string {
        if (this.$network) return this.$network.roomname;
        else return 'Offline';
    }

    public setUser(user: User) {
        this.$user = user;
        if (this.$awareness) {
            this.$awareness.setLocalState({ user: this.$user });
        }
    }

    public connect(roomname: string) {
        this.disconnect();

        this.$store = syncedStore({
            lines: [] as Strokes.Line[],
            tokens: [] as Tokens.Token[],
        });
        this.$doc = getYjsDoc(this.$store);

        this.$network = new YPartyServerProvider(
            import.meta.env.VITE_PARTY_SERVER || '',
            roomname,
            this.$doc,
            {
                connect: false,
                disableBc: true,
            }
        );
        this.$network.on('status', (status: { status: string }) =>
            this.onNetworkStatusChanged(status.status)
        );
        this.$network.on('connection-close', (event: CloseEvent) =>
            this.onNetworkClosed(event)
        );

        this.$awareness = this.$network.awareness;
        this.$awareness.on('change', () => this.onAwarenessChanged());

        this.$awareness.setLocalState({ user: this.$user });

        this.$network.connect();
    }

    public disconnect() {
        if (this.$awareness) {
            this.$awareness?.destroy();
            this.$awareness = null;
        }
        if (this.$network) {
            this.$network.disconnect();
            this.$network.destroy();
            this.$network = null;
        }
        if (this.$doc) {
            this.$doc.destroy();
            this.$doc = null;
        }

        this.$store = null;
    }

    protected onNetworkStatusChanged(status: string) {
        if (this.$feedback) {
            if (status == 'connecting') this.$feedback.state = 'connecting';
            else if (status == 'connected')
                {
                    this.$feedback.state = 'online';
                    this.$feedback.error = null;
                }

            else this.$feedback.state = 'offline';
        }
    }

    protected onNetworkClosed(event: CloseEvent)
    {
        if (this.$feedback) {
            this.$feedback.state = 'offline';
            if (event.wasClean) this.$feedback.error = null;
            else this.$feedback.error = event.reason || 'network error';
        }
    }

    protected onAwarenessChanged() {
        if (this.$feedback) {
            const states = [...(this.$awareness?.getStates().values() || [])];
            const users: Array<User | null> = states.map((state) =>
                isUser(state.user) ? (state.user as User) : null
            );
            this.$feedback.users = users.filter((u) => u !== null);
        }
    }

    public getTokens() {
        return this.$store?.tokens || [];
    }
    public getLines() {
        return this.$store?.lines || [];
    }
}
