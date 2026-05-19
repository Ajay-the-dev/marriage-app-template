 import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import App from './App.vue'
import router from './router'

import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/main.scss'

const app = createApp(App)
const pinia = createPinia()

pinia.use(piniaPluginPersistedstate) // Enable persistence globally

app.use(pinia)
app.use(router)

app.mount('#app')