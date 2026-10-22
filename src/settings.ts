import { defineStore } from 'pinia';
import { ref } from 'vue';

const CURRENT_VERSION=1;

export const useSettings = defineStore(
    'settings',
    () => { 
        const version = ref(CURRENT_VERSION);

        const username = ref('');
        const usercolor = ref(
            '#' +
                Math.floor(Math.random() * 16777215)
                    .toString(16)
                    .padStart(6, '0')
        );
        const roomname = ref('');

        const color = ref('black');
        
        const palette = ref(['black', 'brown', 'gray', 'red', 'orange', 'yellow', 'green', 'cyan', 'blue', 'purple']);
        const collapse = ref(true);

        const snapToGrid = ref(true);

        function isValid(): boolean {
            return (
                (username.value.trim().length >= 3) &&
                (roomname.value.trim().length > 0)
            );
        }

        return {
            version,
            username,
            usercolor,
            roomname,
            color,
            palette,
            collapse,
            snapToGrid,
            isValid,
        };
    },
    {
        persist: true
    }
);
