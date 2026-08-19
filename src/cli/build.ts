import { createAgent } from '../agent/agent.js';
import { specToComponent } from '../generator/reactGenerator.js';
import type { UISpec } from '../spec/types.js';
import { extractRequiredTypes, validateSpecTypes } from '../spec/types.js';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outputPath = join(root, 'preview', 'src', 'App.tsx');
const pagesPath = join(root, 'preview', 'src', 'pages');

/** Archive every generation so history is never lost when App.tsx is overwritten. */
function archive(spec: UISpec, component: string, prompt: string): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  const safeTitle = (spec.title || 'untitled').replace(/[\\/:*?"<>|]/g, '-').slice(0, 40);
  const dir = join(root, 'generated', `${stamp}-${safeTitle}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'prompt.txt'), prompt);
  writeFileSync(join(dir, 'spec.json'), JSON.stringify(spec, null, 2));
  writeFileSync(join(dir, 'App.tsx'), component);
  return dir;
}

/** Save spec as JSON in pages directory for dynamic rendering */
function saveAsPage(spec: UISpec): string {
  mkdirSync(pagesPath, { recursive: true });
  const safeName = (spec.title || 'untitled').replace(/[\\/:*?"<>|]/g, '-').slice(0, 40);
  const filePath = join(pagesPath, `${safeName}.json`);
  writeFileSync(filePath, JSON.stringify(spec, null, 2));
  return filePath;
}

async function main() {
  const args = process.argv.slice(2);
  const jsonMode = args.includes('--json');
  const promptArgs = args.filter((a) => a !== '--json');
  const prompt = promptArgs.join(' ') || readStdin();

  if (!prompt) {
    console.error('[specpulse] usage: npm run build -- "<your UI request>" [--json]');
    console.error('[specpulse]   --json    Output as JSON spec in pages/ for dynamic rendering');
    process.exit(1);
  }

  const required = extractRequiredTypes(prompt);
  const agent = createAgent();

  console.log('[specpulse] asking LLM for a UI spec...');
  let spec = await agent.promptToSpec(prompt);

  if (required.length > 0) {
    const v1 = validateSpecTypes(spec, required);
    if (!v1.ok) {
      console.warn(`[specpulse] 首次生成缺少组件: ${v1.missing.join(', ')}，重试中…`);
      const retryPrompt = `${prompt}\n\n【重要】你的上一次输出缺少了以下组件类型，这次必须包含：${v1.missing.join(', ')}。请确保每种组件都出现在最终 UI 中。`;
      spec = await agent.promptToSpec(retryPrompt);
      const v2 = validateSpecTypes(spec, required);
      if (!v2.ok) {
        throw new Error(`[specpulse] 重试后仍缺少组件: ${v2.missing.join(', ')}。请检查描述或手动补充。`);
      }
    }
    console.log(`[specpulse] 组件校验通过: ${required.join(', ')}`);
  }

  console.log(`[specpulse] parsed spec: "${spec.title}"`);

  if (jsonMode) {
    // JSON mode: save as page spec for dynamic rendering
    const pagePath = saveAsPage(spec);
    console.log(`[specpulse] saved JSON spec: ${pagePath}`);
    console.log('[specpulse] run `npm run preview` to view it in the browser');
    console.log('[specpulse] add import to DynamicApp.tsx to use this page');
  } else {
    // Default mode: generate JSX component
    const component = specToComponent(spec);
    writeFileSync(outputPath, component);
    console.log(`[specpulse] wrote ${outputPath}`);

    const dir = archive(spec, component, prompt);
    console.log(`[specpulse] archived to ${dir}`);
    console.log('[specpulse] run `npm run preview` to view it in the browser');
  }
}

function readStdin(): string {
  try {
    return readFileSync(0, 'utf-8').trim();
  } catch {
    return '';
  }
}

main().catch((error) => {
  console.error('[specpulse]', error);
  process.exit(1);
});
