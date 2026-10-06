/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Types
import type { App } from 'vue'

// Plugins
import vuetify from './vuetify'
import VueKonva from 'vue-konva';

export function registerPlugins (app: App) {
  app.use(vuetify)
  app.use(VueKonva)
}
