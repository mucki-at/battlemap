/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Types
import type { App } from 'vue';

// Plugins
import vuetify from '@/plugins/vuetify';
import VueKonva from 'vue-konva';
import pinia from '@/plugins/pinia';

export function registerPlugins(app: App) {
    app.use(vuetify);
    app.use(VueKonva);
    app.use(pinia);
}
