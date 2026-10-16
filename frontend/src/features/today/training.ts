import { fp } from '../../lib/format'
import type { TodayInput, Training, TrainingRow } from './types'

export function trainingForToday(input: TodayInput): Training {
  const p = input.plan, adj = input.adjustment, z = input.zones
  const rows: TrainingRow[] = [], tips: string[] = []
  if (!p) {
    rows.push({ label: 'Heute', text: 'Locker laufen oder bewegen, ganz nach Gefühl. Achte auf deine Training Readiness und deinen Zustand.' })
    if (!input.noPlan && input.date >= input.start) rows.push({ label: 'Erholung', text: 'Nach einem Rennen: 1–2 Wochen nur locker oder frei, dann wieder aufbauen.' })
    rows.push({ label: 'Plan', text: 'Für konkrete Einheiten erstellst du im Kalender einen Plan: für ein Rennen oder zum Erhalten deiner Ausdauer.' })
    return { meta: 'Kein Plan für heute', rows, tips, calendar: true }
  }
  const e = `${fp(z.e1)}–${fp(z.e2)} /km`, k = adj.km, min = Math.round(k * (z.e1 + z.e2) / 2 / 60)
  const kind = adj.mode === 'swap' && p.t === 'q' ? 'easy' : p.t
  const add = (label: string, text: string, action?: TrainingRow['action']) => rows.push({ label, text, action })
  const strength = () => rows.push({ label: 'Kraft', text: '20–25 min nach dem Lauf', strength: input.strength || true })
  const recovery = () => add('Regeneration', '10 min Mobility nach dem Lauf: Hüftbeuger, Waden und Gesäß je 2 × 45 s' + (p.t === 'long' || p.t === 'race' ? ', danach Beine 10 min hochlegen' : p.t === 'q' ? ', danach Faszienrolle für Waden und Oberschenkel' : '') + '.', 'post')
  if (p.t === 'rest' || adj.mode === 'rest') {
    add('Bewegung', '20–30 min Spaziergang oder lockeres Radeln (RPE ≤ 3), nur wenn es sich gut anfühlt')
    add('Regeneration', '15 min Mobility: Hüftbeuger, Waden sowie vordere und hintere Oberschenkel je 2 × 45 s je Seite, Glute Bridge 2 × 12, danach Faszienrolle für Waden und Oberschenkel', 'rest')
    tips.push('Kein Training mit Pulsanstieg: Die Anpassung passiert in der Ruhe.')
    return { meta: 'Ruhetag', rows, tips }
  }
  if (adj.mode === 'move') {
    add('Heute', 'Locker 20–30 min (RPE ≤ 3) oder komplett frei')
    add('Test', 'In 2–4 Tagen nachholen, sobald du dich wieder frisch fühlst')
    return { meta: 'Test verschieben', rows, tips }
  }
  if (kind === 'easy') {
    add('Aufwärmen', '5 min zügig gehen oder sehr locker traben')
    add('Hauptteil', adj.mode === 'swap' ? `${k} km sehr locker bei ${fp(z.e2)} /km oder langsamer (ca. ${min} min)` : `${k} km locker bei ${e} (ca. ${min} min)`)
    const strides = adj.mode === 'plan' && /Steigerungsläufe/.test(p.d), abc = adj.mode !== 'swap' && input.abc && strides
    add('Abschluss', strides ? (abc ? 'Lauf-ABC (ca. 8 min), dann ' : '') + '6 × 20 s Steigerung (flüssig, ca. 90 %), dazwischen 40 s traben' : '5 min gehen, Waden und Hüftbeuger kurz dehnen', abc ? 'abc' : undefined)
    if (p.str && adj.mode !== 'swap') strength()
    recovery()
    tips.push('Gesprächstempo: Du sprichst in ganzen Sätzen (RPE 3–4). Wenn nicht: langsamer.')
    return { meta: `${k} km · ca. ${min} min`, rows, tips }
  }
  if (kind === 'q') {
    const abc = adj.mode !== 'swap' && input.abc
    add('Aufwärmen', `15 min locker bei ${e}, dann ` + (abc ? 'Lauf-ABC (ca. 8 min) und ' : '') + '3 × 80 m Steigerung', abc ? 'abc' : undefined)
    add('Hauptteil', stripDescription(p.d) + (adj.mode === 'reduced' ? ` (gekürzt auf ca. ${k} km gesamt)` : ''))
    add('Auslaufen', `10–15 min sehr locker bei ${fp(z.e2)} /km`)
    if (p.str) strength()
    recovery()
    tips.push('Erste Wiederholung kontrolliert, die letzte so schnell wie die erste.', 'Pausen traben, nicht stehen bleiben.')
    return { meta: `${k} km gesamt · ca. ${min} min`, rows, tips }
  }
  if (kind === 'long') {
    add('Start', '5–10 min sehr locker, die ersten 3 km bewusst langsam')
    add('Hauptteil', adj.mode === 'plan' ? p.d.replace(/ · Verpflegung üben/, '') : `${k} km locker bei ${e} (ca. ${min} min), ohne Tempoabschnitte`)
    add('Abschluss', '10 min gehen oder sehr locker traben, danach Beine 10 min hochlegen')
    recovery()
    if (adj.mode === 'plan' && /MRT/.test(p.lab)) tips.push('Marathontempo-Abschnitte exakt halten, nicht schneller. Fühlt sich das Tempo ungewohnt schwer an, ist das ein Warnsignal.')
    if (k >= 18) tips.push('Verpflegung und Route mit Wasserstellen vorher festlegen.')
    return { meta: `${k} km · ca. ${min} min`, rows, tips }
  }
  const marathon = p.lab === 'MARATHON'
  add('Aufwärmen', '15–20 min locker, Lauf-ABC 2 × 20 m, 4 × 80–100 m Steigerung', 'abc')
  add('Rennen', p.d)
  add('Danach', '10–15 min auslaufen, Ergebnis unter „Leistung“ eintragen')
  recovery()
  tips.push(marathon ? 'Km 1–10 kontrolliert (3–5 s/km langsamer als Zielpace), Km 10–30 gleichmäßig, ab Km 30 geben, was übrig ist.' : 'Erste 2 km nicht schneller als Zielpace, ab Km 5 dranbleiben, ab Km 8 Gas geben.')
  return { meta: marathon ? 'Renntag' : 'Wettkampf-Test', rows, tips }
}

export const stripDescription = (text: string): string => text.replace(/^[\d.,]+ km( gesamt)?:? ?/, '')
