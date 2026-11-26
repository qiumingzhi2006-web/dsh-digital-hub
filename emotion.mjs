/**
 * dsh-digital-hub · 情绪追踪
 *
 * 记录会话中的情绪波动，提供统计和趋势。
 * 纯本地 JSONL 追加，不联网。
 *
 * 数据目录（<dataDir>/）：
 *   emotions.jsonl     情绪日志（追加）
 *   emotions.stats.json 统计缓存
 */

import {
  readFileSync, writeFileSync, mkdirSync, existsSync,
  appendFileSync,
} from 'node:fs'
import { join, dirname } from 'node:path'

// ============================================================
// 写情绪日志
// ============================================================

/**
 * 记录一条情绪。
 * @param {string} dataDir 数据目录
 * @param {{ label: string, intensity: number, source: string }} entry
 * @returns {{ id: string, timestamp: number }}
 */
export function logEmotion(dataDir, { label, intensity = 0.5, source = '' }) {
  mkdirSync(dataDir, { recursive: true })
  const id = _uid()
  const ts = Date.now()
  const row = { id, timestamp: ts, label, intensity: Math.max(0, Math.min(1, intensity)), source }
  appendFileSync(join(dataDir, 'emotions.jsonl'), JSON.stringify(row) + '\n', 'utf8')
  return { id, timestamp: ts }
}

// ============================================================
// 读情绪日志
// ============================================================

/**
 * 读取最近的情绪条目。
 * @param {{ since?: number, limit?: number }} opts
 * @returns {Array<{id, timestamp, label, intensity, source}>}
 */
export function getEmotions(dataDir, { since = 0, limit = 50 } = {}) {
  const fp = join(dataDir, 'emotions.jsonl')
  if (!existsSync(fp)) return []
  const lines = readFileSync(fp, 'utf8').trim().split(/\r?\n/).filter(Boolean)
  const entries = []
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const e = JSON.parse(lines[i])
      if (e.timestamp >= since) entries.push(e)
      if (entries.length >= limit) break
    } catch { /* skip bad lines */ }
  }
  return entries
}

// ============================================================
// 情绪统计
// ============================================================

/**
 * 汇总情绪统计。
 * @param {{ windowMs?: number }} opts 统计窗口，默认 7 天
 * @returns {{ total: number, counts: Record<string, number>, recent: Array, avgIntensity: number }}
 */
export function emotionStats(dataDir, { windowMs = 7 * 24 * 3600_000 } = {}) {
  const fp = join(dataDir, 'emotions.jsonl')
  if (!existsSync(fp)) return { total: 0, counts: {}, recent: [], avgIntensity: 0 }
  const now = Date.now()
  const since = now - windowMs
  const lines = readFileSync(fp, 'utf8').trim().split(/\r?\n/).filter(Boolean)
  const counts = {}
  let total = 0
  let sumIntensity = 0
  const recent = []
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const e = JSON.parse(lines[i])
      if (e.timestamp < since) continue
      counts[e.label] = (counts[e.label] || 0) + 1
      total++
      sumIntensity += e.intensity || 0
      if (recent.length < 20) recent.push(e)
    } catch { /* skip */ }
  }
  return {
    total,
    counts,
    recent: recent.reverse(),
    avgIntensity: total ? +(sumIntensity / total).toFixed(3) : 0,
  }
}

// ============================================================
// 工具函数
// ============================================================

let _counter = 0
function _uid() {
  const ts = Date.now().toString(36)
  const rnd = Math.random().toString(36).slice(2, 8)
  const seq = (_counter++).toString(36)
  return `em-${ts}-${rnd}-${seq}`
}