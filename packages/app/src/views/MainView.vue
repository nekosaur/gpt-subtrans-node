<template>
  <v-navigation-drawer temporary></v-navigation-drawer>
  <v-footer app class="bg-grey-lighten-2 justify-space-between">
    {{ store.selection.length }} scene(s) selected
    <div>
      <v-btn :disabled="isTranslating" @click="handleMergeScenes"
        >merge selected scenes</v-btn
      >
      <v-btn :disabled="isTranslating" @click="handleTranslate"
        >translate</v-btn
      >
      <v-btn :disabled="isTranslating" @click="handleSave">save</v-btn>
      <v-btn v-if="isTranslating" @click="cancelTranslate">Cancel</v-btn>
    </div>
  </v-footer>
  <v-main>
    <div class="d-flex flex-column ma-2">
      <template v-for="(scene, index) in scenes" :key="index">
        <div>
          <div class="d-flex justify-space-between my-2">
            <div class="d-flex align-center">
              <v-checkbox-btn
                v-model="store.selection"
                :value="index"
                :disabled="isTranslating"
              ></v-checkbox-btn>
              <h3 class="ml-2">Scene {{ index + 1 }}</h3>
              <template v-if="scene.summary">
                <v-btn variant="plain">
                  <v-icon icon="mdi-help-circle-outline" />
                  <v-tooltip activator="parent" location="bottom">
                    {{ scene.summary }}
                  </v-tooltip>
                </v-btn>
              </template>
            </div>
            <template v-if="store.translating.includes(index)">
              <div>
                Translating
                <v-progress-circular indeterminate></v-progress-circular>
              </div>
            </template>
          </div>
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
import { ipcRenderer } from 'electron'
import { toRaw } from 'vue'

const store = useStore()

const scenes = computed(() => {
  if (!store.subtitles) return []

  return getAllScenes(store.subtitles)
})

const isTranslating = computed(() => !!store.translating.length)

async function handleTranslate() {
  store.translating = store.selection

  ipcRenderer.send('app:subtitles:translate-scenes', {
    subtitles: toRaw(store.subtitles),
    scenes: toRaw(store.selection).sort((a, b) => a - b),
  })

  // TODO: reset selection to those translates that were not successful
  // store.selection = []
}

async function cancelTranslate() {
  ipcRenderer.send('app:subtitles:cancel-translate-scene', {
    scenes: toRaw(store.translating),
  })
  console.log('cancelling')
}

async function handleMergeScenes() {
  ipcRenderer.send('app:subtitles:merge-scenes', {
    subtitles: toRaw(store.subtitles),
    scenes: toRaw(store.selection).sort((a, b) => a - b),
  })

  store.selection = []
}

async function handleSave() {
  ipcRenderer.invoke('app:subtitles:save-file-dialog', {
    subtitles: toRaw(store.subtitles),
  })
}
</script>
