import { useState } from 'react'
import Icon from './Icon.jsx'
import { getHint } from '../lib/hints.js'

const LETTERS = 'abcde'

// Emphasize the italicized target word (Synonyms, Antonyms, …) so the question makes sense.
function QuestionText({ text, highlight }) {
  const i = highlight ? text.indexOf(highlight) : -1
  if (i < 0) return text
  return (
    <>
      {text.slice(0, i)}
      <mark className="rounded bg-gold/30 px-1 font-bold text-navy-950">{highlight}</mark>
      {text.slice(i + highlight.length)}
    </>
  )
}

const optionClass = {
  right: 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/15',
  wrong: 'border-rose-500 bg-rose-50 dark:bg-rose-500/15',
  picked: 'border-navy-900 bg-navy-50',
  idle: 'border-navy-950/10 bg-surface',
}
const badgeClass = {
  right: 'bg-emerald-600 text-white',
  wrong: 'bg-rose-600 text-white',
  picked: 'bg-navy-900 text-white',
  idle: 'bg-tile text-navy-950/70',
}

// Render with key={q.id} so the hint closes when the question changes.
// reveal: show which option is correct and which the user picked.
export default function QuestionCard({ q, number, selected, onSelect, reveal = false, flagged, onFlag }) {
  const [hintOpen, setHintOpen] = useState(false)
  const hint = hintOpen ? getHint(q) : null

  const state = (opt) => {
    if (reveal && opt === q.answer) return 'right'
    if (reveal && opt === selected) return 'wrong'
    if (opt === selected) return 'picked'
    return 'idle'
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        {!reveal && (
          <button
            type="button"
            onClick={() => setHintOpen(!hintOpen)}
            aria-expanded={hintOpen}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              hintOpen ? 'bg-gold/25 text-navy-950' : 'bg-tile text-navy-950/65 hover:text-navy-950'
            }`}
          >
            <Icon name="bulb" className="h-4 w-4" /> {hintOpen ? 'Hide hint' : 'Hint'}
          </button>
        )}
        {onFlag && (
          <button
            type="button"
            onClick={() => onFlag(q.id)}
            aria-pressed={flagged}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              flagged ? 'bg-navy-900 text-white' : 'bg-tile text-navy-950/65 hover:text-navy-950'
            }`}
          >
            <Icon name="flag" className="h-4 w-4" /> {flagged ? 'Flagged for review' : 'Flag for review'}
          </button>
        )}
      </div>

      {hint && (
        <div className="rounded-2xl bg-gold/15 p-4 text-sm leading-relaxed text-navy-950/85 ring-1 ring-gold/40" role="note">
          <p>{hint.tip}</p>
          {hint.ruledOut.length > 0 && (
            <p className="mt-2 font-semibold text-navy-950">
              You can rule out {hint.ruledOut.join(' and ')}.
            </p>
          )}
        </div>
      )}

      {q.passage && (
        <div className="max-h-72 overflow-y-auto whitespace-pre-line rounded-2xl bg-cream p-5 text-[15px] leading-relaxed text-navy-950/80 ring-1 ring-navy-950/5">
          {q.passage}
        </div>
      )}

      <h2 className="text-lg font-semibold leading-relaxed text-navy-950 md:text-xl">
        {number != null && <span className="mr-2 text-navy-950/35 tabular-nums">{number}.</span>}
        <QuestionText text={q.question} highlight={q.highlight} />
      </h2>

      <ul className="space-y-2.5">
        {q.options.map((opt, i) => {
          const s = state(opt)
          const ruledOut = hint?.ruledOut.includes(LETTERS[i].toUpperCase())
          return (
            <li key={i}>
              <button
                type="button"
                disabled={reveal}
                onClick={() => onSelect(opt)}
                aria-pressed={s === 'picked'}
                className={`flex w-full items-center gap-3.5 rounded-2xl border-[1.5px] px-4 py-3.5 text-left text-[15px] text-navy-950 transition ${optionClass[s]} ${
                  reveal && s === 'idle' ? 'opacity-60' : ''
                } ${!reveal && s === 'idle' ? 'hover:border-navy-950/30' : ''} ${ruledOut && s === 'idle' ? 'opacity-45 line-through decoration-navy-950/40' : ''}`}
              >
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold uppercase no-underline transition ${badgeClass[s]}`}>
                  {LETTERS[i]}
                </span>
                <span className="flex-1">{opt}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
