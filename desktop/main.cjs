const { app, BrowserWindow, ipcMain, shell } = require('electron')
const { spawn } = require('node:child_process')
const os = require('node:os')
const path = require('node:path')
const fs = require('node:fs')

const PREVIEW_PORT = 5278

/** Locate the specpulse project root (folder with package.json + preview/index.html). */
function findProjectRoot() {
  if (process.env.UA_ROOT) return process.env.UA_ROOT
  let dir = __dirname
  for (;;) {
    if (fs.existsSync(path.join(dir, 'package.json')) && fs.existsSync(path.join(dir, 'preview', 'index.html'))) {
      return dir
    }
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

/** Pick the node binary that matches the project's .nvmrc (e.g. "24"), falling
 *  back to PATH `node`. Keeps tsx running under a known ABI. */
function resolveNodeBin() {
  let want = ''
  try {
    want = fs.readFileSync(path.join(projectRoot, '.nvmrc'), 'utf8').trim()
  } catch {
    /* no .nvmrc */
  }
  if (want) {
    const versionsDir = path.join(os.homedir(), '.nvm', 'versions', 'node')
    try {
      const ver = want.replace(/^v/, '')
      const matches = fs
        .readdirSync(versionsDir)
        .filter((v) => v.startsWith(`v${ver}`))
        .sort((a, b) => b.localeCompare(a, undefined, { numeric: true }))
      for (const v of matches) {
        const bin = path.join(versionsDir, v, 'bin', 'node')
        if (fs.existsSync(bin)) return bin
      }
    } catch {
      /* fall through to PATH */
    }
  }
  return 'node'
}

/** Spawn the build CLI (src/cli/build.ts) with the prompt as a single argv
 *  element — never through a shell, so metacharacters can't be interpreted. */
function runBuild(prompt) {
  const entry = path.join(projectRoot, 'src', 'cli', 'build.ts')
  let child = null
  const pending = new Promise((resolve, reject) => {
    child = spawn(resolveNodeBin(), ['--import', 'tsx', entry, prompt], {
      cwd: projectRoot,
      env: { ...process.env, CI: '1' },
      shell: false,
      windowsHide: true,
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    child.on('error', (err) => reject(`启动生成 CLI 失败: ${err.message}`))
    child.on('close', (code) => {
      if (code !== 0) {
        reject(`生成失败 (code ${code}):\n${stderr || stdout}`)
        return
      }
      const m = stdout.match(/parsed spec: "([^"]*)"/)
      const dirM = stdout.match(/archived to (.+)/)
      const id = dirM ? path.basename(dirM[1].trim()) : ''
      resolve({ ok: true, title: m ? m[1] : '', id })
    })
  })
  pending.kill = () => {
    try {
      child && child.kill()
    } catch {
      /* best-effort */
    }
  }
  return pending
}

/** Spawn the adjust CLI (src/cli/adjust.ts) with a record id + change request. */
function runAdjust(id, instruction) {
  const entry = path.join(projectRoot, 'src', 'cli', 'adjust.ts')
  let child = null
  const pending = new Promise((resolve, reject) => {
    child = spawn(resolveNodeBin(), ['--import', 'tsx', entry, id, instruction], {
      cwd: projectRoot,
      env: { ...process.env, CI: '1' },
      shell: false,
      windowsHide: true,
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    child.on('error', (err) => reject(`启动调整失败: ${err.message}`))
    child.on('close', (code) => {
      if (code !== 0) {
        reject(`调整失败 (code ${code}):\n${stderr || stdout}`)
        return
      }
      const m = stdout.match(/parsed spec: "([^"]*)"/)
      const dirM = stdout.match(/archived to (.+)/)
      const newId = dirM ? path.basename(dirM[1].trim()) : ''
      resolve({ ok: true, title: m ? m[1] : '', id: newId })
    })
  })
  pending.kill = () => {
    try {
      child && child.kill()
    } catch {
      /* best-effort */
    }
  }
  return pending
}

/** Spawn the export CLI (src/cli/export.ts) for a generated record id. */
function runExport(id) {
  const entry = path.join(projectRoot, 'src', 'cli', 'export.ts')
  let child = null
  const pending = new Promise((resolve, reject) => {
    child = spawn(resolveNodeBin(), ['--import', 'tsx', entry, id], {
      cwd: projectRoot,
      env: { ...process.env, CI: '1' },
      shell: false,
      windowsHide: true,
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    child.on('error', (err) => reject(`启动导出失败: ${err.message}`))
    child.on('close', (code) => {
      if (code !== 0) {
        reject(`导出失败 (code ${code}):\n${stderr || stdout}`)
        return
      }
      const m = stdout.match(/export-dir: (.+)/)
      resolve({ ok: true, path: m ? m[1].trim() : '' })
    })
  })
  pending.kill = () => {
    try {
      child && child.kill()
    } catch {
      /* best-effort */
    }
  }
  return pending
}

/** Spawn the starters CLI (src/cli/starters.ts) to generate fresh example prompts. */
function runStarters() {
  const entry = path.join(projectRoot, 'src', 'cli', 'starters.ts')
  let child = null
  const pending = new Promise((resolve, reject) => {
    child = spawn(resolveNodeBin(), ['--import', 'tsx', entry], {
      cwd: projectRoot,
      env: { ...process.env, CI: '1' },
      shell: false,
      windowsHide: true,
    })
    let stdout = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.on('error', (err) => reject(`启动示例生成失败: ${err.message}`))
    child.on('close', (code) => {
      if (code !== 0) {
        reject(`示例生成失败 (code ${code})`)
        return
      }
      try {
        const starters = JSON.parse(stdout.trim())
        resolve(Array.isArray(starters) ? starters : [])
      } catch {
        reject('示例输出解析失败')
      }
    })
  })
  pending.kill = () => {
    try { child && child.kill() } catch { /* best-effort */ }
  }
  return pending
}

/** Spawn the reference CLI (src/cli/reference.ts) with an image path for vision-based generation. */
function runReference(imagePath, additionalPrompt) {
  const entry = path.join(projectRoot, 'src', 'cli', 'reference.ts')
  const args = [imagePath]
  if (additionalPrompt) {
    args.push('--prompt', additionalPrompt)
  }
  let child = null
  const pending = new Promise((resolve, reject) => {
    child = spawn(resolveNodeBin(), ['--import', 'tsx', entry, ...args], {
      cwd: projectRoot,
      env: { ...process.env, CI: '1' },
      shell: false,
      windowsHide: true,
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    child.on('error', (err) => reject(`启动参考图生成 CLI 失败: ${err.message}`))
    child.on('close', (code) => {
      if (code !== 0) {
        reject(`参考图生成失败 (code ${code}):\n${stderr || stdout}`)
        return
      }
      const m = stdout.match(/parsed spec: "([^"]*)"/)
      const dirM = stdout.match(/archived to (.+)/)
      const id = dirM ? path.basename(dirM[1].trim()) : ''
      resolve({ ok: true, title: m ? m[1] : '', id })
    })
  })
  pending.kill = () => {
    try { child && child.kill() } catch { /* best-effort */ }
  }
  return pending
}

/** Spawn the regenerate CLI (src/cli/regenerate.ts) for a record id. Pure compile, no LLM. */
function runRegenerate(id) {
  const entry = path.join(projectRoot, 'src', 'cli', 'regenerate.ts')
  let child = null
  const pending = new Promise((resolve, reject) => {
    child = spawn(resolveNodeBin(), ['--import', 'tsx', entry, id], {
      cwd: projectRoot,
      env: { ...process.env, CI: '1' },
      shell: false,
      windowsHide: true,
    })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    child.on('error', (err) => reject(`启动重编译失败: ${err.message}`))
    child.on('close', (code) => {
      if (code !== 0) {
        reject(`重编译失败 (code ${code}):\n${stderr || stdout}`)
        return
      }
      resolve({ ok: true })
    })
  })
  pending.kill = () => {
    try {
      child && child.kill()
    } catch {
      /* best-effort */
    }
  }
  return pending
}

/** Resolve/reject after ms, killing a hung CLI child so the UI never spins forever. */
function withTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      try {
        promise.kill && promise.kill()
      } catch {
        /* best-effort */
      }
      reject(`${label} 超时 (${Math.round(ms / 1000)}s)`)
    }, ms)
    promise.then(
      (v) => {
        clearTimeout(t)
        resolve(v)
      },
      (e) => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

/** Coerce to a bounded string so one renderer bug can't smuggle args into the CLI. */
function cleanString(v, max = 4000) {
  return typeof v === 'string' ? v.slice(0, max) : String(v ?? '').slice(0, max)
}

let previewProc = null

/** Keep the preview vite dev server alive for the life of the app. */
function startPreviewServer() {
  const viteBin = path.join(projectRoot, 'preview', 'node_modules', 'vite', 'bin', 'vite.js')
  if (!fs.existsSync(viteBin)) {
    console.error('[specpulse-desktop] 缺少 preview/node_modules/vite，请先执行 npm --prefix preview install')
    return null
  }
  const child = spawn(resolveNodeBin(), [viteBin, '--port', String(PREVIEW_PORT), '--strictPort'], {
    cwd: path.join(projectRoot, 'preview'),
    env: { ...process.env, CI: '1' },
    shell: false,
    windowsHide: true,
    stdio: 'pipe',
  })
  child.on('error', (err) => console.error('[preview] 启动失败:', err.message))
  child.on('close', (code) => console.log(`[preview] 已退出 (code ${code})`))
  return child
}

function previewUrl() {
  return `http://localhost:${PREVIEW_PORT}`
}

function createWindow() {
  const win = new BrowserWindow({
    title: 'SpecPulse 操作台',
    width: 1240,
    height: 820,
    minWidth: 900,
    minHeight: 640,
    backgroundColor: '#0f1115',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })
  const devUrl = process.env.VITE_DEV_SERVER_URL
  if (devUrl) {
    win.loadURL(devUrl)
  } else {
    win.loadFile(path.join(__dirname, 'dist', 'index.html'))
  }
  return win
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.whenReady().then(() => {
    projectRoot = findProjectRoot()
    if (!projectRoot) {
      console.error('找不到 specpulse 项目根目录（需要 package.json + preview/index.html）')
      app.quit()
      return
    }

    const win = createWindow()
    previewProc = startPreviewServer()
    // Closing the window must not strand the spawned preview vite on :5278.
    app.on('will-quit', () => {
      try {
        previewProc && previewProc.kill()
      } catch {
        /* best-effort */
      }
    })

    ipcMain.handle('build', (_e, { prompt } = {}) => {
      prompt = cleanString(prompt)
      if (!prompt) throw new Error('prompt 不能为空')
      const t0 = Date.now()
      const pending = runBuild(prompt)
      pending.then(
        (r) => console.log(`[build] OK in ${Date.now() - t0}ms title=${r.title}`),
        (err) => console.error(`[build] FAIL: ${String(err).slice(0, 300)}`),
      )
      return withTimeout(pending, 300_000, 'UI 生成')
    })

    ipcMain.handle('reference', (_e, { imagePath, additionalPrompt } = {}) => {
      imagePath = cleanString(imagePath, 2000)
      additionalPrompt = additionalPrompt ? cleanString(additionalPrompt, 2000) : undefined
      if (!imagePath) throw new Error('图片路径不能为空')
      const t0 = Date.now()
      const pending = runReference(imagePath, additionalPrompt)
      pending.then(
        (r) => console.log(`[reference] OK in ${Date.now() - t0}ms title=${r.title}`),
        (err) => console.error(`[reference] FAIL: ${String(err).slice(0, 300)}`),
      )
      return withTimeout(pending, 180_000, '参考图生成')
    })

    ipcMain.handle('adjust', (_e, { id, instruction } = {}) => {
      id = cleanString(id, 200)
      instruction = cleanString(instruction, 8000)
      const entryDir = path.resolve(projectRoot, 'generated', id)
      const generatedRoot = path.resolve(projectRoot, 'generated')
      if (entryDir === generatedRoot || !entryDir.startsWith(generatedRoot + path.sep)) {
        throw new Error('无效的生成记录')
      }
      if (!instruction) throw new Error('调整要求不能为空')
      const pending = runAdjust(id, instruction)
      pending.then(
        (r) => console.log(`[adjust] OK title=${r.title} id=${r.id}`),
        (err) => console.error(`[adjust] FAIL: ${String(err).slice(0, 300)}`),
      )
      return withTimeout(pending, 300_000, 'UI 调整')
    })

    ipcMain.handle('get-env', () => {
      let model = 'unknown'
      let visionModel = ''
      let apiKey = ''
      let baseUrl = ''
      let visionApiKey = ''
      let visionBaseUrl = ''
      let envRaw = ''
      try {
        envRaw = fs.readFileSync(path.join(projectRoot, '.env'), 'utf8')
        const modelMatch = envRaw.match(/^OPENAI_MODEL=(.+)$/m) || envRaw.match(/^LLM_MODEL=(.+)$/m)
        if (modelMatch) model = modelMatch[1].trim().trim('"')
        const visionMatch = envRaw.match(/^OPENAI_VISION_MODEL=(.+)$/m) || envRaw.match(/^LLM_VISION_MODEL=(.+)$/m)
        if (visionMatch) visionModel = visionMatch[1].trim().trim('"')
        const keyMatch = envRaw.match(/^(?:OPENAI_API_KEY|LLM_API_KEY)=(.+)$/m)
        if (keyMatch) apiKey = keyMatch[1].trim().trim('"')
        const urlMatch = envRaw.match(/^(?:OPENAI_BASE_URL|LLM_BASE_URL)=(.+)$/m)
        if (urlMatch) baseUrl = urlMatch[1].trim().trim('"')
        const vKeyMatch = envRaw.match(/^(?:OPENAI_VISION_API_KEY|LLM_VISION_API_KEY)=(.+)$/m)
        if (vKeyMatch) visionApiKey = vKeyMatch[1].trim().trim('"')
        const vUrlMatch = envRaw.match(/^(?:OPENAI_VISION_BASE_URL|LLM_VISION_BASE_URL)=(.+)$/m)
        if (vUrlMatch) visionBaseUrl = vUrlMatch[1].trim().trim('"')
      } catch {
        /* no .env yet */
      }
      if (!visionModel) visionModel = model
      const maskKey = (k) => k.length > 10 ? k.slice(0, 6) + '••••' + k.slice(-4) : k ? '••••••••' : ''
      const hasKey = !!apiKey || !!process.env.OPENAI_API_KEY || !!process.env.LLM_API_KEY
      return {
        model, visionModel,
        apiKey: maskKey(apiKey), baseUrl,
        visionApiKey: maskKey(visionApiKey), visionBaseUrl,
        hasKey, previewUrl: previewUrl(),
      }
    })

    ipcMain.handle('save-env', (_e, { model, visionModel, apiKey, baseUrl, visionApiKey, visionBaseUrl } = {}) => {
      const envPath = path.join(projectRoot, '.env')
      let existing = ''
      try { existing = fs.readFileSync(envPath, 'utf8') } catch { /* no .env yet */ }

      const updates = {}
      if (model !== undefined) updates['OPENAI_MODEL'] = cleanString(model, 200)
      if (visionModel !== undefined) updates['OPENAI_VISION_MODEL'] = cleanString(visionModel, 200)
      if (apiKey !== undefined && !apiKey.includes('•')) updates['OPENAI_API_KEY'] = cleanString(apiKey, 500)
      if (baseUrl !== undefined) updates['OPENAI_BASE_URL'] = cleanString(baseUrl, 500)
      if (visionApiKey !== undefined && !visionApiKey.includes('•')) updates['OPENAI_VISION_API_KEY'] = cleanString(visionApiKey, 500)
      if (visionBaseUrl !== undefined) updates['OPENAI_VISION_BASE_URL'] = cleanString(visionBaseUrl, 500)

      for (const [key, value] of Object.entries(updates)) {
        const regex = new RegExp(`^${key}=.+$`, 'm')
        if (regex.test(existing)) {
          existing = existing.replace(regex, `${key}=${value}`)
        } else {
          existing += (existing.endsWith('\n') ? '' : '\n') + `${key}=${value}\n`
        }
      }

      fs.writeFileSync(envPath, existing, 'utf8')
      return { ok: true }
    })

    ipcMain.handle('generate-starters', () => {
      const pending = runStarters()
      pending.then(
        (r) => console.log(`[starters] OK count=${r.length}`),
        (err) => console.error(`[starters] FAIL: ${String(err).slice(0, 200)}`),
      )
      return withTimeout(pending, 30_000, '示例生成')
    })

    ipcMain.handle('open-external', (_e, url) => {
      const target = String(url)
      if (!/^https?:\/\//i.test(target)) throw new Error('只允许打开 http(s) 链接')
      return shell.openExternal(target)
    })

    ipcMain.handle('list-generated', () => {
      const dir = path.join(projectRoot, 'generated')
      if (!fs.existsSync(dir)) return []
      return fs
        .readdirSync(dir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => {
          const entryDir = path.join(dir, e.name)
          let title = e.name
          let prompt = ''
          let hasSpec = false
          let appTsx = false
          try {
            const spec = JSON.parse(fs.readFileSync(path.join(entryDir, 'spec.json'), 'utf8'))
            if (spec && typeof spec.title === 'string') title = spec.title
            hasSpec = true
          } catch {
            /* spec.json missing or corrupt — keep the dir name as title */
          }
          try {
            prompt = fs.readFileSync(path.join(entryDir, 'prompt.txt'), 'utf8').slice(0, 200)
          } catch {
            /* no prompt.txt */
          }
          appTsx = fs.existsSync(path.join(entryDir, 'App.tsx'))
          return { id: e.name, title, prompt, hasSpec, appTsx }
        })
        .sort((a, b) => b.id.localeCompare(a.id))
    })

    ipcMain.handle('load-generated', (_e, { id } = {}) => {
      id = cleanString(id, 200)
      const entryDir = path.resolve(projectRoot, 'generated', id)
      const generatedRoot = path.resolve(projectRoot, 'generated')
      // Restrict restores to the generated/ tree so a bad id can't touch files elsewhere.
      if (entryDir !== generatedRoot && !entryDir.startsWith(generatedRoot + path.sep)) {
        throw new Error('无效的生成记录')
      }
      const src = path.join(entryDir, 'App.tsx')
      if (!fs.existsSync(src)) throw new Error('该记录缺少 App.tsx')
      fs.copyFileSync(src, path.join(projectRoot, 'preview', 'src', 'App.tsx'))
      return { ok: true }
    })

    ipcMain.handle('delete-generated', (_e, { id } = {}) => {
      id = cleanString(id, 200)
      const entryDir = path.resolve(projectRoot, 'generated', id)
      const generatedRoot = path.resolve(projectRoot, 'generated')
      if (entryDir === generatedRoot || !entryDir.startsWith(generatedRoot + path.sep)) {
        throw new Error('无效的生成记录')
      }
      fs.rmSync(entryDir, { recursive: true, force: true })
      return { ok: true }
    })

    ipcMain.handle('clear-generated', () => {
      fs.rmSync(path.join(projectRoot, 'generated'), { recursive: true, force: true })
      return { ok: true }
    })

    ipcMain.handle('export-generated', (_e, { id } = {}) => {
      id = cleanString(id, 200)
      const entryDir = path.resolve(projectRoot, 'generated', id)
      const generatedRoot = path.resolve(projectRoot, 'generated')
      if (entryDir === generatedRoot || !entryDir.startsWith(generatedRoot + path.sep)) {
        throw new Error('无效的生成记录')
      }
      const pending = runExport(id)
      pending.then(
        (r) => {
          if (r.path) shell.showItemInFolder(path.join(r.path, 'index.html'))
        },
        (err) => console.error(`[export] FAIL: ${String(err).slice(0, 300)}`),
      )
      return withTimeout(pending, 180_000, '导出')
    })

    ipcMain.handle('get-spec', (_e, { id } = {}) => {
      id = cleanString(id, 200)
      const entryDir = path.resolve(projectRoot, 'generated', id)
      const generatedRoot = path.resolve(projectRoot, 'generated')
      if (entryDir === generatedRoot || !entryDir.startsWith(generatedRoot + path.sep)) {
        throw new Error('无效的生成记录')
      }
      const src = path.join(entryDir, 'spec.json')
      if (!fs.existsSync(src)) throw new Error('该记录缺少 spec.json')
      return JSON.parse(fs.readFileSync(src, 'utf8'))
    })

    ipcMain.handle('save-spec', async (_e, { id, spec } = {}) => {
      id = cleanString(id, 200)
      const entryDir = path.resolve(projectRoot, 'generated', id)
      const generatedRoot = path.resolve(projectRoot, 'generated')
      if (entryDir === generatedRoot || !entryDir.startsWith(generatedRoot + path.sep)) {
        throw new Error('无效的生成记录')
      }
      if (!spec || typeof spec !== 'object' || !spec.root || typeof spec.title !== 'string') {
        throw new Error('spec 结构无效')
      }
      fs.writeFileSync(path.join(entryDir, 'spec.json'), JSON.stringify(spec, null, 2), 'utf8')
      const pending = runRegenerate(id)
      const t0 = Date.now()
      pending.then(
        () => console.log(`[regenerate] OK in ${Date.now() - t0}ms id=${id}`),
        (err) => console.error(`[regenerate] FAIL: ${String(err).slice(0, 300)}`),
      )
      await withTimeout(pending, 60_000, '页面重编译')
      return { ok: true, title: spec.title }
    })
  })

  app.on('window-all-closed', () => {
    app.quit()
  })
}
