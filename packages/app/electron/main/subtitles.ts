import { ipcMain, dialog } from 'electron'
import crypto from 'node:crypto'
import {
  Queue,
  Translation,
  Translator,
  loadSubtitles,
  SubtitleLine,
  Subtitles,
  getIndexedScenes,
  mergeScenes,
  saveSubtitles,
} from '@gpt-subtrans-node/lib'
import { store } from './store'
import { win } from '.'

global.crypto = crypto

const translator = new Translator({
  apiKey: store.get('settings').apiKey,
  instructions: store.get('settings').instructions,
})

const translateQueue = new Queue<
  {
    id: number
    subtitles: Subtitles
    lines: SubtitleLine[]
    summary?: string
  },
  Translation
>({
  id: "id",
  process: async (task, callback) => {
    const abortController = new AbortController();

    translator.translateLines(task, { signal: abortController.signal }).then(translation => {
      callback(null, translation);
    }).catch(err => {
      callback(err)
    })

    return {
      cancel: () => {
        abortController.abort()
      }
    }
  },
})

const fileQueue = new Queue({
  process: async (subtitles, callback) => {
    await store.saveSubtitleData(subtitles)

    callback(null)
  },
  concurrent: 1,
})

ipcMain.handle('app:subtitles:open-file-dialog', async () => {
  const files = dialog.showOpenDialogSync({
    properties: ['openFile'],
    filters: [
      {
        extensions: ['srt'],
        name: 'Subtitles (.srt)',
      },
    ],
  })

  if (!files?.length) return null

  const subtitleData = await store.loadSubtitleData(files[0])

  if (subtitleData) {
    win.webContents.send('ui:state:update', {
      subtitles: subtitleData,
    })

    return {
      status: 'loaded',
    }
  }

  return {
    status: 'new',
    filePath: files[0],
  }
})

ipcMain.handle('app:subtitles:save-file-dialog', async (_, data: { subtitles: Subtitles }) => {
  const outPath = dialog.showSaveDialogSync(null, {
    defaultPath: data.subtitles.outPath,
    filters: [
      {
        extensions: ['srt'],
        name: 'Subtitles (.srt)',
      },
    ],
  })

  const newSubtitles = {
    outPath,
    ...data.subtitles,
  }

  win.webContents.send('ui:state:update', {
    subtitles: newSubtitles,
  })

  await saveSubtitles(newSubtitles)
})

ipcMain.handle('app:subtitles:load', async (_, data: { filePath: string, movieName: string, targetLanguage: string }) => {
  const subtitles = await loadSubtitles(data)

  win.webContents.send('ui:state:update', {
    subtitles,
  })
})

ipcMain.on('app:subtitles:translate-scenes', async (_, data: { subtitles: Subtitles, scenes: number[] }) => {
  const scenes = getIndexedScenes(data.subtitles, data.scenes)

  for (const scene of scenes) {
    translateQueue.push(
      {
        id: scene.index,
        subtitles: data.subtitles,
        lines: scene.lines,
        summary: scene.summary,
      },
      (error, translation) => {
        if (error) {
          console.log('error!!', error)
          win.webContents.send('ui:state:translate-scene:error', {
            index: scene.index,
            error,
          })
        } else {
          console.log('translation done', translation)
          win.webContents.send('ui:state:translate-scene:finish', {
            index: scene.index,
            ...translation,
          })
        }
      }
    )
  }
})

ipcMain.on('app:subtitles:cancel-translate-scene', async (_, data: { scenes: number [] }) => {
  for (const scene of data.scenes) {
    translateQueue.cancel(scene, () => {
      win.webContents.send('ui:state:translate-scene:cancel', {
        index: scene,
      })
    })
  }
})

ipcMain.on('app:subtitles:merge-scenes', async (_, data: { subtitles: Subtitles, scenes: number[] }) => {
  const subtitles = mergeScenes(data)

  win.webContents.send('ui:state:update', {
    subtitles,
  })
})

ipcMain.on('app:state:subtitles:save', (_, data: { subtitles: Subtitles }) => {
  fileQueue.push(data.subtitles, (err, _) => {
    if (!err) {
      win.webContents.send('ui:notification', {
        message: 'Subtitle data saved',
      })
    }
  })
})
