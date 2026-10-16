export default function Sparkline({ values }: { values: (number | null)[] }) {
  const valid = values.flatMap((value, index) => value === null ? [] : [{ value, index }])
  if (valid.length < 2) return null
  const min = Math.min(...valid.map(p => p.value)), max = Math.max(...valid.map(p => p.value))
  const points = valid.map(p => ({ x: 3 + p.index / Math.max(1, values.length - 1) * 78,
    y: max === min ? 14 : 24 - (p.value - min) / (max - min) * 20 }))
  const last = points[points.length - 1]
  return <svg className="sp" viewBox="0 0 84 28" width="84" height="28" aria-hidden="true">
    <polyline points={points.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx={last.x} cy={last.y} r="2.6" fill="currentColor" />
  </svg>
}
