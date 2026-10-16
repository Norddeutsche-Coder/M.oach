export const tabs = ['today', 'cal', 'runs', 'race', 'perf', 'set', 'coach'] as const
export type Tab = (typeof tabs)[number]
export const navigation: { id: Tab; label: string }[] = [
  { id: 'today', label: 'Heute' },
  { id: 'cal', label: 'Kalender' },
  { id: 'runs', label: 'Läufe' },
  { id: 'race', label: 'Race' },
  { id: 'perf', label: 'Leistung' },
  { id: 'coach', label: 'Coaching' },
]
