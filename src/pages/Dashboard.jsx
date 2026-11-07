import { useState } from 'react'
import { Link } from 'react-router-dom'
import questions from '../data/questions.json'
import { SUBJECTS, countByCategory, subjectOf } from '../data/subjects.js'
import { getProgress, resetProgress } from '../lib/progress.js'
import Icon from '../components/Icon.jsx'
import AnswerSheetArt from '../components/AnswerSheetArt.jsx'
import { useFlags, FLAGGED } from '../lib/flags.js'
import { areaScores } from '../data/syllabus.js'
import AreaBars from '../components/AreaBars.jsx'

const PASSING = 75 // percent; categories below this need more focus
const categories = Object.keys(countByCategory)

function SectionHeader({ title, to, linkLabel, state }) {
  return (
    <div className="mb-4 flex items-end justify-between">
      <h2 className="text-xl font-bold tracking-tight text-navy-950">{title}</h2>
      {to && (
        <Link to={to} state={state} className="inline-flex items-center gap-1 text-sm font-medium text-navy-950/55 hover:text-navy-950">
          {linkLabel} <Icon name="arrow" className="h-4 w-4" />
        </Link>
      )}
    </div>
  )
}

export default function Dashboard() {
  const [progress, setProgress] = useState(getProgress)
  const [query, setQuery] = useState('')
  const [flags] = useFlags()

  const rows = categories.map((name) => {
    const { correct = 0, wrong = 0 } = progress[name] ?? {}
    const total = correct + wrong
    return { name, correct, total, pct: total ? Math.round((correct / total) * 100) : null }
  })
  const attempted = rows.filter((r) => r.total)
  const weak = attempted.filter((r) => r.pct < PASSING).sort((a, b) => a.pct - b.pct)
  const totalCorrect = attempted.reduce((s, r) => s + r.correct, 0)
  const totalAnswered = attempted.reduce((s, r) => s + r.total, 0)
  const overall = totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : null

  // Weak topics first, then ones not tried yet.
  const recommended = [...weak, ...rows.filter((r) => !r.total)].slice(0, 6)
  const matches = query.trim()
    ? categories.filter((c) => `${c} ${subjectOf(c)?.name}`.toLowerCase().includes(query.trim().toLowerCase()))
    : []

  const reset = () => {
    if (window.confirm('Clear all saved progress?')) {
      resetProgress()
      setProgress({})
    }
  }

  return (
    <div className="space-y-10">
      <h1 className="sr-only">Home</h1>

      {/* Search */}
      <div className="relative">
        <label className="flex items-center gap-3 rounded-2xl bg-tile px-4 py-3.5 ring-navy-600 focus-within:bg-surface focus-within:ring-2">
          <Icon name="search" className="h-5 w-5 shrink-0 text-navy-950/60" />
          <span className="sr-only">Search topics</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics, e.g. synonyms, analogy, constitution"
            className="w-full bg-transparent text-[15px] text-navy-950 placeholder:text-navy-950/40 focus:outline-none"
          />
        </label>
        {query.trim() && (
          <ul className="card absolute inset-x-0 top-full z-20 mt-2 max-h-80 overflow-y-auto p-2">
            {matches.length === 0 && <li className="px-3 py-2.5 text-sm text-navy-950/50">No topics match “{query}”.</li>}
            {matches.map((c) => (
              <li key={c}>
                <Link to="/practice" state={{ category: c }} className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-navy-50">
                  <span>
                    <span className="block text-sm font-semibold text-navy-950">{c}</span>
                    <span className="text-xs text-navy-950/50">{subjectOf(c)?.name} · {countByCategory[c]} questions</span>
                  </span>
                  <Icon name="arrow" className="h-4 w-4 text-navy-950/40" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden rounded-[28px] bg-[#1b2466] text-white">
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_85%_10%,#34439f_0%,transparent_55%)]" />
        <div className="relative grid items-center gap-6 p-6 md:grid-cols-[1.2fr_1fr] md:p-10">
          <div>
            <p className="text-sm font-medium text-white/70">
              {totalAnswered ? `${overall}% overall · ${totalAnswered} answers so far` : 'Civil Service Exam · Professional & Sub-Professional'}
            </p>
            <p className="mt-3 text-[34px] font-extrabold leading-[1.08] tracking-tight md:text-5xl">
              Review smarter,
              <br />
              pass <span className="text-gold">sooner.</span>
            </p>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/75">
              {questions.length} reviewer questions across {categories.length} topics. Practice one topic at a time, then
              test yourself with a full mock exam.
            </p>
            <ul className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/85">
              <li className="flex items-center gap-2"><Icon name="list" className="h-4 w-4 text-gold" /> {questions.length} questions</li>
              <li className="flex items-center gap-2"><Icon name="practice" className="h-4 w-4 text-gold" /> {SUBJECTS.length} subjects</li>
              <li className="flex items-center gap-2"><Icon name="check" className="h-4 w-4 text-gold" /> Instant feedback</li>
            </ul>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/practice"
                state={weak[0] ? { category: weak[0].name } : undefined}
                className="inline-flex items-center justify-center gap-2.5 rounded-full bg-[#faf8f3] px-6 py-3 text-[15px] font-semibold text-[#1b2466] transition hover:bg-white"
              >
                <Icon name="practice" /> {weak[0] ? `Practice ${weak[0].name}` : 'Start practicing'}
              </Link>
              <Link
                to="/mock-exam"
                className="inline-flex items-center justify-center gap-2.5 rounded-full px-6 py-3 text-[15px] font-semibold text-white ring-1 ring-white/60 transition hover:bg-white/10"
              >
                <Icon name="play" /> Take mock exam
              </Link>
            </div>
          </div>
          <AnswerSheetArt className="mx-auto hidden w-full max-w-sm md:block" />
        </div>
      </section>

      {/* Subjects */}
      <section>
        <SectionHeader title="Subjects" to="/practice" linkLabel="All topics" />
        <ul className="grid grid-cols-3 gap-3 md:grid-cols-6">
          {SUBJECTS.map((s) => (
            <li key={s.name}>
              <Link
                to="/practice"
                state={{ subject: s.name }}
                className="flex h-full flex-col items-center gap-3 rounded-2xl bg-tile px-2 py-5 text-center transition hover:bg-navy-100"
              >
                <Icon name={s.icon} className="h-8 w-8 text-navy-950" strokeWidth={1.5} />
                <span className="text-[13px] font-medium leading-snug text-navy-950/80">{s.name}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link to="/mock-exam" className="flex h-full flex-col items-center gap-3 rounded-2xl bg-tile px-2 py-5 text-center transition hover:bg-navy-100">
              <Icon name="exam" className="h-8 w-8 text-navy-950" strokeWidth={1.5} />
              <span className="text-[13px] font-medium leading-snug text-navy-950/80">Mock Exam</span>
            </Link>
          </li>
        </ul>
      </section>

      {flags.size > 0 && (
        <Link to="/practice" state={{ category: FLAGGED }} className="card flex items-center gap-4 p-5 transition hover:-translate-y-0.5">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gold/20 text-navy-950">
            <Icon name="flag" className="h-6 w-6" />
          </span>
          <span className="flex-1">
            <span className="block font-bold text-navy-950">Flagged for review</span>
            <span className="text-sm text-navy-950/55">
              {flags.size} question{flags.size === 1 ? '' : 's'} you marked as a guess or worth another look
            </span>
          </span>
          <Icon name="arrow" className="h-5 w-5 text-navy-950/40" />
        </Link>
      )}

      {/* Recommended */}
      {recommended.length > 0 && (
        <section>
          <SectionHeader title={weak.length ? 'Needs more focus' : 'Recommended for you'} />
          <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:overflow-visible md:px-0">
            {recommended.map((r) => {
              const s = subjectOf(r.name)
              const isWeak = r.total > 0
              return (
                <li key={r.name} className="card flex w-72 shrink-0 snap-start flex-col overflow-hidden md:w-auto">
                  <div className="relative flex h-28 items-center justify-center bg-navy-50">
                    <Icon name={s.icon} className="h-12 w-12 text-navy-950/80" strokeWidth={1.25} />
                    <span
                      className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        isWeak ? 'bg-surface text-rose-700 dark:text-rose-400' : 'bg-surface text-navy-950/70'
                      }`}
                    >
                      {isWeak ? `Below ${PASSING}%` : 'Not started'}
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="font-bold text-navy-950">{r.name}</h3>
                    <p className="mt-1 text-sm text-navy-950/50">{s.name} · {countByCategory[r.name]} questions</p>
                    {isWeak && (
                      <div className="mt-3">
                        <div className="h-1.5 rounded-full bg-tile">
                          <div className="h-1.5 rounded-full bg-rose-500" style={{ width: `${r.pct}%` }} />
                        </div>
                        <p className="mt-1.5 text-xs text-navy-950/55">{r.correct} of {r.total} correct</p>
                      </div>
                    )}
                    <div className="mt-auto flex items-center justify-between pt-4">
                      <span className={`text-lg font-bold ${isWeak ? 'text-rose-700 dark:text-rose-400' : 'text-navy-950'}`}>{isWeak ? `${r.pct}%` : '—'}</span>
                      <Link to="/practice" state={{ category: r.name }} className="btn-primary px-6 py-2">
                        Practice
                      </Link>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {/* Progress */}
      <section>
        <SectionHeader title="Your progress" />
        <div className="card p-5 md:p-7">
          <dl className="grid grid-cols-3 divide-x divide-navy-950/5 text-center">
            <div>
              <dt className="text-xs font-medium text-navy-950/50">Answered</dt>
              <dd className="mt-1 text-2xl font-extrabold text-navy-950">{totalAnswered}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-navy-950/50">Overall</dt>
              <dd className="mt-1 text-2xl font-extrabold text-navy-950">{overall === null ? '—' : `${overall}%`}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-navy-950/50">Topics tried</dt>
              <dd className="mt-1 text-2xl font-extrabold text-navy-950">
                {attempted.length}<span className="text-base font-semibold text-navy-950/35">/{categories.length}</span>
              </dd>
            </div>
          </dl>

          <div className="mt-7 border-t border-navy-950/5 pt-6">
            <h3 className="mb-4 text-sm font-bold text-navy-950/70">By exam area</h3>
            <AreaBars areas={areaScores(progress)} />
          </div>

          <h3 className="mt-7 border-t border-navy-950/5 pt-6 text-sm font-bold text-navy-950/70">By topic</h3>
          <ul className="mt-4 grid gap-x-10 gap-y-4 md:grid-cols-2">
            {rows.map((r) => (
              <li key={r.name}>
                <div className="flex justify-between gap-3 text-sm">
                  <span className="truncate font-medium text-navy-950/80">{r.name}</span>
                  <span className={`shrink-0 font-semibold tabular-nums ${r.pct === null ? 'text-navy-950/30' : r.pct < PASSING ? 'text-rose-700 dark:text-rose-400' : 'text-navy-700'}`}>
                    {r.pct === null ? 'Not started' : `${r.pct}%`}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-tile" role="progressbar" aria-label={`${r.name} score`} aria-valuenow={r.pct ?? 0} aria-valuemin={0} aria-valuemax={100}>
                  <div className={`h-1.5 rounded-full ${r.pct < PASSING ? 'bg-rose-500' : 'bg-navy-700'}`} style={{ width: `${r.pct ?? 0}%` }} />
                </div>
              </li>
            ))}
          </ul>

          {totalAnswered > 0 && (
            <button onClick={reset} className="mt-6 text-xs font-medium text-navy-950/40 hover:text-rose-700">
              Reset progress
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
