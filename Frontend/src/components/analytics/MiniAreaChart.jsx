import PropTypes from 'prop-types'

const defaultAccent = { start: '#22d3ee', end: '#0ea5e9' }

const normalizeAccent = (accent) => {
  if (typeof accent === 'string') {
    return { start: accent, end: accent }
  }
  if (accent && typeof accent === 'object') {
    return {
      start: accent.start || defaultAccent.start,
      end: accent.end || accent.start || defaultAccent.end,
    }
  }
  return defaultAccent
}

const MiniAreaChart = ({ label, points = [], accent = defaultAccent }) => {
  const series = Array.isArray(points) && points.length ? points : [0]
  const peak = Math.max(...series, 1)
  const normalized = series.map((point) => {
    const safePoint = Number.isFinite(point) ? point : 0
    return (safePoint / peak) * 70 + 15
  })
  const segments = Math.max(series.length - 1, 1)
  const chartPoints = normalized.map((value, index) => ({
    x: segments === 1 ? 50 : (index / segments) * 100,
    y: 100 - value,
  }))
  const areaPath = ['M0,100', ...chartPoints.map((pt) => `L${pt.x},${pt.y}`), 'L100,100', 'Z'].join(' ')
  const linePoints = chartPoints.map((pt) => `${pt.x},${pt.y}`).join(' ')

  const sanitizedLabel = label.replace(/[^a-z0-9]+/gi, '-').toLowerCase() || 'mini-area'
  const gradientId = `mini-area-${sanitizedLabel}`
  const strokeId = `${gradientId}-stroke`
  const accentStops = normalizeAccent(accent)

  return (
    <div className="rounded-3xl border border-white/5 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
      <div className="mt-3 h-28 w-full">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={accentStops.start} stopOpacity="0.6" />
              <stop offset="100%" stopColor={accentStops.end} stopOpacity="0" />
            </linearGradient>
            <linearGradient id={strokeId} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor={accentStops.start} />
              <stop offset="100%" stopColor={accentStops.end} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradientId})`} opacity="0.7" />
          <polyline fill="none" strokeWidth="2.2" strokeLinecap="round" stroke={`url(#${strokeId})`} points={linePoints} />
        </svg>
      </div>
    </div>
  )
}

MiniAreaChart.propTypes = {
  label: PropTypes.string.isRequired,
  points: PropTypes.arrayOf(PropTypes.number),
  accent: PropTypes.oneOfType([
    PropTypes.shape({
      start: PropTypes.string,
      end: PropTypes.string,
    }),
    PropTypes.string,
  ]),
}

export default MiniAreaChart
