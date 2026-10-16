import { useEffect, useState, type CSSProperties } from 'react'
import Info from './Info'
import ReadinessCard from './ReadinessCard'
import TrainingHero from './TrainingHero'
import type { CoachRequest, TodayActions, TodayViewModel } from './types'

function CoachingRequest({ request, actions }: { request: CoachRequest; actions: TodayActions }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  async function answer(accept: boolean) {
    setBusy(true); setError('')
    try { await actions.answer(request, accept) }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Die Antwort konnte nicht gespeichert werden.') }
    finally { setBusy(false) }
  }
  return <div className="card inbox">
    <div className="inb"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9z" /><path d="M10 20a2 2 0 0 0 4 0" /></svg></div>
    <div className="inm"><h3>Coaching-Anfrage</h3><div><b>{request.name}</b> {request.description}</div>
      <div className="b"><button className="pri" disabled={busy} onClick={() => void answer(true)}>{request.cloud ? 'Bestätigen und freigeben' : 'Bestätigen'}</button>
        <button disabled={busy} onClick={() => void answer(false)}>Ablehnen</button></div>
      {error && <div className="aerr" role="alert">{error}</div>}
    </div>
  </div>
}

function Heatmap({ actions, revision }: { actions: TodayActions; revision: TodayViewModel }) {
  // The map engine owns only #hmm's children and #hmi's text.
  useEffect(() => actions.mountHeatmap(), [actions])
  useEffect(() => actions.refreshHeatmap(), [actions, revision])
  return <div className="card hmc" id="hmc">
    <h3>Alle Läufe</h3><div className="sub" id="hmi">Karte wird vorbereitet …</div><div className="rvm hmm" id="hmm" />
    <div className="hml"><span>seltener</span><div className="hms">{[0, 1, 2, 3, 4].map(index => <i key={index} className={`h${index}`} />)}</div><span>häufiger</span></div>
    <div className="hmn">{['1×', '2–3×', '4–7×', '8–14×', '15×+'].map(label => <span key={label}>{label}</span>)}</div>
    <small className="mu">Aus den GPS-Daten deiner Läufe der letzten 6 Monate. Je öfter du eine Strecke gelaufen bist, desto dunkler und kräftiger die Linie. Mit zwei Fingern bewegen und zoomen.</small>
  </div>
}

export default function TodayView({ model: m, actions: a }: { model: TodayViewModel; actions: TodayActions }) {
  return <>
    {m.requests.map(request => <CoachingRequest key={`${request.cloud}:${request.id}`} request={request} actions={a} />)}
    <TrainingHero model={m} actions={a} />
    {m.repair && <div className={`card rep${m.repair.applied ? ' ok' : ''}`}>
      <h3>{m.repair.applied ? 'Woche angepasst' : 'Woche anpassen?'}<Info topic="rep" onOpen={a.info} /></h3>
      <div className="sub">{m.repair.applied ? 'Die Einheiten stehen so jetzt im Plan.' : 'Deine Daten zeigen hohe Belastung:'}</div>
      {m.repair.reasons.length > 0 && <ul className="rpw">{m.repair.reasons.map(reason => <li key={reason}>{reason}</li>)}</ul>}
      {m.repair.rows.map(row => <div className="rpr" key={row.date}><b>{row.date}</b><span>{m.repair?.applied ? <s>{row.before}</s> : row.before} <span className="mu">→</span> {row.after}</span></div>)}
      <div className="b">{m.repair.applied ? <button id="rpU" onClick={() => a.repair('undo')}>Rückgängig</button> : <>
        <button className="pri" id="rpA" onClick={() => a.repair('apply')}>Übernehmen</button><button id="rpI" onClick={() => a.repair('dismiss')}>Heute nicht</button>
      </>}</div>
    </div>}
    <ReadinessCard model={m} actions={a} />
    {m.latestRun && <button className="card nrun nrc2 today-run" aria-label={`Lauf öffnen: ${m.latestRun.name}`} onClick={() => a.run(m.latestRun!.id)} style={{ '--kc': m.latestRun.color } as CSSProperties}>
      <div className="nrk"><span className="kt" style={{ background: m.latestRun.color }}>{m.latestRun.kind}</span> {m.latestRun.time}</div>
      <div className="nrh"><div className="nrn">{m.latestRun.name}</div><span className="nrgo" aria-hidden="true">›</span></div>
      <div className="nrb">{m.latestRun.km}<small>km</small></div>
      <div className="tiles">
        {m.latestRun.duration && <div className="tl"><b>{m.latestRun.duration}</b><span>Dauer</span></div>}
        {m.latestRun.pace && <div className="tl"><b>{m.latestRun.pace}</b><span>Pace</span></div>}
      </div>
    </button>}
    <div className="stats">{m.stats.map(stat => <div className="st" key={stat.info}>
      <span>{stat.label}<Info topic={stat.info} onOpen={a.info} /></span><b>{stat.value}</b><span>{stat.detail}</span>
    </div>)}</div>
    {m.heatmap && <Heatmap actions={a} revision={m} />}
  </>
}
