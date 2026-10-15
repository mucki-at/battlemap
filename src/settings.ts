import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettings = defineStore(
    'settings',
    () => {
        const username = ref('');
        const usercolor = ref(
            '#' +
                Math.floor(Math.random() * 16777215)
                    .toString(16)
                    .padStart(6, '0')
        );
        const roomname = ref('');

        const color = ref('black');
        const palette = ref(['black', 'red', 'green', 'blue']);
        const collapse = ref(true);

        function isValid(): boolean {
            return (
                (username.value.trim().length >= 3) &&
                (roomname.value.trim().length > 0)
            );
        }

        return {
            username,
            usercolor,
            roomname,
            color,
            palette,
            collapse,
            isValid,
        };
    },
    {
        persist: true,
    }
);
