<template>
  <v-main>
    <div class="d-flex w-100 h-100 justify-center align-center">
      <v-card width="75%" title="Settings">
        <v-card-text>
          <v-form v-model="isValid">
            <v-text-field
              v-model="settings.apiKey"
              label="API Key"
              :rules="[(v) => !!v || 'API Key is required']"
            ></v-text-field>
          </v-form>
          <v-btn :disabled="!isValid" @click="save">save</v-btn>
        </v-card-text>
      </v-card>
    </div>
  </v-main>
</template>

<script setup lang="ts">
import { ref, toRaw } from 'vue'
import { onBeforeMount } from 'vue'
import { ipcRenderer } from 'electron'
import { useRouter } from 'vue-router'

const router = useRouter()

const isValid = ref(false)
const settings = ref({
  apiKey: '',
})

onBeforeMount(async () => {
  settings.value = await ipcRenderer.invoke('app:get-settings')
})

async function save() {
  await ipcRenderer.invoke('app:set-settings', toRaw(settings.value))

  router.push({
    path: '/open',
  })
}
</script>
