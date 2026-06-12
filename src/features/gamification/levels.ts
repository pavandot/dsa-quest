/**
 * Level curve: the XP needed to clear level n grows linearly,
 * so total XP for level n is quadratic — fast early levels, slower later.
 * L1→L2: 100 XP, L2→L3: 150, L3→L4: 200, …
 */
const BASE_STEP = 100
const STEP_GROWTH = 50

export function xpToClearLevel(level: number): number {
  return BASE_STEP + STEP_GROWTH * (level - 1)
}

export function levelFromXp(xp: number): number {
  let level = 1
  let remaining = xp
  while (remaining >= xpToClearLevel(level)) {
    remaining -= xpToClearLevel(level)
    level += 1
  }
  return level
}

/** Progress within the current level, for progress bars. */
export function levelProgress(xp: number): {
  level: number
  intoLevel: number
  needed: number
  percent: number
} {
  let level = 1
  let remaining = xp
  while (remaining >= xpToClearLevel(level)) {
    remaining -= xpToClearLevel(level)
    level += 1
  }
  const needed = xpToClearLevel(level)
  return { level, intoLevel: remaining, needed, percent: Math.round((remaining / needed) * 100) }
}
