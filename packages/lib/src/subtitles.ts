import { parseSync, NodeCue, NodeList, stringifySync } from 'subtitle'
import detectFileEncodingAndLanguage from 'detect-file-encoding-and-language'
import * as fs from 'fs/promises'
import * as path from 'path'
import { estimateMeanThreshold, groupLines } from './helpers'
import deepmerge from 'deepmerge'

export type Subtitles = {
  movieName: string
  targetLanguage: string
  filePath: string
  outPath?: string
  synopsis?: string
  lines: SubtitleLine[]
  scenes: SubtitleScene[]
}

export type SubtitleLine = {
  index: number
  start: number
  end: number
  original: string
  translated: string
}

export type SubtitleScene = {
  lines: number[]
  summary?: string
}

export async function loadSubtitles(data: {
  filePath: string
  movieName: string
  targetLanguage: string
}): Promise<Subtitles> {
  const detected = await detectFileEncodingAndLanguage(data.filePath)
  const content = await fs.readFile(data.filePath)
  const decoder = new TextDecoder(detected.encoding.toLowerCase())
  const decoded = decoder.decode(content)

  const lines = parseSync(decoded)
    .filter((node): node is NodeCue => node.type === 'cue')
    .map((node, index) => ({
      index,
      start: node.data.start,
      end: node.data.end,
      original: node.data.text,
      translated: null,
    }))

  const scenes = groupLines(lines, estimateMeanThreshold(lines))

  const parsed = path.parse(data.filePath)

  return {
    ...data,
    outPath: path.join(parsed.dir, `${parsed.name}.ChatGPT${parsed.ext}`),
    lines,
    scenes,
  }
}

export async function saveSubtitles(subtitles: Subtitles): Promise<void> {
  if (subtitles.filePath === subtitles.outPath) {
    throw new Error('you will be overwriting original subtitle file')
  }

  const list: NodeList = subtitles.lines.map((line) => ({
    type: 'cue',
    data: {
      start: line.start,
      end: line.end,
      text: line.translated ?? line.original,
    },
  }))

  const data = stringifySync(list, { format: 'SRT' })

  try {
    await fs.writeFile(subtitles.outPath, data)
  } catch (err) {
    console.log(err)
  }
}

function isAdjacentScenes(scenes: number[]) {
  for (let i = 1; i < scenes.length; i++) {
    if (scenes[i] !== scenes[i - 1] + 1) {
      return false
    }
  }

  return true
}

export function mergeScenes(data: {
  subtitles: Subtitles
  scenes: number[]
}): Subtitles {
  const { subtitles, scenes } = data
  if (!isAdjacentScenes(scenes)) {
    throw new Error('Scenes not adjacent')
  }

  const lines = subtitles.scenes
    .slice(scenes.at(0), scenes.at(-1) + 1)
    .flatMap((scene) => scene.lines)
  const newScene = { lines }

  const newScenes = subtitles.scenes.slice()
  newScenes.splice(scenes.at(0), scenes.length, newScene)

  return deepmerge.all([{}, subtitles, { scenes: newScenes }], {
    arrayMerge: (a, b) => b,
  }) as Subtitles
}

export function updateLines(data: {
  subtitles: Subtitles
  lines: SubtitleLine[]
}): Subtitles {
  const { subtitles, lines } = data
  const newLines = subtitles.lines.slice()

  for (const line of lines) {
    newLines.splice(line.index, 1, line)
  }

  return deepmerge.all([{}, subtitles, { lines: newLines }], {
    arrayMerge: (a, b) => b,
  }) as Subtitles
}

export function updateScenes(data: {
  subtitles: Subtitles
  scenes: [number, SubtitleScene][]
}): Subtitles {
  const { subtitles, scenes } = data
  const newScenes = subtitles.scenes.slice()

  for (const [index, scene] of scenes) {
    newScenes.splice(index, 1, scene)
  }

  return deepmerge.all([{}, subtitles, { scenes: newScenes }], {
    arrayMerge: (a, b) => b,
  }) as Subtitles
}

export function getAllScenes(subtitles: Subtitles) {
  return subtitles.scenes.map((scene) => ({
    lines: scene.lines.map((lineIndex) => subtitles.lines[lineIndex]),
    summary: scene.summary,
  }))
}

export function getIndexedScenes(subtitles: Subtitles, scenes: number[]) {
  return scenes.map((sceneIndex) => ({
    index: sceneIndex,
    lines: subtitles.scenes[sceneIndex].lines.map(
      (lineIndex) => subtitles.lines[lineIndex]
    ),
    summary: subtitles.scenes[sceneIndex].summary,
  }))
}
