import { defineStore } from 'pinia';
import { ref } from 'vue';
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

        const lines = ref();
        const tokens = ref();
        const roomname = ref(battlemap.getRoomName());

        function setUser(user: User) { battlemap.setUser(user); }
        function switchRoom(room: string, user?: User)
        {
            battlemap.disconnect();
            if (user) battlemap.setUser(user);
            battlemap.connect(room);
            lines.value = battlemap.getLines();
            tokens.value = battlemap.getTokens();
            roomname.value = battlemap.getRoomName();
        }

        return {
            networkStatus,
            lines,
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
