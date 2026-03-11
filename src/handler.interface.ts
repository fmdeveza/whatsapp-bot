export interface MessageContext {
  from: string;        // JID do contato
  rawText: string;
}

export interface MessageHandler {
  canHandle(context: MessageContext): boolean;
  handle(context: MessageContext): Promise<string>;
}
