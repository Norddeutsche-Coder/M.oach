import Info from './Info'
import type { TodayActions, TodayViewModel } from './types'

export default function TrainingHero({ model: m, actions: a }: { model: TodayViewModel; actions: TodayActions }) {
  return <section className="hero">
    <div className="hr1"><div><div className="gr">{m.greeting}</div><div className="dt">{m.dateLabel}</div></div>
      <span className={`pill ${m.status.className}`}><i />{m.status.label}<Info topic="lvl" onOpen={a.info} /></span>
    </div>
    <div className="ht">{m.title}</div><div className="hs">{m.subtitle}</div>
    {m.original && <div className="ho">Plan war: <s>{m.original}</s></div>}
    {m.adjustment.note && <div className="hn">{m.adjustment.note}</div>}
    {m.completed && <div className="hdone">{m.completed}</div>}
    <div className="htr">
      <div className="htt">Dein Training heute<Info topic="train" onOpen={a.info} /><span>{m.training.meta}{m.completed && ' · ✓ erledigt'}</span></div>
      {m.training.rows.filter(row => !row.strength).map((row, index) => <div className="sr" key={index}>
        <div className="sl">{row.label}</div><div className="sv">{row.text}
          {row.action && <><br /><button type="button" className="krb" onClick={() => a.exercise(row.action!)}>Übungen ansehen ›</button></>}
        </div>
      </div>)}
      {m.training.rows.filter(row => row.strength).map((row, index) => <div className="krx" key={index}>
        {typeof row.strength === 'object' ? <>
          <div className="krxh">Krafttraining<span>Einheit {row.strength.session}: {row.strength.name} · 20–25 min nach dem Lauf</span></div>
          <ul className="krxl">{row.strength.exercises.map(exercise => <li key={exercise.name}>{exercise.name}<span>{exercise.repetitions}</span></li>)}</ul>
          <button type="button" className="krb" onClick={() => { if (typeof row.strength === 'object') a.strength(row.strength.session, row.strength.sets) }}>Übungen &amp; Anleitung ›</button>
        </> : row.text}
      </div>)}
      {m.training.tips.length > 0 && <div className="tips">{m.training.tips.map(tip => <div key={tip}>{tip}</div>)}</div>}
      {m.training.calendar && <div className="b"><button className="pri gocal" onClick={() => a.navigate('cal')}>Zum Trainingsplan</button></div>}
    </div>
  </section>
}
