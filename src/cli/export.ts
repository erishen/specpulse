import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Export a generated record to a production-ready deliverable:
 *  a self-contained single-file index.html that renders spec.json at runtime
 *  (embedded for file://, refreshed from ./spec.json on any static host)
 *  plus a deployable dist.zip. Returns the export directory. */
function exportRecord(id: string): string {
  const generatedRoot = resolve(root, 'generated');
  const entryDir = resolve(generatedRoot, id);
  if (entryDir === generatedRoot || !entryDir.startsWith(generatedRoot + sep)) {
    throw new Error(`无效的生成记录: ${id}`);
  }
  const specPath = join(entryDir, 'spec.json');
  if (!existsSync(specPath)) throw new Error(`该记录缺少 spec.json: ${id}`);

  let title = basename(entryDir);
  const specRaw = readFileSync(specPath, 'utf8');
  try {
    const spec = JSON.parse(specRaw);
    if (spec && typeof spec.title === 'string') title = spec.title;
  } catch {
    /* keep dir name as title */
  }

  const exportDir = join(root, 'exports', id);
  rmSync(exportDir, { recursive: true, force: true });
  mkdirSync(exportDir, { recursive: true });

  // Build the spec-driven runtime (SpecRenderer + all UI components) once.
  // Pages render from spec.json — no per-record App.tsx compile needed.
  const distDir = join(exportDir, 'dist');
  {
    const viteBin = join(root, 'preview', 'node_modules', 'vite', 'bin', 'vite.js');
    execFileSync(
      process.execPath,
      [viteBin, 'build', '--config', join(root, 'preview', 'vite.dynamic.config.ts')],
      {
        cwd: join(root, 'preview'),
        env: { ...process.env, EXPORT_OUT_DIR: distDir, CI: '1' },
        stdio: 'pipe',
      },
    );
  }

  // Post-process dist/dynamic.html into a self-contained single file,
  // embedding the record's spec so file:// still works without spec.json.
  const distIndex = join(distDir, 'dynamic.html');
  let html = readFileSync(distIndex, 'utf8');
  html = html.replace(/<link[^>]+rel="stylesheet"[^>]*href="(?:\.\/)?assets\/([^"]+)"[^>]*>/g, (_m, name) => {
    const css = readFileSync(join(distDir, 'assets', name), 'utf8');
    return `<style>${css}</style>`;
  });
  html = html.replace(/<script type="module"[^>]*src="(?:\.\/)?assets\/([^"]+)"[^>]*><\/script>/g, (_m, name) => {
    const js = readFileSync(join(distDir, 'assets', name), 'utf8');
    return `<script type="module">${js}</script>`;
  });
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`);
  // Escape '<' so a crafted spec can't break out of the inline script.
  const embedded = JSON.stringify(JSON.parse(specRaw)).replace(/</g, '\\u003c');
  html = html.replace(/<script/, `<script>window.__UIAGENT_SPEC__ = ${embedded};</script>\n<script`);
  writeFileSync(join(exportDir, 'index.html'), html);

  // Carry the record's data (spec) into the export for dynamic pages.
  // prompt.txt (the user's raw generation instruction) is intentionally NOT
  // copied: it can contain business/private context and is not needed to
  // render, so it must not end up in a publicly deployed artifact.
  copyFileSync(specPath, join(exportDir, 'spec.json'));

  try {
    const zipArgs = ['-rq', 'dist.zip', 'dist'];
    if (existsSync(join(exportDir, 'spec.json'))) zipArgs.push('spec.json');
    execFileSync('zip', zipArgs, { cwd: exportDir, stdio: 'pipe' });
  } catch {
    console.log('[specpulse] warning: zip 不可用，dist/ 目录仍可直接部署');
  }

  return exportDir;
}

function main() {
  const id = process.argv[2];
  if (!id) {
    console.error('[specpulse] usage: npm run export -- "<生成记录 id>"');
    console.error('[specpulse] e.g.   npm run export -- "20260817-171838-Dark 3D Product Landing Page"');
    process.exit(1);
  }
  const dir = exportRecord(id);
  console.log(`[specpulse] export-dir: ${dir}`);
  console.log(`[specpulse] exported ${id} ->`);
  console.log(`  single-file: ${join(dir, 'index.html')}  (动态渲染 spec.json：改 JSON 即改页面)`);
  console.log(`  data json:   ${join(dir, 'spec.json')}  (部署时修改无需重新构建)`);
  console.log(`  deploy zip:  ${join(dir, 'dist.zip')}`);
}

main();
