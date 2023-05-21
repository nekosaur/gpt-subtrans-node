<template>
  <v-main>
    <div class="d-flex w-100 h-100 justify-center align-center">
      <v-btn @click="openFile"> open file </v-btn>
    </div>
    <v-dialog v-model="showDialog" content-class="align-center" persistent>
      <v-card width="80%">
        <v-card-text>
          <v-form ref="form" v-model="formIsValid">
            <v-text-field v-model="filePath" label="File path" disabled />
            <v-text-field v-model="movieName" label="Movie name" />
            <v-text-field v-model="targetLanguage" label="Target language" />
          </v-form>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn @click="handleCancel"> cancel </v-btn>
          <v-btn color="primary" :disabled="!formIsValid" @click="handleOk">
            ok
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-main>
</template>

<script setup lang="ts">
import { ipcRenderer } from 'electron'
import { useRouter } from 'vue-router'
import { ref } from 'vue'

const router = useRouter()

const filePath = ref()
const showDialog = ref(false)
const movieName = ref('')
const targetLanguage = ref('')
const form = ref()
const formIsValid = ref()

function handleCancel() {
  showDialog.value = false
  form.value?.reset()
}

async function handleOk() {
  if (formIsValid.value) {
    await ipcRenderer.invoke('app:subtitles:load', {
      filePath: filePath.value,
      movieName: movieName.value,
      targetLanguage: targetLanguage.value,
    })

    router.push({ path: '/main' })
  }
}

async function openFile() {
  const result = await ipcRenderer.invoke('app:subtitles:open-file-dialog')

  switch (result.status) {
    case 'new': {
      filePath.value = result.filePath
      showDialog.value = true
      break
    }
    case 'loaded': {
      router.push({ path: '/main' })
      break
    }
    default: {
      break
    }
  }
}
</script>
