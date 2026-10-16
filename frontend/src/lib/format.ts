const pad = (value: number): string => String(value).padStart(2, '0')
/** Local calendar dates: do not use UTC conversion for training days. */
export const iso = (date: Date): string => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
export function parse(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}
export const addD = (date: Date, days: number): Date => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
export const mon = (date: Date): Date => addD(date, -((date.getDay() + 6) % 7))
export function fp(seconds: number): string {
  const rounded = Math.round(seconds)
  return `${Math.floor(rounded / 60)}:${pad(rounded % 60)}`
}
export function ft(seconds: number): string {
  const rounded = Math.round(seconds)
  return `${Math.floor(rounded / 3600)}:${pad(Math.floor(rounded % 3600 / 60))}:${pad(rounded % 60)}`
}
