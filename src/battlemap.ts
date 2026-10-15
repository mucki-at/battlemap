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

export class BattleMap {
    $store: StoreType;
    $doc: Y.Doc;
    $webrtc: WebrtcProvider;
    $awareness: Awareness;

    constructor(id: string = 'battlemap') {
        this.$store = syncedStore({
            lines: [] as Strokes.Line[],
            tokens: [] as Tokens.Token[],
        });
        this.$doc = getYjsDoc(this.$store);
/*        this.$webrtc = new WebrtcProvider(
            id,
            this.$doc
        );
        this.$awareness = this.$webrtc.awareness;
        
        // You can observe when a user updates their awareness information
        this.$awareness.on('change', () => {
            // Whenever somebody updates their awareness information,
            // we log all awareness information from all users.
            console.log(Array.from(this.$awareness.getStates().values()))
        })

        // You can think of your own awareness information as a key-value store.
        // We update our "user" field to propagate relevant user information.
        this.$awareness.setLocalStateField('user', {
            // Define a print name that should be displayed
            name: 'Emmanuelle Charpentier',
            // Define a color that should be associated to the user:
            color: '#ffb61e' // should be a hex color
        })*/
    }

    public getTokens() { return this.$store.tokens; }
    public getLines() { return this.$store.lines; }
}
