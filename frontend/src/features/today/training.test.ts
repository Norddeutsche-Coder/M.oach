import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { stripDescription, trainingForToday } from './training'
import type { TodayInput } from './types'

function input(overrides: Partial<TodayInput> = {}): TodayInput {
  return {
    date: '2026-10-16', hour: 10, name: 'Test', start: '2026-10-12', noPlan: false,
    maintain: false, plan: null, adjustment: { mode: 'plan', km: 0, title: null, note: '' },
    readiness: { lvl: 0, score: 100, adj: 0, w: 13, m: {}, f: {} },
    zones: { e1: 313, e2: 351 }, abc: false, strength: null, log: null,
    stats: [], trends: [], metrics: [], adaptation: '', course: '', connected: false,
    factorsOpen: false, repair: null, requests: [], latestRun: null, heatmap: false,
    ...overrides,
  }
}

describe('today training presentation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 16, 10))
  })

  afterEach(() => vi.useRealTimers())

  it('builds the fallback for a day without a plan', () => {
    const result = trainingForToday(input())
    expect(result.meta).toBe('Kein Plan für heute')
    expect(result.calendar).toBe(true)
  })

  it('builds an easy run with pace and recovery', () => {
    const result = trainingForToday(input({
      plan: { t: 'easy', lab: 'Locker', km: 6, d: '6 km locker' },
      adjustment: { mode: 'plan', km: 6, title: null, note: '' },
    }))
    expect(result.meta).toBe('6 km · ca. 33 min')
    expect(result.rows.map(row => row.label)).toEqual(['Aufwärmen', 'Hauptteil', 'Abschluss', 'Regeneration'])
  })

  it('strips the total distance prefix from quality descriptions', () => {
    expect(stripDescription('11 km gesamt: 5 × 1 km Schwelle')).toBe('5 × 1 km Schwelle')
  })
})
