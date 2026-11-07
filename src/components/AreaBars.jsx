import Icon from './Icon.jsx'

export const PASSING = 75 // percent; below this an area needs improvement

const status = (pct) => (pct === null ? 'Not started' : pct < PASSING ? 'Needs Improvement' : 'On Track')

// areas: [{ name, icon, correct, total, pct }] from areaScores().
export default function AreaBars({ areas }) {
  return (
    <ul className="space-y-4">
      {areas.map((a) => {
        const weak = a.pct !== null && a.pct < PASSING
        return (
          <li key={a.name}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 font-semibold text-navy-950">
                <Icon name={a.icon} className="h-4 w-4 shrink-0 text-navy-950/60" />
                <span className="truncate">
                  {a.name}
                  {a.pct !== null && <span className="tabular-nums">: {a.pct}%</span>}
                </span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  a.pct === null
                    ? 'bg-tile text-navy-950/45'
                    : weak
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
                }`}
              >
                {status(a.pct)}
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-tile" role="progressbar" aria-label={`${a.name} score`} aria-valuenow={a.pct ?? 0} aria-valuemin={0} aria-valuemax={100}>
              <div className={`h-2 rounded-full transition-all ${weak ? 'bg-rose-500' : 'bg-emerald-600'}`} style={{ width: `${a.pct ?? 0}%` }} />
            </div>
            {a.total > 0 && <p className="mt-1 text-xs text-navy-950/45">{a.correct} of {a.total} correct</p>}
          </li>
        )
      })}
    </ul>
  )
}
