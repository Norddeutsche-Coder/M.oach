import type { Tab } from '../lib/navigation'

export default function NavigationIcon({ tab }: { tab: Tab }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true">
    {tab === 'today' && <><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/></>}
    {tab === 'cal' && <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></>}
    {tab === 'runs' && <><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1"/><circle cx="3.5" cy="12" r="1"/><circle cx="3.5" cy="18" r="1"/></>}
    {tab === 'race' && <><path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/></>}
    {tab === 'perf' && <><path d="M3 17l6-6 4 4 8-9"/><path d="M15 6h6v6"/></>}
    {tab === 'coach' && <><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M17 5.5a3 3 0 0 1 0 5.8M18.5 14.8c1.8.7 3 2.4 3.4 5.2"/></>}
  </svg>
}
