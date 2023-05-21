<script setup lang="ts">
import { watch } from 'vue'
import { useStore } from './store'
import { ipcRenderer } from 'electron'
import { toRaw } from 'vue'

const store = useStore()

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
</script>

<template>
  <v-app>
    <router-view></router-view>
  </v-app>
</template>

<style></style>
