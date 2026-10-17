import { test, expect, type Page } from '@playwright/test'

const fixedDate = '2026-10-16'
const runId = 'i9001'

// Simulated GPS loop of about 5 km around 53.1°/8.2°, in the Intervals.icu streams format.
function streams() {
  const n = 200,
    lat: number[] = [],
    lon: number[] = [],
    distance: number[] = [],
    time: number[] = []
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / (n - 1)
    lat.push(53.1 + 0.0072 * Math.sin(a))
    lon.push(8.2 + 0.012 * (1 - Math.cos(a)))
    distance.push((5000 * i) / (n - 1))
    time.push((1800 * i) / (n - 1))
  }
  return [
    { type: 'time', data: time },
    { type: 'distance', data: distance },
    { type: 'latlng', data: lat, data2: lon },
  ]
}

async function seedRun(page: Page) {
  await page.clock.setFixedTime(new Date(`${fixedDate}T10:00:00+02:00`))
  await page.addInitScript(
    ({ state }) => {
      if (localStorage.getItem('map-test-seeded')) return
      localStorage.setItem('map-test-seeded', '1')
      localStorage.setItem(
        'moach_sb',
        JSON.stringify({
          url: 'https://test-project.supabase.co',
          key: 'sb_publishable_test_only_000000000000',
        }),
      )
      localStorage.setItem('moach_users', JSON.stringify([{ id: 'test', name: 'Testläufer' }]))
      localStorage.setItem('moach_cur', 'test')
      localStorage.setItem('mplan_icu_test', JSON.stringify({ id: 'i0', key: 'e2e-placeholder' }))
      localStorage.setItem('mplan2_test', JSON.stringify(state))
    },
    {
      state: {
        start: '2026-10-12',
        race: '2027-09-26',
        goal: 9900,
        base: 11400,
        prof: { name: 'Testläufer' },
        runs: [{ id: runId, d: fixedDate, t: '07:30', n: 'Morgenlauf', km: 5, sec: 1800 }],
      },
    },
  )
}

test.beforeEach(async ({ context, page }) => {
  await context.route('**/*', (route) => {
    const url = new URL(route.request().url())
    if (url.hostname === '127.0.0.1') return route.continue()
    if (
      url.hostname === 'intervals.icu' &&
      url.pathname === `/api/v1/activity/${runId}/streams.json`
    )
      return route.fulfill({ json: streams() })
    if (url.hostname === 'intervals.icu' && url.pathname === `/api/v1/activity/${runId}`)
      return route.fulfill({ json: {} })
    return route.abort()
  })
  page.on('pageerror', (error) => {
    throw error
  })
})

test('run detail shows the route and the zoom controls change the view', async ({ page }) => {
  await seedRun(page)
  await page.goto('/')
  await page.getByRole('button', { name: 'Lauf öffnen: Morgenlauf', exact: true }).click()
  const map = page.locator('#rvm')
  const route = map.locator('.mml')
  await expect(route).toHaveAttribute('d', /^M[\d. L-]+$/)
  const fitted = await route.getAttribute('d')

  await map.getByRole('button', { name: 'Vergrößern' }).click()
  await expect(route).not.toHaveAttribute('d', fitted!)

  await map.getByRole('button', { name: 'Route zentrieren' }).click()
  await expect(route).toHaveAttribute('d', fitted!)

  const sources = map.getByRole('button', { name: 'Kartenquellen anzeigen' })
  await sources.click()
  await expect(map.getByRole('button', { name: 'Kartenquellen ausblenden' })).toHaveAttribute(
    'aria-expanded',
    'true',
  )
})

test('heatmap keeps a zoomed view when switching to another tab and back', async ({ page }) => {
  await seedRun(page)
  await page.goto('/')
  const heatmap = page.locator('#hmm')
  const lines = heatmap.locator('.mmh.h0')
  await expect(lines).toHaveAttribute('d', /^M[\d. L-]+$/)
  const fitted = await lines.getAttribute('d')

  await heatmap.getByRole('button', { name: 'Vergrößern' }).click()
  await expect(lines).not.toHaveAttribute('d', fitted!)
  const zoomed = await lines.getAttribute('d')

  const nav = page.getByRole('navigation', { name: 'Hauptmenü' })
  await nav.getByRole('button', { name: 'Kalender', exact: true }).click()
  await expect(heatmap).toBeHidden()
  await nav.getByRole('button', { name: 'Heute', exact: true }).click()
  await expect(heatmap).toBeVisible()
  await expect(lines).toHaveAttribute('d', zoomed!)
})
