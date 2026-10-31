/**
 * main.ts
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */

// Composables
import { createApp } from 'vue'

// Plugins
import { registerPlugins } from '@/plugins'

// Components
import App from './App.vue'

// Styles
import 'unfonts.css'

const app = createApp(App)
registerPlugins(app)

 import { initStrokes } from '@/strokes.ts'
 initStrokes(); // hook up session store now that it is valid

app.mount('#app')
