import PropTypes from 'prop-types'

const RadialGauge = ({ label, percentage, color = '#38bdf8' }) => {
  const safePercent = Math.max(0, Math.min(100, Number.isFinite(percentage) ? percentage : 0))
  const strokeDasharray = `${safePercent} ${100 - safePercent}`

  return (
    <div className="relative flex flex-col items-center justify-center rounded-3xl border border-white/5 bg-slate-950/40 px-5 py-6">
      <svg viewBox="0 0 36 36" className="h-28 w-28">
        <path
          className="text-slate-700"
          strokeWidth="3"
          fill="none"
          stroke="currentColor"
          strokeDasharray="100 100"
          d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32"
          opacity="0.25"
        />
        <path
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
          stroke={color}
          d="M18 2a16 16 0 1 1 0 32 16 16 0 0 1 0-32"
          strokeDasharray={strokeDasharray}
          transform="rotate(-90 18 18)"
        />
      </svg>
      <p className="mt-3 text-3xl font-semibold text-white">{safePercent}%</p>
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{label}</p>
    </div>
  )
}

RadialGauge.propTypes = {
  label: PropTypes.string.isRequired,
  percentage: PropTypes.number,
  color: PropTypes.string,
}

export default RadialGauge
