import { createApp } from 'vue'
import App from './App.vue'
import { router } from './plugins/router'
import { vuetify } from './plugins/vuetify'
import { pinia } from './store'

createApp(App)
  .use(pinia)
  .use(router)
  .use(vuetify)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
