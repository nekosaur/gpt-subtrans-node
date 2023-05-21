import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from 'openai'
import { parseResponse } from './helpers'
import { SubtitleLine, Subtitles } from './subtitles'

type TranslatorOptions = {
  apiKey: string
  instructions?: string
}

export type Translation = {
  lines: SubtitleLine[]
  summary?: string
}

export class Translator {
  api: OpenAIApi

  constructor(private options: TranslatorOptions) {
    const configuration = new Configuration({
      apiKey: this.options.apiKey,
    })

    this.api = new OpenAIApi(configuration)

    this.options.instructions ??= `Your task is to accurately translate subtitles into a target language. The user will provide lines from a scene in the following format:

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
  }

  public async translateLines(data: {
    subtitles: Subtitles
    lines: SubtitleLine[]
    summary?: string
  }): Promise<Translation> {
    const { subtitles, lines, summary } = data
    const messages: ChatCompletionRequestMessage[] = [
      {
        role: 'system',
        content: this.options.instructions,
      },
    ]

    let content = ''

    content += `Please translate these subtitles for the movie ${
      subtitles.movieName
    } into ${subtitles.targetLanguage}.\n\n${lines
      .map((line, index) => `<t id="${index + 1}">\n${line.original}\n</t>`)
      .join('\n')}`

    if (subtitles.synopsis) {
      content += `\n\nThe synopsis for the movie is:\n\n${subtitles.synopsis}`
    }

    if (summary) {
      content += `This is a summary of the current scene:\n\n${summary}`
    }

    messages.push({
      role: 'user',
      content,
    })

    const response = await this.api.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.1,
    })

    if (!response.data.choices.length) {
      throw new Error('no reponse')
    }

    if (response.data.choices[0].finish_reason !== 'stop') {
      throw new Error('finish_reason not stop')
    }

    const parsed = parseResponse(response.data.choices[0].message)

    if (parsed.lines.length !== data.lines.length) {
      throw new Error('Mismatch in translated lines')
    }

    return {
      lines: data.lines.map((line, index) => ({
        ...line,
        translated: parsed.lines[index],
      })),
      summary: parsed.summary,
    }
  }
}
