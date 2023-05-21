import { app, ipcMain } from 'electron'
import ElectronStore from 'electron-store'
import { Subtitles } from '@gpt-subtrans-node/lib'
import * as path from 'path'
import fs from 'fs-extra'

type StoreData = {
  storagePath: string
  firstLoad: boolean
  settings: {
    apiKey: string
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
        settings: {
          apiKey: '',
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
