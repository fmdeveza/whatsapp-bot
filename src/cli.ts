import { pathToFileURL } from 'url';
import { MessageDispatcher } from './dispatcher.js';
import { YoutubeHandler } from './youtube.handler.js';

// console.log(process.argv)
if (import.meta.url === pathToFileURL(process.argv[1]!).href) {
  if (!process.argv[2]) throw new Error('missing args');
  const msg = process.argv.slice(2).join(' ');
  const dispatcher = new MessageDispatcher()
    .register(new YoutubeHandler());
  //   .register(new FallbackHandler()); // fallback at last

  const ctx = { from: 'cli', rawText: msg }
  
  await dispatcher.dispatch(ctx);
}
