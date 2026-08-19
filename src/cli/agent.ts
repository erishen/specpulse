import { createInterface } from 'node:readline';
import { createAgent } from '../agent/agent.js';
import { specToComponent } from '../generator/reactGenerator.js';
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outputPath = join(root, 'preview', 'src', 'App.tsx');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const agent = createAgent();

async function loop() {
  rl.question('\n[specpulse] describe the UI you want (or "exit"): ', async (answer) => {
    const input = answer.trim();
    if (!input || input === 'exit' || input === 'quit') {
      rl.close();
      return;
    }
    try {
      console.log('[specpulse] generating...');
      const spec = await agent.promptToSpec(input);
      const component = specToComponent(spec);
      writeFileSync(outputPath, component);
      console.log(`[specpulse] updated ${outputPath} (title: "${spec.title}")`);
    } catch (error) {
      console.error('[specpulse]', error);
    }
    loop();
  });
}

console.log('[specpulse] interactive mode - run `npm run preview` in another terminal to watch');
loop();
