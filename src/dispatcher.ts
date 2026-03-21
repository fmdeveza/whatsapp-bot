
import type { MessageHandler, MessageContext } from './handler.interface.js';
import { YoutubeHandler } from './youtube.handler.js';
import { FallbackHandler } from './fallback.handler.js';

export class MessageDispatcher {
  private handlers: MessageHandler[] = [];

  register(handler: MessageHandler): this {
    this.handlers.push(handler);
    return this;
  }

  async dispatch(context: MessageContext): Promise<string> {
    for (const handler of this.handlers) {
      if (handler.canHandle(context)) {
        return handler.handle(context);
      }
    }
    return '...';
  }
}

export function createDispatcher(): MessageDispatcher {
  return new MessageDispatcher()
    .register(new YoutubeHandler())
    .register(new FallbackHandler());
}
