import { describe, expect, it } from 'vitest'
import { fitView, project, tileRange, unproject, type LatLng } from './map'

// Loop of about 3 km near Cloppenburg
const route: LatLng[] = [
  [53.1, 8.2],
  [53.108, 8.205],
  [53.112, 8.221],
  [53.104, 8.232],
  [53.097, 8.218],
  [53.1, 8.2],
]

function fits(points: LatLng[], z: number, width: number, height: number, pad: number) {
  const la = points.map((p) => p[0]),
    ln = points.map((p) => p[1])
  const nw = project(Math.max(...la), Math.min(...ln), z),
    se = project(Math.min(...la), Math.max(...ln), z)
  return se[0] - nw[0] <= width - 2 * pad && se[1] - nw[1] <= height - 2 * pad
}

describe('web mercator projection', () => {
  it('maps the null island to the world center', () => {
    expect(project(0, 0, 0)).toEqual([128, 128])
  })

  it.each([3, 12, 17])('round-trips 53.1°/8.2° at zoom %i', (z) => {
    const [x, y] = project(53.1, 8.2, z)
    const [la, ln] = unproject(x, y, z)
    expect(Math.abs(la - 53.1)).toBeLessThan(1e-6)
    expect(Math.abs(ln - 8.2)).toBeLessThan(1e-6)
  })
})

describe('fit view', () => {
  it('uses the largest zoom at which the route fits into 390 × 340 px with 28 px padding', () => {
    const view = fitView(route, 390, 340)
    expect(fits(route, view.z, 390, 340, 28)).toBe(true)
    expect(fits(route, view.z + 1, 390, 340, 28)).toBe(false)
  })

  it('centers the view on the middle of the route', () => {
    const view = fitView(route, 390, 340)
    expect(view.la).toBeCloseTo(53.1045, 3)
    expect(view.ln).toBeCloseTo(8.216, 3)
  })

  it('caps the zoom at 17 for a single point', () => {
    expect(fitView([[53.1, 8.2]], 390, 340)).toMatchObject({ z: 17 })
  })

  it('falls back to central Europe without points', () => {
    expect(fitView([], 390, 340)).toEqual({ z: 4, la: 51, ln: 10 })
    expect(fitView(null, 390, 340)).toEqual({ z: 4, la: 51, ln: 10 })
  })
})

describe('tile range', () => {
  it('covers a 390 × 340 px view at integer zoom', () => {
    expect(tileRange({ z: 12, la: 0, ln: 0 }, 390, 340)).toMatchObject({
      z: 12,
      scale: 1,
      x0: 2047,
      x1: 2048,
      y0: 2047,
      y1: 2048,
    })
  })

  it('loads the next tile zoom and scales it down for a fractional zoom', () => {
    const range = tileRange({ z: 12.6, la: 0, ln: 0 }, 390, 340)
    expect(range.z).toBe(13)
    expect(range.scale).toBeCloseTo(2 ** -0.4, 10)
    expect([range.x0, range.x1, range.y0, range.y1]).toEqual([4094, 4097, 4095, 4096])
  })

  it('does not request tiles above the maximum tile zoom', () => {
    const range = tileRange({ z: 17.4, la: 53.1, ln: 8.2 }, 390, 340, 16)
    expect(range.z).toBe(16)
    expect(range.scale).toBeCloseTo(2 ** 1.4, 10)
  })

  it('keeps tile rows inside the world', () => {
    expect(tileRange({ z: 0, la: 0, ln: 0 }, 1280, 800)).toMatchObject({ y0: 0, y1: 0 })
  })
})
