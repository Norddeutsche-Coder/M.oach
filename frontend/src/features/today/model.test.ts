import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { buildToday } from './model'
import type { TodayInput } from './types'

const base: TodayInput = {
  date: '2026-10-16', hour: 10, name: 'Testläufer', start: '2026-10-12', noPlan: false,
  maintain: false, plan: { t: 'easy', lab: 'Locker', km: 6, d: '6 km locker' },
  adjustment: { mode: 'plan', km: 6, title: null, note: '' },
  readiness: { lvl: 0, score: 100, adj: 0, w: 13, m: {}, f: {} },
  zones: { e1: 313, e2: 351 }, abc: false, strength: null, log: null,
  stats: [], trends: [], metrics: [], adaptation: '', course: '', connected: false,
  factorsOpen: false, repair: null, requests: [], latestRun: null, heatmap: false,
}

describe('today view model', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 16, 10))
  })

  afterEach(() => vi.useRealTimers())

  it('builds greeting, title, status and training details', () => {
    const result = buildToday(base)
    expect(result.greeting).toBe('Guten Morgen, Testläufer')
    expect(result.title).toBe('Locker · 6 km')
    expect(result.status).toEqual({ label: 'Bereit', className: 's-g' })
    expect(result.training.meta).toBe('6 km · ca. 33 min')
  })

  it('describes a completed run without injecting markup', () => {
    const result = buildToday({ ...base, log: { done: true, km: '<5>', min: 30 } })
    expect(result.completed).toBe('✓ Erledigt: <5> km in 30 min')
  })
})
