<template>
  <v-main>
    <div class="d-flex w-100 h-100 flex-column pa-4">
      <div class="d-flex w-100 justify-space-between align-center mb-4">
        <h4 class="text-h4">Settings</h4>
        <v-switch
          class="flex-0-0"
          color="info"
          label="Show advanced settings"
          hide-details
          :model-value="showAdvanced"
          @click="toggleAdvanced"
        />
      </div>
      <v-card title="OpenAI">
        <v-card-text>
          <v-form v-model="isValid">
            <v-text-field
              v-model="settings.apiKey"
              label="API Key"
              :rules="[(v) => !!v || 'API Key is required']"
            ></v-text-field>
          </v-form>
        </v-card-text>
      </v-card>
      <template v-if="showAdvanced">
        <v-card title="Translator" class="mt-4">
          <v-card-text>
            <v-textarea
              v-model="settings.instructions"
              label="Instructions"
              auto-grow
              max-rows="20"
            />
          </v-card-text>
        </v-card>
      </template>
      <v-btn class="mt-4" color="info" :disabled="!isValid" @click="save"
        >save</v-btn
      >
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
  instructions: '',
})
const showAdvanced = ref(false)

onBeforeMount(async () => {
  settings.value = await ipcRenderer.invoke('app:get-settings')
  showAdvanced.value = await ipcRenderer.invoke(
    'app:get-show-advanced-settings'
  )
})

function toggleAdvanced() {
  ipcRenderer.invoke('app:set-show-advanced-settings', !showAdvanced.value)
  showAdvanced.value = !showAdvanced.value
}

async function save() {
  await ipcRenderer.invoke('app:set-settings', toRaw(settings.value))

  router.go(-1)
}
</script>
