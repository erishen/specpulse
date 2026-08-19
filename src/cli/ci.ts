import { specToComponent } from '../generator/reactGenerator.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { UISpec } from '../spec/types.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

async function main() {
  const fixturePath = process.argv[2] ?? join(root, 'tests', 'fixtures', 'pricing.json');
  const spec = JSON.parse(readFileSync(fixturePath, 'utf-8')) as UISpec;
  const component = specToComponent(spec);
  const outputPath = join(root, 'preview', 'src', 'App.tsx');
  writeFileSync(outputPath, component);
  console.log(`[specpulse] offline pipeline ok: spec -> ${outputPath}`);
}

main().catch((error) => {
  console.error('[specpulse]', error);
  process.exit(1);
});
