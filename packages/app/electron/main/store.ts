import { app, ipcMain } from 'electron'
import ElectronStore from 'electron-store'
import { Subtitles } from '@gpt-subtrans-node/lib'
import * as path from 'path'
import fs from 'fs-extra'

type StoreData = {
  storagePath: string
  firstLoad: boolean
  showAdvancedSettings: boolean
  settings: {
    apiKey: string
    instructions: string
  }
}

export class Store {
  store: ElectronStore<StoreData>

  constructor() {
    // const appPath = path.join(app.getPath("userData"), "gpt-subtrans-node");
    const storagePath = path.join(app.getPath('userData'), 'subtitles')

    fs.ensureDirSync(storagePath)

    this.store = new ElectronStore<StoreData>({
      defaults: {
        storagePath,
        firstLoad: true,
        showAdvancedSettings: true,
        settings: {
          apiKey: '',
          instructions: `Your task is to accurately translate subtitles into a target language. The user will provide lines from a scene in the following format:

<t id="1">
Dialogue to be translated
</t>

You should respond with one matching line in the target language for each original line, in the following format:

<t id="1">
Translated dialogue
</t>

It is important that you do not merge multiple lines into a single line, as this can lead to inaccuracies.

Your translations should be concise and accurate, while still sounding natural; do not improvise.

If the user provides a synopsis of the movie, a list of characters, or a summary of the current scene, use them to guide your translation.

Include a one or two line summary of recent events at the end of each reply, in the following format:

<s>
Summary
</s>
`
        },
      },
      watch: true,
    })
  }

  public get<K extends keyof StoreData>(key: K): StoreData[K] {
    return this.store.get(key)
  }

  public async loadSubtitleData(
    subtitleFilePath: string
  ): Promise<Subtitles | null> {
    try {
      const storagePath = this.store.get('storagePath')
      const filePath = path.join(
        storagePath,
        `${path.parse(subtitleFilePath).name}.json`
      )

      const json = await fs.readJSON(filePath, { encoding: 'utf-8' })

      return json as Subtitles
    } catch (err) {
      console.log(err)
      return null
    }
  }

  public async saveSubtitleData(subtitles: Subtitles): Promise<boolean> {
    try {
      const storagePath = this.store.get('storagePath')
      const filePath = path.join(
        storagePath,
        `${path.parse(subtitles.filePath).name}.json`
      )

      await fs.writeJSON(filePath, subtitles, {
        encoding: 'utf-8',
        spaces: 2,
      })

      return true
    } catch (err) {
      console.log(err)
      return false
    }
  }
}

export const store = new Store()

ipcMain.handle('app:get-settings', () => {
  return store.get('settings')
})

ipcMain.handle('app:set-settings', async (_, settings) => {
  store.store.set('settings', settings)
  store.store.set('firstLoad', false)
})

ipcMain.handle('app:get-show-advanced-settings', () => {
  return store.get('showAdvancedSettings')
})

ipcMain.handle('app:set-show-advanced-settings', (_, showAdvancedSettings) => {
  store.store.set('showAdvancedSettings', showAdvancedSettings)
})
