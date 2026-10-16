import { fp, parse } from '../../lib/format'
import { trainingForToday, stripDescription } from './training'
import type { TodayInput, TodayViewModel } from './types'
const round = (n: number) => Math.round(n * 10) / 10

export function buildToday(input: TodayInput): TodayViewModel {
  const p = input.plan, adj = input.adjustment, R = input.readiness, log = input.log
  const date = parse(input.date), start = parse(input.start)
  const e = `${fp(input.zones.e1)}–${fp(input.zones.e2)} /km`
  const min = Math.round(adj.km * (input.zones.e1 + input.zones.e2) / 2 / 60)
  let title: string, subtitle: string
  if (!p) {
    if (input.noPlan) { title = 'Kein Trainingsplan aktiv'; subtitle = 'Deine Läufe und dein Zustand werden trotzdem verfolgt. Im Kalender erstellst du einen neuen Plan.' }
    else if (date < start) { title = 'Dein Plan startet bald'; subtitle = 'Der erste Trainingstag ist der ' + start.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }) + '.' }
    else { title = input.maintain ? 'Plan abgeschlossen' : 'Rennen geschafft'; subtitle = input.maintain ? 'Starte im Kalender einen neuen Plan, wenn du weitermachen willst.' : 'Gönn dir Erholung: 1–2 Wochen nur locker oder frei. Danach legst du im Kalender einen neuen Plan an.' }
  } else if (p.t === 'rest') { title = 'Recovery-Tag'; subtitle = 'Heute zählt Erholung: Mobility, Ernährung, Schlaf.' }
  else if (adj.mode === 'rest' || adj.mode === 'move') { title = adj.title || ''; subtitle = adj.mode === 'move' ? 'Locker 20–30 min oder frei.' : 'Heute kein Lauftraining.' }
  else if (adj.mode === 'swap') { title = p.t === 'q' ? `Locker statt ${p.lab} · ${adj.km} km` : `Kurz & locker · ${adj.km} km`; subtitle = `ca. ${min} min bei ${e}` }
  else {
    title = p.t === 'race' ? (p.ttl || p.lab) : `${p.lab} · ${adj.km} km` + (adj.mode === 'reduced' ? ' (gekürzt)' : '')
    subtitle = p.t === 'q' ? stripDescription(p.d) : p.t === 'easy' ? `ca. ${min} min · ${e}` : p.d
  }
  const original = !p ? '' : adj.mode !== 'plan' && p.t !== 'rest' ? p.lab + (p.km ? ` · ${round(p.km)} km` : '') : p.rep ? `${p.rep.lab} · ${round(p.rep.km)} km` : ''
  const pace = log && Number(log.km) > 0 && Number(log.min) > 0 ? ` · Ø ${fp(Number(log.min) * 60 / Number(log.km))} /km` : ''
  const bad = input.trends.filter(t => t.tone === 'bad').length, good = input.trends.filter(t => t.tone === 'good').length
  return {
    ...input, title, subtitle, original,
    greeting: (input.hour < 11 ? 'Guten Morgen' : input.hour < 18 ? 'Guten Tag' : 'Guten Abend') + (input.name.trim() ? ', ' + input.name.trim() : ''),
    dateLabel: date.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' }),
    completed: log?.done ? `✓ Erledigt: ${log.km} km` + (log.min ? ` in ${log.min} min` : '') + pace : '',
    status: p?.t === 'rest' ? { label: 'Erholung', className: 's-g' } : { label: ['Bereit', 'Anpassen', 'Erholen'][R.lvl], className: ['s-g', 's-y', 's-r'][R.lvl] },
    training: trainingForToday(input),
    briefing: {
      color: ['#16a34a', '#f5b301', '#ef4444'][R.lvl],
      heading: ['Du bist bereit', 'Heute etwas defensiver', 'Erholung hat Vorrang'][R.lvl],
      subtitle: !p ? 'Kein Plan für heute' : adj.mode === 'rest' || adj.mode === 'move' ? 'Heute kein Lauftraining' : p.t === 'rest' ? 'Recovery-Tag' : p.lab + (adj.km ? ` · ${adj.km} km` : ''),
      verdict: ['Du bist gut erholt, der Plan kann wie vorgesehen laufen.', 'Leichte Ermüdung: heute etwas kürzer oder lockerer laufen.', 'Deutliche Ermüdung: Erholung hat heute Vorrang.'][R.lvl],
      source: R.m.rd != null ? `Intervals.icu ${R.m.rd}` + (R.adj ? ` · Faktoren ${R.adj < 0 ? '−' : '+'}${Math.abs(R.adj)}` : ' · Faktoren ±0') + ` = ${R.score}` : 'Von M.oach geschätzt: heute fehlt ein Readiness-Wert in Intervals.icu',
      summary: !input.trends.length ? 'Noch keine Trenddaten' : bad ? `${bad}${bad > 1 ? ' Werte' : ' Wert'} beachten` : good ? 'Alles im grünen Bereich' : 'Alle Werte im normalen Bereich',
      tone: !input.trends.length ? 'neu' : bad ? 'bad' : good ? 'good' : 'neu',
    },
  }
}
