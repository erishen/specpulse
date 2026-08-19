#!/usr/bin/env node
/**
 * Kill any leftover UIAgent dev processes so `npm run desktop*` always starts
 * from a clean slate:
 *  - the Electron app (main + helpers) for THIS project
 *  - Vite dev servers bound to :5277 (操作台 UI) and :5278 (preview)
 * Cross-platform (macOS/Linux/Windows).
 */
import { spawnSync } from 'node:child_process'

const isWin = process.platform === 'win32'
const root = process.cwd().toLowerCase()

function sh(cmd, args) {
  try {
    const r = spawnSync(cmd, args, { encoding: 'utf8', shell: isWin })
    return (r.stdout || '') + (r.stderr || '')
  } catch {
    return ''
  }
}

function killPid(pid) {
  try {
    if (isWin) sh('taskkill', ['/PID', String(pid), '/T', '/F'])
    else process.kill(pid, 'SIGTERM')
    return true
  } catch {
    return false
  }
}

function pidsOnPort(port) {
  if (isWin) {
    const out = sh('netstat', ['-ano', '|', 'findstr', `:${port}`])
    return out
      .split(/\r?\n/)
      .map((l) => l.trim().split(/\s+/).pop())
      .filter((p) => p && /^\d+$/.test(p) && Number(p) !== process.pid)
  }
  const out = sh('lsof', ['-ti', `tcp:${port}`])
  return (out.split(/\r?\n/).filter(Boolean) || []).map(Number)
}

function collectPids() {
  const out = isWin
    ? sh('powershell', [
        '-NoProfile',
        '-Command',
        `Get-CimInstance Win32_Process | Where-Object { $_.CommandLine -like '*uiagent-desktop*' -or $_.Name -like '*Electron*' } | Select-Object -ExpandProperty ProcessId`,
      ])
    : sh('ps', ['axo', 'pid,command'])
  const pids = new Set([...pidsOnPort(5277), ...pidsOnPort(5278)])
  for (const line of out.split(/\r?\n/)) {
    if (isWin) {
      const pid = Number(line.trim())
      if (pid && pid !== process.pid) pids.add(pid)
      continue
    }
    const m = line.match(/^\s*(\d+)\s+(.*)$/)
    if (!m) continue
    const [, pidStr, rest] = m
    const pid = Number(pidStr)
    if (pid === process.pid) continue
    const cmd = String(rest).toLowerCase()
    if (cmd.includes(root) && /electron|vite/.test(cmd)) pids.add(pid)
  }
  return pids
}

let killed = collectPids()
for (const pid of killed) {
  if (!killPid(pid)) killed.delete(pid)
}
const survivors = collectPids()
for (const pid of survivors) {
  try {
    if (isWin) sh('taskkill', ['/PID', String(pid), '/T', '/F'])
    else process.kill(pid, 'SIGKILL')
  } catch {
    /* already gone */
  }
}
if (killed.size || survivors.size) {
  console.log(`[kill-dev] 已结束 ${killed.size + survivors.size} 个残留进程 (electron/vite :5277/:5278)`)
}
process.exit(0)
