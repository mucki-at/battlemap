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
        const activeStroke = ref<Stroke>();
        const tokens = ref();
        const roomname = ref(battlemap.getRoomName());

        function setUser(user: User) { battlemap.setUser(user); }
        function switchRoom(room: string, user?: User)
        {
            battlemap.disconnect();
            if (user) battlemap.setUser(user);
            battlemap.connect(room);
            strokes.value = battlemap.getStrokes();
            tokens.value = battlemap.getTokens();
            roomname.value = battlemap.getRoomName();
        }

        return {
            networkStatus,
            strokes,
            activeStroke,
            tokens,
            roomname,
            setUser,
            switchRoom
        };
    },
    {
        persist: false,
    }
);
