<script setup lang="ts">
import { watch } from 'vue'
import { useStore } from './store'
import { ipcRenderer } from 'electron'
import { toRaw } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const store = useStore()
const router = useRouter()
const route = useRoute()

// Is there a better place for this?
watch(
  () => store.subtitles,
  (_, oldValue) => {
    if (oldValue == null) return
    ipcRenderer.send('app:state:subtitles:save', {
      subtitles: toRaw(store.subtitles),
    })
  },
  {
    deep: true,
  }
)

function exit() {
  ipcRenderer.send('app:quit')
}

function openFile() {}

function openSettings() {
  router.push({ path: '/settings' })
}
</script>

<template>
  <v-app>
    <v-system-bar>
      <v-btn size="x-small" variant="plain">
        File
        <v-menu activator="parent">
          <v-list density="compact">
            <v-list-item @click="openFile">Open File</v-list-item>
            <v-list-item @click="openSettings">Settings</v-list-item>
            <v-divider class="my-2" />
            <v-list-item @click="exit">Exit</v-list-item>
          </v-list>
        </v-menu>
      </v-btn>
      <template v-if="route.name === 'main'">
        <v-btn size="x-small" variant="plain">
          Selection
          <v-menu activator="parent">
            <v-list density="compact">
              <v-list-item @click="store.selectAll">Select All</v-list-item>
              <v-list-item @click="store.selectUntranslated"
                >Select Untranslated</v-list-item
              >
              <v-divider class="my-2" />
              <v-list-item @click="store.clearSelection"
                >Clear Selection</v-list-item
              >
            </v-list>
          </v-menu>
        </v-btn>
      </template>
    </v-system-bar>
    <router-view></router-view>
  </v-app>
</template>

<style></style>
