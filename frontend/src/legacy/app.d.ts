import type { Tab } from '../lib/navigation'
import type { TodayActions, TodayInput } from '../features/today/types'
export interface LegacyApp {
  navigate(tab: Tab): void
  sync(): void
  dispose(): void
  today: TodayActions
}
export function initializeLegacyApp(callbacks: {
  onTabChange(tab: Tab): void
  onCoachChange(enabled: boolean): void
  onTodayChange(input: TodayInput): void
}): LegacyApp
