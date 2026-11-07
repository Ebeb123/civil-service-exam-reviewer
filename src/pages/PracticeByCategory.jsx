import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import questions from '../data/questions.json'
import { SUBJECTS, countByCategory, subjectOf } from '../data/subjects.js'
import QuestionCard from '../components/QuestionCard.jsx'
import Icon from '../components/Icon.jsx'
import { getProgress, recordAnswers } from '../lib/progress.js'
import { useFlags, FLAGGED } from '../lib/flags.js'

export default function PracticeByCategory() {
  // Home can open a category or subject directly via router state.
  const { state } = useLocation()
  const [flags, toggleFlag] = useFlags()
  const poolFor = (c) => (c === FLAGGED ? questions.filter((q) => flags.has(q.id)) : questions.filter((q) => q.category === c))

  const [category, setCategory] = useState(state?.category ?? null)
  // Snapshot the pool so unflagging mid-review doesn't shift the questions.
  const [pool, setPool] = useState(() => (state?.category ? poolFor(state.category) : []))
  const [subject, setSubject] = useState(state?.subject ?? 'All')
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [correct, setCorrect] = useState(0)

  const start = (c) => {
    setCategory(c)
    setPool(poolFor(c))
    setIndex(0)
    setSelected(null)
    setCorrect(0)
  }

  if (!category || pool.length === 0) {
    const progress = getProgress()
    const shown = SUBJECTS.filter((s) => subject === 'All' || s.name === subject)
    return (
      <div className="space-y-7">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-navy-950">Practice by topic</h1>
          <p className="mt-1 text-navy-950/55">Answers and feedback appear right after each question.</p>
        </div>

        {flags.size > 0 && (
          <button
            onClick={() => start(FLAGGED)}
            className="flex w-full items-center gap-4 rounded-3xl bg-navy-900 p-5 text-left text-white transition hover:bg-navy-800"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15">
              <Icon name="flag" className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="block font-bold">Review flagged questions</span>
              <span className="text-sm text-white/70">{flags.size} question{flags.size === 1 ? '' : 's'} you marked to look at again</span>
            </span>
            <Icon name="arrow" className="h-5 w-5" />
          </button>
        )}

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0" role="tablist" aria-label="Subject">
          {['All', ...SUBJECTS.map((s) => s.name)].map((name) => (
            <button
              key={name}
              role="tab"
              aria-selected={subject === name}
              onClick={() => setSubject(name)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                subject === name ? 'bg-navy-900 text-white' : 'bg-tile text-navy-950/65 hover:bg-navy-100'
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        {shown.map((s) => (
          <section key={s.name}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy-950/70">
              <Icon name={s.icon} className="h-4 w-4" /> {s.name}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {s.items.filter((c) => countByCategory[c]).map((c) => {
                const p = progress[c]
                const total = p ? p.correct + p.wrong : 0
                const pct = total ? Math.round((p.correct / total) * 100) : null
                return (
                  <li key={c}>
                    <button onClick={() => start(c)} className="card group flex w-full items-center gap-4 p-4 text-left transition hover:-translate-y-0.5">
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-tile text-navy-950">
                        <Icon name={s.icon} className="h-6 w-6" strokeWidth={1.5} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-navy-950">{c}</span>
                        <span className="text-sm text-navy-950/50">
                          {countByCategory[c]} questions
                          {pct !== null && <span className={pct < 75 ? 'text-rose-600 dark:text-rose-400' : 'text-navy-700'}> · {pct}%</span>}
                        </span>
                      </span>
                      <Icon name="arrow" className="h-5 w-5 text-navy-950/25 transition group-hover:translate-x-0.5 group-hover:text-navy-950" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    )
  }

  const done = index >= pool.length

  if (done) {
    const pct = Math.round((correct / pool.length) * 100)
    return (
      <section className="card mx-auto max-w-md p-8 text-center">
        <p className="text-sm font-semibold text-navy-950/50">{category}</p>
        <p className="mt-4 text-6xl font-extrabold tracking-tight text-navy-950">{pct}%</p>
        <p className="mt-2 text-navy-950/60">{correct} of {pool.length} correct</p>
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={() => start(category)} className="btn-primary">Try again</button>
          <button onClick={() => setCategory(null)} className="btn-ghost">All topics</button>
        </div>
      </section>
    )
  }

  const q = pool[index]
  const answered = selected !== null
  const isRight = selected === q.answer

  const choose = (opt) => {
    setSelected(opt)
    if (opt === q.answer) setCorrect((n) => n + 1)
    recordAnswers([{ category: q.category, correct: opt === q.answer }])
  }

  const next = () => {
    setSelected(null)
    setIndex(index + 1)
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={() => setCategory(null)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-950/55 hover:text-navy-950">
          <Icon name="back" className="h-4 w-4" /> All topics
        </button>
        <span className="text-sm font-semibold tabular-nums text-navy-950/55">
          <span className="text-navy-950">{correct}</span> correct
        </span>
      </div>

      <div>
        <div className="mb-2 flex justify-between text-xs font-semibold text-navy-950/50">
          <span>{category === FLAGGED ? FLAGGED : `${subjectOf(category)?.name} · ${category}`}</span>
          <span className="tabular-nums">{index + 1} / {pool.length}</span>
        </div>
        <div className="h-1.5 rounded-full bg-tile">
          <div className="h-1.5 rounded-full bg-navy-900 transition-all" style={{ width: `${((index + (answered ? 1 : 0)) / pool.length) * 100}%` }} />
        </div>
      </div>

      <div className="card p-5 md:p-8">
        <QuestionCard
          key={q.id}
          q={q}
          number={index + 1}
          selected={selected}
          onSelect={choose}
          reveal={answered}
          flagged={flags.has(q.id)}
          onFlag={toggleFlag}
        />

        {answered && (
          <div className="mt-6 flex flex-col gap-4 border-t border-navy-950/5 pt-6 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
            <div className="flex items-start gap-3">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                  isRight ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                }`}
              >
                <Icon name={isRight ? 'check' : 'x'} className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <div>
                <p className="font-bold text-navy-950">{isRight ? 'Correct' : 'Not quite'}</p>
                {!isRight && <p className="text-sm text-navy-950/65">Answer: <span className="font-semibold text-navy-950">{q.answer}</span></p>}
                {q.explanation && <p className="mt-1 text-sm text-navy-950/65">{q.explanation}</p>}
              </div>
            </div>
            <button onClick={next} className="btn-primary shrink-0">
              {index + 1 < pool.length ? 'Next question' : 'See results'} <Icon name="arrow" className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
