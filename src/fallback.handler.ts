import type { MessageHandler, MessageContext } from './handler.interface.js';

export class FallbackHandler implements MessageHandler {
  canHandle(_context: MessageContext): boolean {
    return true;
  }

  async handle(context: MessageContext): Promise<string> {
    const text = context.rawText.trim();

    if (text === 'Ping') {
      return 'Pong';
    }

    return 'Não entendi a mensagem.';
  }
}