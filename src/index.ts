import { connectToWhatsApp } from './whatsapp.js';
import { createDispatcher } from './dispatcher.js';

async function main() {
    const dispatcher = createDispatcher();
    connectToWhatsApp(dispatcher);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
