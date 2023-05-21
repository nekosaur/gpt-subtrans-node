import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'
import SplashView from '../views/SplashView.vue'
import OpenView from '../views/OpenView.vue'
import MainView from '../views/MainView.vue'
import SettingsView from '../views/SettingsView.vue'
import { useStore } from '../store'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: SplashView,
  },
  {
    path: '/open',
    component: OpenView,
  },
  {
    path: '/main',
    component: MainView,
    beforeEnter(to, from) {
      const store = useStore()

      if (!store.subtitles) {
        return { path: '/' }
      }
    },
  },
  {
    path: '/settings',
    component: SettingsView,
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export { router }
