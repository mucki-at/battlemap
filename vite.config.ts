import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import Vue from '@vitejs/plugin-vue';
import VueDevTools from 'vite-plugin-vue-devtools';
import Fonts from 'unplugin-fonts/vite';
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify';
import { cloudflare } from '@cloudflare/vite-plugin';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        Vue({
            template: { transformAssetUrls },
        }),
        // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
        Vuetify({
            autoImport: true,
            styles: {
                configFile: 'src/styles/settings.scss',
            },
        }),
        Fonts({
            fontsource: {
                families: [
                    {
                        name: 'Roboto',
                        weights: [100, 300, 400, 500, 700, 900],
                        styles: ['normal', 'italic'],
                    },
                ],
            },
        }),
        VueDevTools(),
        cloudflare(),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('src', import.meta.url)),
        }
    }
});
