import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import SplashView from '../views/SplashView.vue'
import OpenView from '../views/OpenView.vue'
import MainView from '../views/MainView.vue'
import SettingsView from '../views/SettingsView.vue'
import { useStore } from '../store'

const routes: RouteRecordRaw[] = [
  {
    name: 'splash',
    path: '/',
    component: SplashView,
  },
  {
    name: 'open',
    path: '/open',
    component: OpenView,
  },
  {
    name: 'main',
    path: '/main',
    component: MainView,
    beforeEnter(_to, _from) {
      const store = useStore()

      if (!store.subtitles) {
        return { path: '/' }
      }
    },
  },
  {
    name: 'settings',
    path: '/settings',
    component: SettingsView,
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export { router }
