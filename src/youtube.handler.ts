import { fetchTranscript, type TranscriptResponse } from 'youtube-transcript-plus';
import type { Content, Part } from '@google/genai';

import type { MessageHandler, MessageContext } from './handler.interface.js';
import { runPrompt } from './genai.js';

const YT_URL_REGEX = /(https?\:\/\/)?((www\.|m\.)?youtube\.com|youtu\.be)\/.+/;

const YT_SYSTEM_PROMPT = `Você análisa vídeos e transcrições de vídeos YouTube para WhatsApp. Responda APENAS com informação do conteúdo.

REGRAS:
1. Inicie direto com a resposta - sem saudações ou introduções
2. Seja claro e objetivo.
3. Transcrições têm erros (IA): ignore sintaxe, extraia o significado
4. Se a resposta não está no conteúdo, responda: "Essa informação não está disponível neste conteúdo."
5. Formate como WhatsApp: *negrito*, bullet points, máximo 1024 caracteres
`;

const YT_SYSTEM_PROMPT_DETAILED = `Você análisa vídeos e transcrições de vídeos. Responda APENAS com informação do conteúdo.

REGRAS:
1. Inicie direto com a resposta - sem saudações ou introduções
2. Seja claro e objetivo.
3. Transcrições têm erros (IA): ignore sintaxe, extraia o significado
4. Se a resposta não está no conteúdo, responda: "Essa informação não está disponível neste conteúdo."
`;

async function getYouTubeTranscript(url: string): Promise<string> {
    try {
        const transcript: TranscriptResponse[] = await fetchTranscript(url);
        const text = transcript
            .map((item) => item.text)
            .join(' ');

        return text;
    } catch (err: any) {
        console.error("Erro ao obter transcrição:", err.message || err);
        return "";
    }
}

export class YoutubeHandler implements MessageHandler {

  canHandle(ctx: MessageContext): boolean {
    return YT_URL_REGEX.test(ctx.rawText);
  }

  async handle(ctx: MessageContext): Promise<string> {
    const url = ctx.rawText.match(YT_URL_REGEX)![0];
    const parts: Part[] = [];

    if (ctx.rawText.startsWith("Assista")) {
      parts.push({
        fileData: {
          fileUri: url,
        },
      });
    } else {
      const transcript = await getYouTubeTranscript(url);
      parts.push({ text: `[TRANSCRIÇÃO]: ${transcript}` },);
    }

    const contents: Content[] = [{
      role: 'user',
      parts: [
        { text: `[PERGUNTA]: ${ctx.rawText}` },
        ...parts,
      ],
    }];

    let response: { text?: string };
    if (ctx.rawText.includes("detalhadamente")) {
      response = await runPrompt(contents, YT_SYSTEM_PROMPT_DETAILED);
    } else {
      response = await runPrompt(contents, YT_SYSTEM_PROMPT);
    }

    return response.text ?? 'Não foi possível responder.';
  }

}
