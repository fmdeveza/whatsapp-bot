import type { Content } from '@google/genai';

import type { MessageHandler, MessageContext } from './handler.interface.js';
import { runPrompt } from './genai.js';

const FALLBACK_SYSTEM_PROMPT = `Você é um assistente pessoal. 

REGRAS:
1. Comece direto pela resposta, sem saudações.
2. Seja claro e objetivo.
3. Use formatação WhatsApp quando útil: negrito e listas.
4. Se houver incerteza, responda: "Não tenho certeza sobre isso."
`

export class FallbackHandler implements MessageHandler {
  canHandle(_context: MessageContext): boolean {
    return true;
  }

  async handle(ctx: MessageContext): Promise<string> {
    const text = ctx.rawText.trim();

    if (text === 'Ping') {
      return 'Pong';
    }

    const contents: Content[] = [{
      role: 'user',
      parts: [
        { text: `[PERGUNTA]: ${ctx.rawText}` },
      ],
    }];

    let response: { text?: string };
    response = await runPrompt(contents, FALLBACK_SYSTEM_PROMPT);
    return response.text ?? 'Não foi possível responder.';
  }
}