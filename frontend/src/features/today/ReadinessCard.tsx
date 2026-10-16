import { useState, type CSSProperties } from 'react'
import Info from './Info'
import Sparkline from './Sparkline'
import type { TodayActions, TodayViewModel } from './types'

export default function ReadinessCard({ model: m, actions: a }: { model: TodayViewModel; actions: TodayActions }) {
  const [open, setOpen] = useState(m.factorsOpen)
  const b = m.briefing, circumference = 2 * Math.PI * 27
  function toggle() { setOpen(!open); a.factors(!open) }
  return <div className="brief rdw">
    <div className="rdrow">
      <div className="card rdc rdr">
        <div className="bhk">Training Readiness<Info topic="bf_score" onOpen={a.info} /></div>
        <svg className="ring" viewBox="0 0 66 66" width="66" height="66" role="img" aria-label={`Training Readiness ${m.readiness.score} von 100`}>
          <circle cx="33" cy="33" r="27" fill="none" stroke="var(--bd)" strokeWidth="7" />
          <circle className="rg" cx="33" cy="33" r="27" fill="none" stroke={b.color} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={circumference.toFixed(1)} strokeDashoffset={(circumference * (1 - m.readiness.score / 100)).toFixed(1)}
            transform="rotate(-90 33 33)" style={{ '--c': circumference.toFixed(1) } as CSSProperties} />
          <text x="33" y="38.5" textAnchor="middle" fontSize="19" fontWeight="800" fill="var(--tx)">{m.readiness.score}</text>
        </svg>
        <div className="bhl" style={{ color: b.color }}>{b.heading}</div><div className="bhs">{b.subtitle}</div>
      </div>
      {m.metrics.map(metric => <div className="card rdc fvc" key={metric.key}>
        <div className="bhk">{metric.name}<Info topic={`t_${metric.key}`} onOpen={a.info} /></div>
        <button type="button" className="fvb" disabled={metric.value === '–'} onClick={() => a.chart(metric.key)}
          style={{ '--zc': { good: '#16a34a', bad: '#ef4444', neu: '#3b82f6' }[metric.tone] } as CSSProperties}>
          <div className="fvv"><b>{metric.value}</b></div><div className="fvl">{metric.label}</div><div className="fvs">{metric.description}</div>
          <Sparkline values={metric.values} />
        </button>
      </div>)}
    </div>
    <div className="card rdd">
      <div className="bsrc" style={{ margin: '0 0 8px' }}>{b.source}</div>
      <div className="bcall" style={{ '--bc': b.color } as CSSProperties}>{b.verdict}</div>
      <button type="button" className="fxh" id="fxh" aria-expanded={open} aria-controls="fxb" onClick={toggle}>
        <b className="bfh">Faktoren</b><span className={`zs ${b.tone}`}>{b.summary}</span><span className={`fxc${open ? ' on' : ''}`} aria-hidden="true">⌄</span>
      </button>
      <div className="fxb" id="fxb" hidden={!open}>
        {m.trends.length ? <div className="zgrid">{m.trends.map(trend => {
          const penalty = (m.readiness.f[trend.key] || 0) * m.readiness.w
          return <button type="button" className={`zt ${trend.tone}`} key={trend.key} onClick={() => a.chart(trend.key)}>
            <div className="zl">{trend.name}<Info topic={`t_${trend.key}`} onOpen={a.info} /></div>
            <div className="zm"><div className="zv"><b>{trend.value}</b>{trend.unit && <span>{trend.unit.replace(' (7 Tage)', '')}</span>}</div><Sparkline values={trend.values} /></div>
            {trend.arrow && <div className="za">{trend.arrow}</div>}<small>{trend.description}</small>
            {['rhr', 'hrv', 'sleep'].includes(trend.key) && <div className={`zfx ${penalty > 0 ? 'neg' : 'nul'}`}>Einfluss {penalty > 0 ? `−${penalty}` : '±0'}</div>}
          </button>
        })}</div> : <div className="mu" style={{ margin: '6px 0' }}>Noch keine Trenddaten.</div>}
        {!m.connected && <div className="tips">Mit Intervals.icu siehst du hier Ruhepuls, HRV, Schlaf und Fitness, und deine Läufe kommen automatisch.
          <div className="b"><button className="pri goicu" onClick={() => a.navigate('set')}>Intervals.icu verbinden</button></div>
        </div>}
      </div>
      {m.adjustment.note && <div className="bt"><b>Training heute:</b> {m.adjustment.note}</div>}
      {m.plan && <div className="ln" style={{ color: 'var(--mu)', marginTop: 8 }}>{m.adaptation}{m.course}<Info topic="adapt" onOpen={a.info} /></div>}
    </div>
  </div>
}
