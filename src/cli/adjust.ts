import { createAgent } from '../agent/agent.js';
import { specToComponent } from '../generator/reactGenerator.js';
import type { UISpec } from '../spec/types.js';
import { collectTypes } from '../spec/types.js';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outputPath = join(root, 'preview', 'src', 'App.tsx');

/** Archive every adjustment as a new snapshot so the full version history survives. */
function archive(spec: UISpec, component: string, instruction: string): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  const safeTitle = (spec.title || 'untitled').replace(/[\\/:*?"<>|]/g, '-').slice(0, 40);
  const dir = join(root, 'generated', `${stamp}-${safeTitle}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'prompt.txt'), instruction);
  writeFileSync(join(dir, 'spec.json'), JSON.stringify(spec, null, 2));
  writeFileSync(join(dir, 'App.tsx'), component);
  return dir;
}

/** Turn #1.2 references in an instruction into concrete node descriptions for the LLM. */
function expandRefs(spec: UISpec, instruction: string): string {
  return instruction.replace(/#(\d+(?:\.\d+)*)/g, (match, p: string) => {
    let cur: UISpec['root'] | undefined = spec.root;
    for (const i of p.split('.').map(Number)) {
      cur = cur?.children?.[i];
      if (!cur) return match;
    }
    const props = cur.props ?? {};
    let text = '';
    for (const k of ['text', 'label', 'title', 'brand', 'name', 'value']) {
      if (typeof props[k] === 'string' && props[k].trim()) {
        text = props[k].trim();
        break;
      }
    }
    return `#${p} [${cur.type}${text ? `「${text}」` : ''}]`;
  });
}

function main() {
  const [id, ...rest] = process.argv.slice(2);
  const instruction = rest.join(' ').trim();
  if (!id || !instruction) {
    console.error('[specpulse] usage: npm run adjust -- "<记录id>" "<调整要求>"');
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
  if (!spec || !spec.root) {
    console.error(`[specpulse] ${id} 的 spec.json 结构无效`);
    process.exit(1);
  }

  console.log(`[specpulse] adjusting "${basename(entryDir)}" ...`);
  const agent = createAgent();
  agent
    .adjustSpec(spec, expandRefs(spec, instruction))
    .then((updated) => {
      const origTypes = collectTypes(spec);
      origTypes.delete('Page');
      const newTypes = collectTypes(updated);
      if (origTypes.size > 0) {
        const lost = [...origTypes].filter((t) => !newTypes.has(t));
        if (lost.length > origTypes.size / 2) {
          console.warn(`[specpulse] 警告: 调整后丢失了较多组件类型: ${lost.join(', ')}`);
        }
      }
      console.log(`[specpulse] parsed spec: "${updated.title}"`);
      const component = specToComponent(updated);
      writeFileSync(outputPath, component);
      console.log(`[specpulse] wrote ${outputPath}`);
      const dir = archive(updated, component, instruction);
      console.log(`[specpulse] archived to ${dir}`);
    })
    .catch((error) => {
      console.error('[specpulse]', error);
      process.exit(1);
    });
}

main();
