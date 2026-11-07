import { useEffect, useState } from 'react'
import questions from '../data/questions.json'
import QuestionCard from '../components/QuestionCard.jsx'
import Icon from '../components/Icon.jsx'
import { recordAnswers } from '../lib/progress.js'
import { useFlags } from '../lib/flags.js'
import { load, save } from '../lib/store.js'

// Real CSE formats; "Quick" keeps the Professional pace (~67s per item).
const PRESETS = [
  { id: 'pro', name: 'Professional', items: 170, minutes: 190, note: '3 hours 10 minutes' },
  { id: 'subpro', name: 'Sub-Professional', items: 165, minutes: 160, note: '2 hours 40 minutes' },
  { id: 'quick', name: 'Quick drill', items: 50, minutes: 56, note: '56 minutes' },
]
const PASSING = 80
const SESSION_KEY = 'cse-exam' // in-progress exam, so a refresh or leaving the page doesn't reset the clock
const byId = Object.fromEntries(questions.map((q) => [q.id, q]))

function pickRandom(list, n) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a.slice(0, n)
}

function formatTime(ms) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const h = Math.floor(s / 3600)
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  return `${h}:${m}:${String(s % 60).padStart(2, '0')}`
}

function loadSession() {
  const s = load(SESSION_KEY, null)
  // Drop sessions that point at questions no longer in the bank.
  return s && s.ids.every((id) => byId[id]) ? s : null
}

export default function MockExam() {
  const [session, setSession] = useState(loadSession) // { preset, ids, answers, index, deadline }
  const [result, setResult] = useState(null) // { exam, answers, timedOut }
  const [now, setNow] = useState(() => Date.now())
  const [view, setView] = useState('mistakes')
  const [flags, toggleFlag] = useFlags()

  const update = (patch) => {
    const next = { ...session, ...patch }
    save(SESSION_KEY, next)
    setSession(next)
  }

  const finish = (s, timedOut) => {
    const exam = s.ids.map((id) => byId[id])
    // Skipped questions aren't answers, so they don't count toward topic progress.
    recordAnswers(exam.filter((q) => s.answers[q.id]).map((q) => ({ category: q.category, correct: s.answers[q.id] === q.answer })))
    save(SESSION_KEY, undefined)
    setSession(null)
    setResult({ exam, answers: s.answers, timedOut })
    setView('mistakes')
  }

  // Tick once a second against a fixed deadline, so time can't drift or be paused; auto-submit at zero.
  useEffect(() => {
    if (!session) return
    const t = setInterval(() => {
      if (Date.now() >= session.deadline) finish(session, true)
      else setNow(Date.now())
    }, 1000)
    return () => clearInterval(t)
  }, [session]) // eslint-disable-line react-hooks/exhaustive-deps -- finish only reads session

  const remaining = session ? session.deadline - now : 0

  const start = (preset) => {
    const s = {
      preset: preset.id,
      ids: pickRandom(questions, preset.items).map((q) => q.id),
      answers: {},
      index: 0,
      deadline: Date.now() + preset.minutes * 60_000,
    }
    save(SESSION_KEY, s)
    setNow(Date.now())
    setResult(null)
    setSession(s)
  }

  // ---------- Results ----------
  if (result) {
    const { exam, answers, timedOut } = result
    const mistakes = exam.filter((q) => answers[q.id] !== q.answer)
    const flaggedHere = exam.filter((q) => flags.has(q.id))
    const score = exam.length - mistakes.length
    const pct = Math.round((score / exam.length) * 100)
    const list = view === 'mistakes' ? mistakes : flaggedHere
    return (
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-[28px] bg-[#1b2466] p-8 text-center text-white md:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(100%_100%_at_50%_0%,#34439f_0%,transparent_60%)]" />
          <div className="relative">
            <h1 className="text-sm font-semibold text-white/70">{timedOut ? "Time's up. Your exam was submitted automatically." : 'Exam submitted'}</h1>
            <p className="mt-3 text-6xl font-extrabold tracking-tight">{pct}%</p>
            <p className="mt-2 text-white/75">
              {score} of {exam.length} correct ·{' '}
              <span className={pct >= PASSING ? 'font-semibold text-gold' : ''}>{pct >= PASSING ? 'Passing' : `Below the ${PASSING}% passing rate`}</span>
            </p>
            <button onClick={() => setResult(null)} className="mt-6 rounded-full bg-[#faf8f3] px-6 py-2.5 text-sm font-semibold text-[#1b2466] hover:bg-white">
              Take another exam
            </button>
          </div>
        </section>

        <div className="flex gap-2" role="tablist" aria-label="Review">
          {[
            ['mistakes', `Mistakes (${mistakes.length})`],
            ['flagged', `Flagged (${flaggedHere.length})`],
          ].map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={view === id}
              onClick={() => setView(id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${view === id ? 'bg-navy-900 text-white' : 'bg-tile text-navy-950/65 hover:bg-navy-100'}`}
            >
              {label}
            </button>
          ))}
        </div>

        {list.length === 0 && (
          <p className="text-navy-950/55">{view === 'mistakes' ? 'No mistakes. Perfect score!' : 'You did not flag any questions in this exam.'}</p>
        )}
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((q) => (
            <div key={q.id} className="card space-y-3 p-5 md:p-6">
              <QuestionCard
                q={q}
                number={exam.indexOf(q) + 1}
                selected={answers[q.id]}
                reveal
                flagged={flags.has(q.id)}
                onFlag={toggleFlag}
              />
              {!answers[q.id] && <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">Not answered</p>}
              {q.explanation && <p className="text-sm text-navy-950/70">{q.explanation}</p>}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ---------- Start screen ----------
  if (!session) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-[28px] font-extrabold tracking-tight text-navy-950">Mock exam</h1>
          <p className="mt-1 text-navy-950/55">
            Random questions from every topic under a strict countdown. The clock keeps running if you leave the page, and the exam
            submits itself when time runs out. Your score is shown only at the end.
          </p>
        </div>
        <ul className="grid gap-3 md:grid-cols-3">
          {PRESETS.map((p) => (
            <li key={p.id}>
              <button onClick={() => start(p)} className="card group flex h-full w-full flex-col p-5 text-left transition hover:-translate-y-0.5">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-tile text-navy-950">
                  <Icon name={p.id === 'quick' ? 'play' : 'exam'} className="h-5 w-5" />
                </span>
                <span className="mt-4 font-bold text-navy-950">{p.name}</span>
                <span className="mt-1 text-sm text-navy-950/55">{p.items} items</span>
                <span className="mt-0.5 flex items-center gap-1.5 text-sm text-navy-950/55">
                  <Icon name="clock" className="h-4 w-4" /> {p.note}
                </span>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-navy-950">
                  Start <Icon name="arrow" className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // ---------- In progress ----------
  const exam = session.ids.map((id) => byId[id])
  const { answers, index } = session
  const q = exam[index]
  const answeredCount = Object.keys(answers).length
  const flaggedCount = exam.filter((x) => flags.has(x.id)).length
  const low = remaining < 5 * 60_000
  const preset = PRESETS.find((p) => p.id === session.preset)

  const submit = () => {
    const left = exam.length - answeredCount
    const msg = left ? `You have ${left} unanswered question(s). Submit anyway?` : 'Submit your exam?'
    if (window.confirm(msg)) finish(session, false)
  }

  const timer = (
    <div
      className={`flex items-center gap-2 rounded-full px-4 py-2 font-bold tabular-nums ${
        low ? 'bg-rose-600 text-white motion-safe:animate-pulse' : 'bg-navy-900 text-white'
      }`}
      role="timer"
      aria-label={`Time remaining ${formatTime(remaining)}`}
    >
      <Icon name="clock" className="h-4 w-4" /> {formatTime(remaining)}
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Mobile: sticky timer bar */}
      <div className="sticky top-16 z-20 -mx-4 flex items-center justify-between bg-cream/90 px-4 py-2 backdrop-blur lg:hidden">
        <span className="text-sm font-semibold text-navy-950/60 tabular-nums">{index + 1} / {exam.length}</span>
        {timer}
      </div>

      <section className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="card p-5 md:p-8">
          <p className="mb-4 text-xs font-semibold text-navy-950/45">{q.category}</p>
          <QuestionCard
            key={q.id}
            q={q}
            number={index + 1}
            selected={answers[q.id] ?? null}
            onSelect={(opt) => update({ answers: { ...answers, [q.id]: opt } })}
            flagged={flags.has(q.id)}
            onFlag={toggleFlag}
          />

          <div className="mt-6 flex gap-3 border-t border-navy-950/5 pt-6">
            <button onClick={() => update({ index: index - 1 })} disabled={index === 0} className="btn-ghost">
              <Icon name="back" className="h-4 w-4" /> Previous
            </button>
            {index + 1 < exam.length ? (
              <button onClick={() => update({ index: index + 1 })} className="btn-primary ml-auto">
                Next <Icon name="arrow" className="h-4 w-4" />
              </button>
            ) : (
              <button onClick={submit} className="btn-primary ml-auto">Submit exam</button>
            )}
          </div>
        </div>

        <aside className="card h-fit space-y-5 p-5 lg:sticky lg:top-28">
          <div className="hidden items-center justify-between lg:flex">
            <span className="text-sm font-bold text-navy-950">{preset?.name}</span>
            {timer}
          </div>

          <div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-navy-950">Answered</span>
              <span className="tabular-nums text-navy-950/55">{answeredCount}/{exam.length}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-tile">
              <div className="h-1.5 rounded-full bg-navy-900 transition-all" style={{ width: `${(answeredCount / exam.length) * 100}%` }} />
            </div>
          </div>

          <nav className="grid max-h-72 grid-cols-8 gap-1.5 overflow-y-auto p-0.5 sm:grid-cols-10 lg:grid-cols-7" aria-label="Question navigator">
            {exam.map((x, i) => (
              <button
                key={x.id}
                onClick={() => update({ index: i })}
                aria-label={`Question ${i + 1}${answers[x.id] ? ', answered' : ''}${flags.has(x.id) ? ', flagged' : ''}`}
                aria-current={i === index ? 'step' : undefined}
                className={`relative aspect-square rounded-lg text-[11px] font-semibold tabular-nums transition ${
                  i === index ? 'ring-2 ring-navy-900 ring-offset-1 ring-offset-surface' : ''
                } ${answers[x.id] ? 'bg-navy-900 text-white' : 'bg-tile text-navy-950/60 hover:bg-navy-100'}`}
              >
                {i + 1}
                {flags.has(x.id) && <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gold ring-2 ring-surface" />}
              </button>
            ))}
          </nav>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-950/55">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-navy-900" /> Answered</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-tile ring-1 ring-navy-950/10" /> Unanswered</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gold" /> Flagged ({flaggedCount})</span>
          </div>

          <button onClick={submit} className="btn-primary w-full py-3">Submit exam</button>
        </aside>
      </section>
    </div>
  )
}
