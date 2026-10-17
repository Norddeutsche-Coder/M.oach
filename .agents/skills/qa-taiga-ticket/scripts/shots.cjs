// Screenshots einer lokal laufenden App mit festen Testdaten.
// Aufruf: node shots.cjs <pfad/zu/@playwright/test> <baseUrl> <ausgabeordner> <szenarien.json>
//
// szenarien.json ist ein Array von Objekten:
// {
//   "name": "heute-readiness-8",          // Dateiname ohne Endung
//   "date": "2026-12-15T08:00:00+01:00",  // feste Uhrzeit im Browser
//   "localStorage": { "schluessel": "wert als String" },
//   "tab": "Kalender",                    // optional: Navigationseintrag, der angeklickt wird
//   "click": "#selector",                 // optional: zusätzliches Element anklicken
//   "viewport": "phone" | "desktop",      // 390x844 oder 1280x860
//   "dark": false,                        // prefers-color-scheme: dark
//   "fullPage": true
// }
// Externe Anfragen werden blockiert: Es geht nichts an Supabase, Intervals.icu o. Ä. raus.
const [, , playwrightPath, baseUrl, outDir, scenarioFile] = process.argv
if (!scenarioFile) {
  console.error('Aufruf: node shots.cjs <playwright> <baseUrl> <ausgabeordner> <szenarien.json>')
  process.exit(2)
}
const { chromium } = require(playwrightPath)
const fs = require('fs')
const path = require('path')
const scenarios = JSON.parse(fs.readFileSync(scenarioFile, 'utf8'))
const sizes = { phone: { width: 390, height: 844 }, desktop: { width: 1280, height: 860 } }
const host = new URL(baseUrl).hostname

;(async () => {
  fs.mkdirSync(outDir, { recursive: true })
  const browser = await chromium.launch()
  let failed = 0
  for (const s of scenarios) {
    const context = await browser.newContext({
      viewport: sizes[s.viewport || 'phone'], deviceScaleFactor: 2, colorScheme: s.dark ? 'dark' : 'light',
    })
    await context.route('**/*', r => new URL(r.request().url()).hostname === host ? r.continue() : r.abort())
    const page = await context.newPage()
    const errors = []
    page.on('pageerror', e => errors.push(String(e)))
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()) })
    if (s.date) await page.clock.setFixedTime(new Date(s.date))
    await page.addInitScript(entries => {
      if (sessionStorage.getItem('qa-seeded')) return
      sessionStorage.setItem('qa-seeded', '1')
      for (const [k, v] of Object.entries(entries)) localStorage.setItem(k, v)
    }, s.localStorage || {})
    try {
      await page.goto(baseUrl)
      await page.waitForTimeout(700)
      if (s.tab) { await page.locator(`nav button:has-text("${s.tab}")`).first().click(); await page.waitForTimeout(500) }
      if (s.click) { await page.locator(s.click).first().click(); await page.waitForTimeout(500) }
      const file = path.join(outDir, `${s.name}.png`)
      await page.screenshot({ path: file, fullPage: s.fullPage !== false })
      console.log(`ok ${file}${errors.length ? `  (Konsolenfehler: ${errors.length})` : ''}`)
      for (const e of errors) console.log(`   ! ${e.slice(0, 200)}`)
    } catch (e) {
      failed++
      console.log(`FEHLER ${s.name}: ${String(e).slice(0, 300)}`)
    }
    await context.close()
  }
  await browser.close()
  process.exit(failed ? 1 : 0)
})()
