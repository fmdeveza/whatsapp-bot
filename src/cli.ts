import { pathToFileURL } from 'url';
import { createDispatcher } from './dispatcher.js';

// console.log(process.argv)
if (import.meta.url === pathToFileURL(process.argv[1]!).href) {
  if (!process.argv[2]) throw new Error('missing args');
  
  const msg = process.argv.slice(2).join(' ');
  const dispatcher = createDispatcher();
  const ctx = { from: 'cli', rawText: msg }
  const result = await dispatcher.dispatch(ctx);
  console.log(result);
}
