import { acceptHMRUpdate, createPinia, defineStore } from 'pinia'
import { Subtitles } from '@gpt-subtrans-node/lib'
import { ipcRenderer } from 'electron'
import {
  SubtitleLine,
  SubtitleScene,
  getAllScenes,
} from '@gpt-subtrans-node/lib/src/subtitles'
import { toRaw } from 'vue'

type AppState = {
  subtitles: Subtitles | null
  translating: number[]
  selection: number[]
  notifications: { message: string }[]
}

export const pinia = createPinia()

export const useStore = defineStore('app', {
  state: (): AppState => {
    return {
      subtitles: null,
      translating: [],
      selection: [],
      notifications: [],
    }
  },
  getters: {
    scenes: state => {
      if (!state.subtitles) return []

      return getAllScenes(state.subtitles)
    }
  },
  actions: {
    selectAll () {
      this.selection = this.scenes.map((_, index) => index)
    },
    selectUntranslated () {
      this.selection = this.scenes.reduce((curr, scene, index) => {
        if (scene.lines.some(line => !line.translated)) {
          curr.push(index)
        }

        return curr
      }, [] as number[])
    },
    clearSelection () {
      this.selection = []
    },
    setSubtitles(subtitles: Subtitles) {
      this.subtitles = subtitles
    },
    insertLines(lines: SubtitleLine[]) {
      for (const line of lines) {
        this.subtitles?.lines.splice(line.index, 1, line)
      }
    },
    patchScene(scene: { index: number } & Partial<SubtitleScene>) {
      const currentScene = this.subtitles?.scenes[scene.index]

      if (!currentScene) return

      this.subtitles?.scenes.splice(scene.index, 1, {
        ...toRaw(currentScene),
        ...scene,
      })
    },
    pushNotification(notification: { message: string }) {
      this.notifications.push(notification)
    },
  },
})

ipcRenderer.on('ui:state:update', (_, data) => {
  const store = useStore(pinia)

  store.$patch(data)
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useStore, import.meta.hot))
}

ipcRenderer.on('ui:state:translate-scene:finish', (_, data) => {
  const store = useStore(pinia)

  store.insertLines(data.lines)
  store.patchScene({ index: data.index, summary: data.summary })
  store.translating = store.translating.filter((index) => index !== data.index)
})

ipcRenderer.on('ui:notification', (_, data) => {
  const store = useStore(pinia)

  store.pushNotification(data)
})

ipcRenderer.on('ui:state:translate-scene:error', (_, data) => {
  const store = useStore(pinia)

  store.translating = store.translating.filter((index) => index !== data.index)
})

ipcRenderer.on('ui:state:translate-scene:cancel', (_, data) => {
  const store = useStore(pinia)

  store.translating = store.translating.filter((index) => index !== data.index)
})
