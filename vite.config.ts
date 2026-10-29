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
        cloudflare({
            persistState: false,    // we do not have server-side persistance yet, so also do not persist on client
            tunnel: { name: 'battlemap-dev' },
        }),
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('src', import.meta.url)),
        },
    },
    server: {
        allowedHosts: [ "battlemap-dev.mucki.dev" ]
    }
});
