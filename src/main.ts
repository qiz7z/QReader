import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import { useReaderStore } from '@/stores/reader'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// init reader store from localStorage
const readerStore = useReaderStore(pinia)
readerStore.initFromStorage()

app.mount('#app')
