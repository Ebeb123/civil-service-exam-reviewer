// Decorative hero illustration: a tilted exam answer sheet with shaded bubbles and a pencil.
export default function AnswerSheetArt({ className }) {
  const rows = [1, 3, 0, 2, 1, 3]
  return (
    <svg className={className} viewBox="0 0 320 260" fill="none" aria-hidden="true">
      <circle cx="210" cy="130" r="118" stroke="white" strokeOpacity=".08" strokeWidth="1.5" />
      <circle cx="210" cy="130" r="84" stroke="white" strokeOpacity=".1" strokeWidth="1.5" strokeDasharray="4 8" />
      <g transform="rotate(-8 190 130)">
        <rect x="112" y="30" width="170" height="210" rx="14" fill="white" fillOpacity=".96" />
        <rect x="130" y="50" width="70" height="8" rx="4" fill="#1b2466" fillOpacity=".85" />
        <rect x="130" y="64" width="110" height="5" rx="2.5" fill="#1b2466" fillOpacity=".18" />
        {rows.map((filled, r) => (
          <g key={r} transform={`translate(130 ${92 + r * 23})`}>
            <text x="0" y="5" fontSize="9" fontWeight="700" fill="#1b2466" fillOpacity=".45" fontFamily="inherit">
              {r + 1}
            </text>
            {[0, 1, 2, 3].map((c) => (
              <circle
                key={c}
                cx={26 + c * 30}
                cy="2"
                r="7.5"
                stroke="#1b2466"
                strokeOpacity={c === filled ? 0 : 0.25}
                strokeWidth="1.5"
                fill={c === filled ? '#f2b544' : 'none'}
              />
            ))}
          </g>
        ))}
      </g>
      <g transform="rotate(38 96 170)">
        <rect x="40" y="162" width="118" height="16" rx="3" fill="#f2b544" />
        <rect x="140" y="162" width="18" height="16" fill="#e8a0a0" />
        <rect x="134" y="162" width="6" height="16" fill="#c9cdd8" />
        <path d="M40 162 22 170l18 8z" fill="#f6dcb0" />
        <path d="M27.5 167.6 22 170l5.5 2.4z" fill="#1b2466" />
      </g>
    </svg>
  )
}
