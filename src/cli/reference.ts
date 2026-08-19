import { createAgent } from '../agent/agent.js';
import { specToComponent } from '../generator/reactGenerator.js';
import type { UISpec } from '../spec/types.js';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const outputPath = join(root, 'preview', 'src', 'App.tsx');
const pagesPath = join(root, 'preview', 'src', 'pages');

/** Convert a local image file to base64 data URL */
function imageToDataUrl(filePath: string): string {
  const ext = extname(filePath).toLowerCase().slice(1);
  const mimeMap: Record<string, string> = {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  const mime = mimeMap[ext] || 'image/png';
  const data = readFileSync(filePath);
  return `data:${mime};base64,${data.toString('base64')}`;
}

/** Archive generation for history */
function archive(spec: UISpec, component: string, reference: string): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  const safeTitle = (spec.title || 'reference').replace(/[\\/:*?"<>|]/g, '-').slice(0, 40);
  const dir = join(root, 'generated', `${stamp}-${safeTitle}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'reference.txt'), reference);
  writeFileSync(join(dir, 'spec.json'), JSON.stringify(spec, null, 2));
  writeFileSync(join(dir, 'App.tsx'), component);
  return dir;
}

/** Save spec as JSON in pages directory */
function saveAsPage(spec: UISpec): string {
  mkdirSync(pagesPath, { recursive: true });
  const safeName = (spec.title || 'reference').replace(/[\\/:*?"<>|]/g, '-').slice(0, 40);
  const filePath = join(pagesPath, `${safeName}.json`);
  writeFileSync(filePath, JSON.stringify(spec, null, 2));
  return filePath;
}

function printUsage() {
  console.log(`
Usage: npm run reference -- <image> [options]

Arguments:
  <image>           Local file path or HTTP URL to a screenshot/mockup

Options:
  --json            Output as JSON spec in pages/ for dynamic rendering
  --prompt <text>   Additional instructions for the LLM
  --detail <level>  Vision detail level: low | high | auto (default: auto)
  --model <name>    Override the LLM model (must support vision)

Examples:
  # From local screenshot
  npm run reference -- ./screenshot.png

  # From URL with additional instructions
  npm run reference -- https://example.com/design.png --prompt "使用中文内容"

  # Output as JSON for dynamic rendering
  npm run reference -- ./mockup.jpg --json

  # Use high detail vision processing
  npm run reference -- ./complex-ui.png --detail high
`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printUsage();
    process.exit(0);
  }

  // Parse arguments
  const jsonMode = args.includes('--json');
  const promptIdx = args.indexOf('--prompt');
  const detailIdx = args.indexOf('--detail');
  const modelIdx = args.indexOf('--model');

  const additionalPrompt = promptIdx >= 0 ? args[promptIdx + 1] : undefined;
  const detail = detailIdx >= 0 ? (args[detailIdx + 1] as 'low' | 'high' | 'auto') : 'auto';
  const model = modelIdx >= 0 ? args[modelIdx + 1] : undefined;

  // Get the image source (first non-flag argument)
  const imageSource = args.find((a) => !a.startsWith('--') && a !== args[promptIdx + 1] && a !== args[detailIdx + 1] && a !== args[modelIdx + 1]);

  if (!imageSource) {
    console.error('[specpulse] Error: No image source provided');
    printUsage();
    process.exit(1);
  }

  // Determine if it's a URL or local file
  let imageUrl: string;
  const isUrl = imageSource.startsWith('http://') || imageSource.startsWith('https://');

  if (isUrl) {
    imageUrl = imageSource;
    console.log(`[specpulse] using remote image: ${imageUrl}`);
  } else {
    // Local file - convert to data URL
    try {
      imageUrl = imageToDataUrl(imageSource);
      console.log(`[specpulse] loaded local image: ${imageSource}`);
    } catch (err) {
      console.error(`[specpulse] Error reading image file: ${imageSource}`);
      console.error(err);
      process.exit(1);
    }
  }

  // Create agent with optional model override
  const agent = createAgent(model ? { model } : {});

  console.log('[specpulse] analyzing reference image with vision model...');
  const spec = await agent.referenceToSpec(
    { url: imageUrl, detail },
    additionalPrompt,
  );

  console.log(`[specpulse] parsed spec: "${spec.title}"`);

  if (jsonMode) {
    // JSON mode: save as page spec for dynamic rendering
    const pagePath = saveAsPage(spec);
    console.log(`[specpulse] saved JSON spec: ${pagePath}`);
    console.log('[specpulse] run `npm run preview` to view it in the browser');
  } else {
    // Default mode: generate JSX component
    const component = specToComponent(spec);
    writeFileSync(outputPath, component);
    console.log(`[specpulse] wrote ${outputPath}`);

    const dir = archive(spec, component, isUrl ? imageUrl : imageSource);
    console.log(`[specpulse] archived to ${dir}`);
    console.log('[specpulse] run `npm run preview` to view it in the browser');
  }
}

main().catch((error) => {
  console.error('[specpulse]', error);
  process.exit(1);
});
