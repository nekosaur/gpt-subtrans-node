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

const t = new Translator({
  apiKey: store.get('settings').apiKey,
})

const translateQueue = new Queue<
  {
    id: string
    subtitles: Subtitles
    lines: SubtitleLine[]
    summary?: string
  },
  Translation
>({
  process: async (task, callback) => {
    try {
      const translation = await t.translateLines(task)

      callback(null, translation)
    } catch (err) {
      callback(err)
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

  let id = 0
  for (const scene of scenes) {
    id += 1
    translateQueue.push(
      {
        id: String(id),
        subtitles: data.subtitles,
        lines: scene.lines,
        summary: scene.summary,
      },
      (err, translation) => {
        if (err) {
          win.webContents.send('ui:state:translate-scene:error', {
            err
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

ipcMain.on('app:subtitles:merge-scenes', async (_, data: { subtitles: Subtitles, scenes: number[] }) => {
  const subtitles = mergeScenes(data)

  win.webContents.send('ui:state:update', {
    subtitles,
  })
})

ipcMain.on('app:state:subtitles:save', (_, data: { subtitles: Subtitles }) => {
  fileQueue.push(data.subtitles, (err, result) => {
    if (!err) {
      win.webContents.send('ui:notification', {
        message: 'Subtitle data saved',
      })
    }
  })
})
