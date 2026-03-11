import { connectToWhatsApp } from './whatsapp.js';
import { MessageDispatcher } from './dispatcher.js';
import { YoutubeHandler } from './youtube.handler.js';
// import { FallbackHandler } from './fallback.handler.js';

import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    const dispatcher = new MessageDispatcher()
      .register(new YoutubeHandler());
    //   .register(new FallbackHandler()); // fallback at last
    
    connectToWhatsApp(dispatcher);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
