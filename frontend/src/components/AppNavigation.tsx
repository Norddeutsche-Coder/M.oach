import { navigation, type Tab } from '../lib/navigation'
import NavigationIcon from './NavigationIcon'

export default function AppNavigation({ active, coaching, onNavigate }: {
  active: Tab; coaching: boolean; onNavigate: (tab: Tab) => void
}) {
  function navigate(tab: Tab) {
    try { navigator.vibrate?.(8) } catch { /* Haptics are optional. */ }
    onNavigate(tab)
  }
  return <nav className={coaching ? 'dock six' : 'dock'} aria-label="Hauptmenü">
    {navigation.filter(tab => tab.id !== 'coach' || coaching).map(tab =>
      <button key={tab.id} data-t={tab.id} data-active={active === tab.id}
        aria-current={active === tab.id ? 'page' : undefined} onClick={() => navigate(tab.id)}>
        <NavigationIcon tab={tab.id} /><span>{tab.label}</span>
      </button>)}
  </nav>
}
