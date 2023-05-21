import { describe, expect, it } from '@jest/globals'
import { Subtitles, mergeScenes } from '../subtitles'

describe('subtitles', () => {
  describe('mergeScenes', () => {
    it('should merge scenes', () => {
      const subtitles: Subtitles = {
        filePath: '',
        movieName: '',
        targetLanguage: '',
        lines: [
          {
            index: 0,
            start: 0,
            end: 1,
            original: 'foo',
            translated: '',
          },
          {
            index: 1,
            start: 2,
            end: 3,
            original: 'bar',
            translated: '',
          },
          {
            index: 2,
            start: 3,
            end: 4,
            original: 'baz',
            translated: '',
          },
        ],
        scenes: [
          {
            lines: [0],
          },
          {
            lines: [1],
          },
          {
            lines: [2],
          },
        ],
      }

      const newSubtitles = mergeScenes({
        subtitles,
        scenes: [1, 2],
      })

      expect(newSubtitles.scenes).toEqual([
        {
          lines: [0],
        },
        {
          lines: [1, 2],
        },
      ])
    })
  })
})
