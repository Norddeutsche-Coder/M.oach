import { test, expect, type Page } from '@playwright/test'

async function seedSupabaseConfig(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('moach_sb', JSON.stringify({
      url: 'https://test-project.supabase.co',
      key: 'sb_publishable_test_only_000000000000',
    }))
  })
}

async function seedLocalAccount(page: Page) {
  await seedSupabaseConfig(page)
  await page.addInitScript(() => {
    if (localStorage.getItem('migration-seeded')) return
    localStorage.setItem('moach_users', JSON.stringify([{ id: 'migration-test', name: 'Testläufer' }]))
    localStorage.setItem('moach_cur', 'migration-test')
    localStorage.setItem('mplan2_migration-test', JSON.stringify({
      start: '2026-10-12', race: '2027-09-26', goal: 9900, base: 11400,
      prof: { name: 'Testläufer', weight: '70', wake: '06:30' },
    }))
    localStorage.setItem('migration-seeded', '1')
  })
}

test.beforeEach(async ({ context, page }) => {
  // Never send test credentials or writes to the real Supabase/Intervals projects.
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1'
    ? route.continue() : route.abort())
  page.on('pageerror', error => { throw error })
})

test('missing Supabase configuration shows setup guidance', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('alert')).toContainText('Supabase-Konfiguration fehlt')
  await expect(page.getByRole('alert')).toContainText('.env.example')
})

test('stored moach_sb configuration starts login, validation and registration', async ({ page }) => {
  await seedSupabaseConfig(page)
  await page.goto('/')
  await expect(page.getByText('Willkommen zurück')).toBeVisible()
  await page.locator('#aug').click()
  await expect(page.locator('#aerr')).toHaveText('Bitte E-Mail und Passwort eingeben.')
  await page.getByRole('button', { name: 'Registrieren', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Neues Konto' })).toBeVisible()
  await expect(page.locator('#aco')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('existing local data, all tabs and profile edits survive reload', async ({ page }) => {
  await seedLocalAccount(page)
  await page.goto('/')
  await expect(page.locator('#today')).toBeVisible()
  for (const [id, label] of [['cal', 'Kalender'], ['runs', 'Läufe'], ['race', 'Race'], ['perf', 'Leistung'], ['today', 'Heute']]) {
    await page.getByRole('navigation').getByRole('button', { name: label, exact: true }).click()
    await expect(page.locator(`#${id}`)).toBeVisible()
    await expect(page.locator(`#${id}`)).not.toBeEmpty()
    await expect(page.locator(`nav [data-t="${id}"]`)).toHaveAttribute('aria-current', 'page')
  }
  await page.getByRole('button', { name: 'Profil', exact: true }).click()
  await expect(page.locator('#pn')).toHaveValue('Testläufer')
  await page.locator('#pn').fill('Migration geprüft')
  await page.locator('#ss').click()
  await page.reload()
  await expect(page.locator('#set')).toBeVisible()
  await expect(page.locator('#pn')).toHaveValue('Migration geprüft')
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('production shell and navigation work after offline reload', async ({ page, context }) => {
  await seedLocalAccount(page)
  await page.goto('/')
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>(resolve => navigator.serviceWorker.addEventListener('controllerchange', () => resolve(), { once: true }))
    }
  })
  await context.setOffline(true)
  await page.reload()
  await expect(page.locator('#today')).toBeVisible()
  await page.getByRole('navigation').getByRole('button', { name: 'Kalender', exact: true }).click()
  await expect(page.locator('#cal')).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})
