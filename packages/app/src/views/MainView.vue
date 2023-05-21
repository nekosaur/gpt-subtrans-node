<template>
  <v-navigation-drawer temporary></v-navigation-drawer>
  <v-footer app class="bg-grey-lighten-2">
    {{ selected.length }} scene(s) selected
    <v-btn :disabled="isTranslating" @click="handleSelectAll">select all</v-btn>
    <v-btn :disabled="isTranslating" @click="handleClearSelection"
      >clear selection</v-btn
    >
    <v-btn :disabled="isTranslating" @click="handleMergeScenes"
      >merge selected scenes</v-btn
    >
    <v-btn :disabled="isTranslating" @click="handleTranslate">translate</v-btn>
    <v-btn :disabled="isTranslating" @click="handleSave">save</v-btn>
  </v-footer>
  <v-main>
    <div class="d-flex flex-column ma-2">
      <template v-for="(scene, index) in scenes" :key="index">
        <div>
          <div class="d-flex justify-space-between">
            <div>
              <v-checkbox-btn
                v-model="selected"
                :value="index"
                :disabled="isTranslating"
              ></v-checkbox-btn>
              <h3>Scene {{ index + 1 }}</h3>
            </div>
            <template v-if="store.translating.includes(index)">
              <div>
                Translating
                <v-progress-circular indeterminate></v-progress-circular>
              </div>
            </template>
          </div>
          <template v-if="scene.summary">
            <v-alert type="info">
              {{ scene.summary }}
            </v-alert>
          </template>
          <v-card class="ma-2">
            <v-card-text>
              <template v-for="line in scene.lines" :key="line.index">
                <div class="mb-2">
                  <h6>Line {{ line.index + 1 }}</h6>
                  <h5>
                    {{ formatTimestamp(line.start) }} -
                    {{ formatTimestamp(line.end) }}
                  </h5>
                  <div class="d-flex justify-space-between">
                    <pre class="pa-2 bg-grey-lighten-4">{{
                      line.original
                    }}</pre>
                    <template v-if="line.translated">
                      <pre class="pa-2 bg-grey-lighten-4">{{
                        line.translated
                      }}</pre>
                    </template>
                  </div>
                </div>
              </template>
            </v-card-text>
          </v-card>
        </div>
      </template>
    </div>
  </v-main>
</template>

<script setup lang="ts">
import { useStore } from '../store'
import { computed } from 'vue'
import { formatTimestamp, getAllScenes } from '@gpt-subtrans-node/lib'
import { ref } from 'vue'
import { ipcRenderer } from 'electron'
import { toRaw } from 'vue'

const store = useStore()

const selected = ref<number[]>([])

const scenes = computed(() => {
  if (!store.subtitles) return []

  return getAllScenes(store.subtitles)
})

const isTranslating = computed(() => !!store.translating.length)

async function handleTranslate() {
  store.translating = selected.value

  ipcRenderer.send('app:subtitles:translate-scenes', {
    subtitles: toRaw(store.subtitles),
    scenes: toRaw(selected.value).sort((a, b) => a - b),
  })

  selected.value = []
}

function handleSelectAll() {
  selected.value = scenes.value.map((_, index) => index)
}

function handleClearSelection() {
  selected.value = []
}

async function handleMergeScenes() {
  ipcRenderer.send('app:subtitles:merge-scenes', {
    subtitles: toRaw(store.subtitles),
    scenes: toRaw(selected.value).sort((a, b) => a - b),
  })

  selected.value = []
}

async function handleSave() {
  ipcRenderer.invoke('app:subtitles:save-file-dialog', {
    subtitles: toRaw(store.subtitles),
  })
}
</script>
