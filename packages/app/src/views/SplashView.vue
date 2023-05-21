<template>
  <v-main>
    <div class="d-flex w-100 h-100 justify-center align-center">
      <v-progress-circular indeterminate />
    </div>
  </v-main>
</template>

<script setup lang="ts">
import { ipcRenderer } from 'electron'
import { useRouter } from 'vue-router'

const router = useRouter()

ipcRenderer.on('app:finish-load', (_, firstLoad) => {
  if (firstLoad) {
    router.push({ path: '/settings' })
  } else {
    router.push({ path: '/open' })
  }
})
</script>
