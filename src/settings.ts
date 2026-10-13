import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSettings = defineStore('settings', () =>
    {
        const color = ref('black');
        const palette = ref(['black', 'red', 'green', 'blue']);
        const collapse = ref(true);
        return { color, palette, collapse };
    },
    {
        persist: true,
    }
);
