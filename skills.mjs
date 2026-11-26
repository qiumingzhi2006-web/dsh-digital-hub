/**
 * dsh-digital-hub · 技能管理
 *
 * 技能目录：记录用户掌握的技能，支持增删查和使用计数。
 * 纯本地 JSON 存储。
 *
 * 数据目录（<dataDir>/）：
 *   skills.json   技能目录
 */

import {
  readFileSync, writeFileSync, mkdirSync, existsSync,
} from 'node:fs'
import { join, dirname } from 'node:path'

// ============================================================
// 读写技能目录
// ============================================================

function readSkills(dataDir) {
  const fp = join(dataDir, 'skills.json')
  if (!existsSync(fp)) return { items: {}, updatedAt: 0 }
  try {
    return JSON.parse(readFileSync(fp, 'utf8'))
  } catch {
    return { items: {}, updatedAt: 0 }
  }
}

function writeSkills(dataDir, data) {
  mkdirSync(dataDir, { recursive: true })
  data.updatedAt = Date.now()
  writeFileSync(join(dataDir, 'skills.json'), JSON.stringify(data, null, 2), 'utf8')
}

// ============================================================
// 技能 CRUD
// ============================================================

/**
 * 添加或更新技能。
 * @param {{ name: string, description?: string, category?: string, tags?: string[], proficiency?: number }} skill
 * @returns {{ id: string, skill: object }}
 */
export function addSkill(dataDir, { name, description = '', category = '通用', tags = [], proficiency = 1 }) {
  const db = readSkills(dataDir)
  const id = _slug(name)
  const existing = db.items[id]
  const skill = {
    id,
    name,
    description,
    category,
    tags,
    proficiency: Math.max(1, Math.min(5, proficiency)),
    useCount: existing?.useCount ?? 0,
    createdAt: existing?.createdAt ?? Date.now(),
    updatedAt: Date.now(),
  }
  db.items[id] = skill
  writeSkills(dataDir, db)
  return { id, skill }
}

/**
 * 删除技能。
 * @param {string} idOrName 技能 id 或名称
 * @returns {boolean}
 */
export function removeSkill(dataDir, idOrName) {
  const db = readSkills(dataDir)
  const id = db.items[idOrName] ? idOrName : _slug(idOrName)
  if (!db.items[id]) return false
  delete db.items[id]
  writeSkills(dataDir, db)
  return true
}

/**
 * 列出技能。
 * @param {{ category?: string, tag?: string, search?: string }} filter
 * @returns {Array}
 */
export function listSkills(dataDir, { category, tag, search } = {}) {
  const db = readSkills(dataDir)
  let items = Object.values(db.items)
  if (category) items = items.filter((s) => s.category === category)
  if (tag) items = items.filter((s) => s.tags?.includes(tag))
  if (search) {
    const q = search.toLowerCase()
    items = items.filter((s) =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.tags?.some((t) => t.toLowerCase().includes(q))
    )
  }
  items.sort((a, b) => b.proficiency - a.proficiency || b.useCount - a.useCount)
  return items
}

/**
 * 使用技能（增加计数）。
 * @param {string} idOrName 技能 id 或名称
 * @returns {object|null}
 */
export function useSkill(dataDir, idOrName) {
  const db = readSkills(dataDir)
  const id = db.items[idOrName] ? idOrName : _slug(idOrName)
  if (!db.items[id]) return null
  db.items[id].useCount++
  db.items[id].updatedAt = Date.now()
  writeSkills(dataDir, db)
  return db.items[id]
}

/**
 * 按类别统计。
 * @returns {Record<string, number>}
 */
export function skillStats(dataDir) {
  const db = readSkills(dataDir)
  const cats = {}
  for (const s of Object.values(db.items)) {
    cats[s.category] = (cats[s.category] || 0) + 1
  }
  return { total: Object.keys(db.items).length, categories: cats }
}

// ============================================================
// 工具函数
// ============================================================

function _slug(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff]+/g, '-')
    .replace(/^-|-$/g, '')
    || `skill-${Date.now().toString(36)}`
}