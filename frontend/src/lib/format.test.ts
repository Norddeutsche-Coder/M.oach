import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addD, fp, ft, iso, mon, parse } from './format'

describe('local date and duration formatting', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 16, 12))
  })

  afterEach(() => vi.useRealTimers())

  it('formats a local calendar date without UTC conversion', () => {
    expect(iso(new Date(2026, 9, 16, 23, 30))).toBe('2026-10-16')
  })

  it('parses a date as a local calendar date', () => {
    const date = parse('2026-10-16')
    expect([date.getFullYear(), date.getMonth(), date.getDate()]).toEqual([2026, 9, 16])
  })

  it('adds calendar days across month boundaries', () => {
    expect(iso(addD(new Date(2026, 9, 31), 1))).toBe('2026-11-01')
  })

  it('finds Monday for every day of the week', () => {
    expect(iso(mon(new Date(2026, 9, 18)))).toBe('2026-10-12')
  })

  it('formats pace seconds as minutes and seconds', () => {
    expect(fp(315.6)).toBe('5:16')
  })

  it('formats duration seconds with hours', () => {
    expect(ft(9900)).toBe('2:45:00')
  })
})
