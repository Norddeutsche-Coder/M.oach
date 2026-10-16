import { useEffect, useState } from 'react'
import AppHeader from './components/AppHeader'
import AppNavigation from './components/AppNavigation'
import TodayView from './features/today/TodayView'
import { buildToday } from './features/today/model'
import type { TodayViewModel } from './features/today/types'
import { initializeLegacyApp, type LegacyApp } from './legacy/app.js'
import { tabs, type Tab } from './lib/navigation'
import { registerServiceWorker } from './lib/service-worker'

// The compatibility runtime owns the children of the empty hosts below.
export default function App() {
  const [active, setActive] = useState<Tab>('today')
  const [coaching, setCoaching] = useState(false)
  const [error, setError] = useState('')
  const [today, setToday] = useState<TodayViewModel | null>(null)
  const [runtime, setRuntime] = useState<LegacyApp | null>(null)

  useEffect(() => {
    let instance: LegacyApp | undefined
    let mounted = true
    try {
      instance = initializeLegacyApp({
        onTabChange: tab => { if (mounted) setActive(tab) },
        onCoachChange: value => { if (mounted) setCoaching(value) },
        onTodayChange: input => { if (mounted) setToday(buildToday(input)) },
      })
      // The legacy runtime is created once by this mount-only integration effect.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setRuntime(instance)
      registerServiceWorker()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Die App konnte nicht gestartet werden.')
    }
    return () => { mounted = false; instance?.dispose() }
  }, [])

  return <>
    <AppHeader active={active} onSync={() => runtime?.sync()} onProfile={() => runtime?.navigate('set')} />
    <main className="wrap">
      {error && <p role="alert">Start fehlgeschlagen: {error}</p>}
      <section id="today" hidden={active !== 'today'}>
        {today && runtime && <TodayView model={today} actions={runtime.today} />}
      </section>
      {tabs.filter(tab => tab !== 'today').map(tab => <section key={tab} id={tab} hidden={active !== tab} />)}
      <div id="rv" className="rv" hidden />
      <div id="md" className="modal" hidden />
      <div id="im" className="modal" hidden />
    </main>
    <div id="cm" className="cmod" hidden />
    <div id="wz" className="cmod" hidden />
    <div id="auth" className="auth" hidden />
    <AppNavigation active={active} coaching={coaching} onNavigate={tab => runtime?.navigate(tab)} />
  </>
}
