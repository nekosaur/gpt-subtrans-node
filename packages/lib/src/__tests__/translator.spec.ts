import { describe, expect, it } from '@jest/globals'
import { Translator } from '..'

describe('translator', () => {
  describe('translateLines', () => {
    it('should translate lines', async () => {
      const translator = new Translator({
        apiKey: process.env.OPENAPI_KEY,
      })

      return translator
        .translateLines({
          lines: [
            {
              start: 0,
              end: 1,
              index: 0,
              original: `-Fais pas le malin !
-A terre, je veux voir vos mains !`,
              translated: '',
            },
          ],
          subtitles: {
            filePath: '',
            lines: [],
            movieName: 'Anti gang',
            scenes: [],
            targetLanguage: 'English',
          },
        })
        .then((t) => {
          expect(t).toMatchObject({ foo: 'bar' })
        })
    })
  })
})
