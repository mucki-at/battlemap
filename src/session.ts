import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Stroke, StrokeMap } from '@/strokes';
import { BattleMap, type User, type NetworkStatus } from '@/battlemap';

export const useSession = defineStore(
    'session',
    () => {
        const networkStatus = ref({
            state: 'offline',
            error: null,
            users: [],
        } as NetworkStatus);

        const battlemap = new BattleMap();
        battlemap.setFeedback(networkStatus.value);

        const useDiscord = ref(false);

        const strokes = ref<StrokeMap>();
        const activeStrokes = ref<StrokeMap>();
        const myActiveStroke = ref<Stroke>();
        const tokens = ref();
        const roomname = ref(battlemap.getRoomName());

        function getClientId() : string { return battlemap.getClientId().toString(); }
        function setUser(user: User): void { battlemap.setUser(user); }
        function getUser(id: string): User | undefined { return battlemap.getUser(parseInt(id)); }

        function switchRoom(room: string, user?: User)
        {
            battlemap.disconnect();
            if (user) battlemap.setUser(user);
            battlemap.connect(room);
            strokes.value = battlemap.getStrokes();
            activeStrokes.value = battlemap.getActiveStrokes(); 
            tokens.value = battlemap.getTokens();
            roomname.value = battlemap.getRoomName();
        }

        return {
            networkStatus,
            strokes,
            activeStrokes,
            myActiveStroke,
            tokens,
            roomname,
            getClientId,
            setUser,
            getUser,
            switchRoom
        };
    },
    {
        persist: false,
    }
);
