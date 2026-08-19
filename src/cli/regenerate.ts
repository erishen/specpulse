import { specToComponent } from '../generator/reactGenerator.js';
import type { UISpec } from '../spec/types.js';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outputPath = join(root, 'preview', 'src', 'App.tsx');

/** Recompile a saved spec into App.tsx (pure, no LLM). Used after on-page edits. */
function main() {
  const id = process.argv[2];
  if (!id) {
    console.error('[specpulse] usage: npm run regenerate -- "<记录id>"');
    process.exit(1);
  }
  const generatedRoot = resolve(root, 'generated');
  const entryDir = resolve(generatedRoot, id);
  if (entryDir === generatedRoot || !entryDir.startsWith(generatedRoot + sep)) {
    console.error(`[specpulse] 无效的生成记录: ${id}`);
    process.exit(1);
  }
  let spec: UISpec;
  try {
    spec = JSON.parse(readFileSync(join(entryDir, 'spec.json'), 'utf8'));
  } catch {
    console.error(`[specpulse] ${id} 缺少可读的 spec.json`);
    process.exit(1);
  }
  if (!spec || !spec.root || typeof spec.title !== 'string') {
    console.error(`[specpulse] ${id} 的 spec.json 结构无效`);
    process.exit(1);
  }
  const component = specToComponent(spec);
  writeFileSync(outputPath, component);
  writeFileSync(join(entryDir, 'App.tsx'), component);
  console.log(`[specpulse] parsed spec: "${spec.title}"`);
  console.log(`[specpulse] wrote ${outputPath}`);
}

main();