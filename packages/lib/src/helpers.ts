import OpenAI from 'openai'
import { encode } from 'gpt-tokenizer'
import { XMLParser } from 'fast-xml-parser'
import { SubtitleLine, SubtitleScene } from './subtitles'

export function countTokens(
  messages: OpenAI.Chat.ChatCompletionMessageParam[]
) {
  const tokens = messages.reduce((total, msg) => {
    return total + 4 + encode(msg.content).length + encode(msg.role).length + 2
  }, 0)

  console.log(tokens)
}

export function parseResponse(
  response: OpenAI.Chat.Completions.ChatCompletionMessage
): {
  lines: string[]
  summary: string
} {
  const parser = new XMLParser()
  const parsed = parser.parse(response.content)

  return {
    lines: Array.isArray(parsed.t) ? parsed.t : [parsed.t],
    summary: parsed.s,
  }
}

export function filterFulfilled<T>(
  value: PromiseSettledResult<T>
): value is PromiseFulfilledResult<T> {
  return value.status === 'fulfilled'
}

export function estimateMedianThreshold(lines: SubtitleLine[]): number {
  const diffs = lines.map(({ end }, i) => {
    const nextPair = lines[i + 1]
    if (nextPair) {
      const { start: nextStart } = nextPair
      return nextStart - end
    }
    return 0 // assume zero time difference for last pair
  })
  const medianDiff = median(diffs)
  return medianDiff
}

export function estimateMeanThreshold(lines: SubtitleLine[]): number {
  const diffs = lines.map(({ end }, i) => {
    const nextPair = lines[i + 1]
    if (nextPair) {
      const { start: nextStart } = nextPair
      return nextStart - end
    }
    return 0 // assume zero time difference for last pair
  })
  const meanDiff = mean(diffs)
  return meanDiff
}

function median(arr: number[]): number {
  const sorted = arr.slice().sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2
  } else {
    return sorted[middle]
  }
}

function mean(arr: number[]): number {
  return arr.reduce((curr, value) => curr + value, 0) / arr.length
}

export function groupLines(
  lines: SubtitleLine[],
  threshold = 1
): SubtitleScene[] {
  const scenes: SubtitleScene[] = [
    {
      lines: [0],
    },
  ]

  for (let i = 1; i < lines.length; i++) {
    const currentScene = scenes.at(-1)
    const previousLine = lines[currentScene.lines.at(-1)]
    const currentLine = lines[i]
    const { end: prevEnd } = previousLine
    const { start: currStart } = currentLine
    if (currStart - prevEnd <= threshold) {
      currentScene.lines.push(i)
    } else {
      scenes.push({
        lines: [i],
      })
    }
  }

  return scenes
}

export function pickIndices<T extends []>(arr: T, indices: number[]) {
  return indices.map((index) => arr[index])
}
