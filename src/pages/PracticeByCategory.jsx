import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import questions from '../data/questions.json'
import { subjectOf } from '../data/subjects.js'
import { TRACKS, trackCount, trackPool, MIXED_COUNTS, areaScores } from '../data/syllabus.js'
import AreaBars from '../components/AreaBars.jsx'
import QuestionCard from '../components/QuestionCard.jsx'
import Icon from '../components/Icon.jsx'
import { getProgress, recordAnswers } from '../lib/progress.js'
import { useFlags, FLAGGED } from '../lib/flags.js'
import { load, save } from '../lib/store.js'

const PASSING = 75

// Unfinished "Practice Now" session per track, so it can be continued later.
// Its answers only count toward progress once the session is finished; "Start new" discards them.
const mixedKey = (trackId) => `cse-mixed-${trackId}`
const byId = new Map(questions.map((q) => [q.id, q]))

const shuffle = (list) => {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Categories answered at least once and scoring below the passing mark.
const weakCategories = () =>
  Object.entries(getProgress())
    .filter(([, p]) => p.correct + p.wrong > 0 && (p.correct / (p.correct + p.wrong)) * 100 < PASSING)
    .map(([c]) => c)

const TRACK_CARDS = [
  { id: 'professional', icon: 'target', blurb: 'Verbal, Numerical, Analytical and General Information.' },
  { id: 'subprofessional', icon: 'list', blurb: 'Verbal, Numerical, Clerical and General Information.' },
  { id: 'drills', icon: 'clock', blurb: 'Short mixed sets, weak spots and flagged questions.' },
]

export default function PracticeByCategory() {
  // Home can open a reviewer category (or the flagged set) directly via router state.
  const { state } = useLocation()
  const [flags, toggleFlag] = useFlags()

  // A session is { label, build }: build() returns the question pool, so "Try again" can rebuild it.
  const flaggedSession = () => ({ label: FLAGGED, build: () => questions.filter((q) => flags.has(q.id)) })
  const initialSession = () => {
    if (state?.category === FLAGGED) return flaggedSession()
    if (state?.category) return { label: `${subjectOf(state.category)?.name} · ${state.category}`, build: () => questions.filter((q) => q.category === state.category) }
    return null
  }

  const [track, setTrack] = useState(null)
  const [session, setSession] = useState(initialSession)
  // Snapshot the pool so unflagging mid-review doesn't shift the questions.
  const [pool, setPool] = useState(() => session?.build() ?? [])
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [correct, setCorrect] = useState(0)
  // This session's answers, for the per-area breakdown on the results screen.
  const [answers, setAnswers] = useState([])
  const [picking, setPicking] = useState(false)

  const [resumePrompt, setResumePrompt] = useState(null)

  // saved: a stored mixed session to restore, otherwise start from the first question.
  const start = (s, saved = null) => {
    const p = saved ? saved.ids.map((id) => byId.get(id)).filter(Boolean) : s.build()
    setSession(s)
    setPool(p)
    setIndex(saved?.index ?? 0)
    setSelected(saved?.selected ?? null)
    setCorrect(saved?.correct ?? 0)
    setAnswers(saved?.answers ?? [])
    setPicking(false)
    setResumePrompt(null)
    if (s.track && !saved) save(mixedKey(s.track), { label: s.label, count: p.length, ids: p.map((q) => q.id), index: 0, selected: null, correct: 0, answers: [] })
  }
  const mixedSession = (trackId, n) => ({ track: trackId, label: `${TRACKS[trackId].name} · Mixed · ${n} items`, build: () => shuffle(trackPool(TRACKS[trackId])).slice(0, n) })
  const practiceNow = () => {
    const saved = load(mixedKey(track), null)
    if (saved) setResumePrompt(saved)
    else setPicking(true)
  }
  const startNew = () => {
    save(mixedKey(track), undefined) // discard the unfinished session; nothing from it is recorded
    setResumePrompt(null)
    setPicking(true)
  }
  const exit = () => setSession(null)
  const openTrack = (id) => {
    setTrack(id)
    setPicking(false)
    setResumePrompt(null)
  }

  // 1. Track menu
  if (!session || pool.length === 0) {
    if (!track) {
      return (
        <div className="space-y-7">
          <div>
            <h1 className="text-[28px] font-extrabold tracking-tight text-navy-950">Practice mode</h1>
            <p className="mt-1 text-navy-950/55">Choose your track. Answers and explanations appear right after each question.</p>
          </div>
          <ul className="grid gap-4 md:grid-cols-3">
            {TRACK_CARDS.map((t) => (
              <li key={t.id}>
                <button
                  onClick={() => openTrack(t.id)}
                  className="card group flex h-full w-full flex-col gap-4 p-6 text-left transition hover:-translate-y-0.5"
                >
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-tile text-navy-950">
                    <Icon name={t.icon} className="h-7 w-7" strokeWidth={1.5} />
                  </span>
                  <span className="flex-1">
                    <span className="block text-lg font-bold text-navy-950">{t.id === 'drills' ? 'Drills' : TRACKS[t.id].name}</span>
                    <span className="mt-1 block text-sm text-navy-950/55">{t.blurb}</span>
                  </span>
                  <span className="flex items-center justify-between text-sm font-semibold text-navy-950/50">
                    {t.id === 'drills' ? 'Quick practice' : `${trackCount(TRACKS[t.id])} questions`}
                    <Icon name="arrow" className="h-5 w-5 text-navy-950/25 transition group-hover:translate-x-0.5 group-hover:text-navy-950" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )
    }

    const back = (
      <button onClick={() => openTrack(null)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-950/55 hover:text-navy-950">
        <Icon name="back" className="h-4 w-4" /> All tracks
      </button>
    )

    // 2a. Drills
    if (track === 'drills') {
      const weak = weakCategories()
      const drills = [
        { name: 'Quick 10', desc: '10 random questions from every topic', icon: 'clock', build: () => shuffle(questions).slice(0, 10) },
        { name: 'Quick 25', desc: '25 random questions from every topic', icon: 'list', build: () => shuffle(questions).slice(0, 25) },
        weak.length > 0 && {
          name: 'Weak spots',
          desc: `20 questions from ${weak.length} topic${weak.length === 1 ? '' : 's'} below ${PASSING}%`,
          icon: 'target',
          build: () => shuffle(questions.filter((q) => weak.includes(q.category))).slice(0, 20),
        },
        flags.size > 0 && { name: FLAGGED, desc: `${flags.size} question${flags.size === 1 ? '' : 's'} you marked`, icon: 'flag', build: flaggedSession().build },
      ].filter(Boolean)

      return (
        <div className="space-y-7">
          {back}
          <h1 className="text-[28px] font-extrabold tracking-tight text-navy-950">Drills</h1>
          <ul className="grid gap-3 sm:grid-cols-2">
            {drills.map((d) => (
              <li key={d.name}>
                <button onClick={() => start({ label: `Drills · ${d.name}`, build: d.build })} className="card group flex w-full items-center gap-4 p-4 text-left transition hover:-translate-y-0.5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-tile text-navy-950">
                    <Icon name={d.icon} className="h-6 w-6" strokeWidth={1.5} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-navy-950">{d.name}</span>
                    <span className="text-sm text-navy-950/50">{d.desc}</span>
                  </span>
                  <Icon name="arrow" className="h-5 w-5 text-navy-950/25 transition group-hover:translate-x-0.5 group-hover:text-navy-950" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )
    }

    // 2b. Professional / Sub-Professional syllabus
    const t = TRACKS[track]
    return (
      <div className="space-y-7">
        {back}
        <h1 className="text-[28px] font-extrabold tracking-tight text-navy-950">{t.name}</h1>

        <div className="rounded-3xl bg-navy-900 p-5 text-white md:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15">
              <Icon name="play" className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="block text-lg font-bold">Practice Now</span>
              <span className="text-sm text-white/70">Mixed questions from every {t.name} area, shuffled. Leave anytime and continue later; scores count once you finish.</span>
            </span>
            {!picking && !resumePrompt && (
              <button onClick={practiceNow} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#faf8f3] px-6 py-2.5 font-semibold text-[#1b2466] transition hover:bg-white">
                Practice Now <Icon name="arrow" className="h-4 w-4" />
              </button>
            )}
          </div>
          {resumePrompt && (
            <div className="mt-5 border-t border-white/15 pt-5">
              <p className="font-semibold">You have an unfinished session</p>
              <p className="mt-1 text-sm text-white/70">
                {resumePrompt.label} · {resumePrompt.answers.length} of {resumePrompt.count} answered. Starting new discards it, and none of its answers are recorded.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <button
                  onClick={() => start({ ...mixedSession(track, resumePrompt.count), label: resumePrompt.label }, resumePrompt)}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#faf8f3] px-6 py-2.5 font-semibold text-[#1b2466] transition hover:bg-white"
                >
                  Continue <Icon name="arrow" className="h-4 w-4" />
                </button>
                <button onClick={startNew} className="rounded-full px-6 py-2.5 font-semibold text-white ring-1 ring-white/50 transition hover:bg-white/10">
                  Start new
                </button>
              </div>
            </div>
          )}
          {picking && (
            <div className="mt-5 border-t border-white/15 pt-5">
              <p className="mb-3 text-sm font-semibold text-white/80">How many questions?</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {MIXED_COUNTS.map((n) => (
                  <button
                    key={n}
                    onClick={() => start(mixedSession(track, n))}
                    className="rounded-2xl bg-white/10 px-4 py-3 text-center ring-1 ring-white/20 transition hover:bg-white/20"
                  >
                    <span className="block text-2xl font-extrabold tabular-nums">{n}</span>
                    <span className="text-xs text-white/65">items</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setPicking(false)} className="mt-3 text-xs font-semibold text-white/60 hover:text-white">Cancel</button>
            </div>
          )}
        </div>

        {t.sections.map((s) => (
          <section key={s.name}>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-navy-950/70">
              <Icon name={s.icon} className="h-4 w-4" /> {s.name}
            </h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {s.topics.map((topic) => {
                const n = topic.questions.length
                return (
                  <li key={topic.name}>
                    <button
                      disabled={n === 0}
                      onClick={() => start({ label: `${t.name} · ${s.name} · ${topic.name}`, build: () => topic.questions })}
                      className="card group flex w-full items-center gap-4 p-4 text-left transition enabled:hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-tile text-navy-950">
                        <Icon name={s.icon} className="h-6 w-6" strokeWidth={1.5} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-bold text-navy-950">{topic.name}</span>
                        <span className="text-sm text-navy-950/50">{n ? `${n} questions` : 'Coming soon'}</span>
                      </span>
                      {n > 0 && <Icon name="arrow" className="h-5 w-5 text-navy-950/25 transition group-hover:translate-x-0.5 group-hover:text-navy-950" />}
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

  // 3. Results
  if (index >= pool.length) {
    const pct = Math.round((correct / pool.length) * 100)
    return (
      <section className="card mx-auto max-w-lg p-8 text-center">
        <p className="text-sm font-semibold text-navy-950/50">{session.label}</p>
        <p className="mt-4 text-6xl font-extrabold tracking-tight text-navy-950">{pct}%</p>
        <p className="mt-2 text-navy-950/60">{correct} of {pool.length} correct</p>
        {answers.length > 0 && (
          <div className="mt-7 border-t border-navy-950/5 pt-6 text-left">
            <p className="mb-4 text-sm font-bold text-navy-950/70">Score by area</p>
            <AreaBars areas={areaScores(answers.reduce((m, a) => {
              const p = (m[a.category] ??= { correct: 0, wrong: 0 })
              p[a.correct ? 'correct' : 'wrong']++
              return m
            }, {})).filter((a) => a.total)} />
          </div>
        )}
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={() => start(session)} className="btn-primary">Try again</button>
          <button onClick={exit} className="btn-ghost">Back to topics</button>
        </div>
      </section>
    )
  }

  // 4. Question with instant feedback
  const q = pool[index]
  const answered = selected !== null
  const isRight = selected === q.answer

  const choose = (opt) => {
    if (answered) return // one attempt per question
    setSelected(opt)
    if (opt === q.answer) setCorrect((n) => n + 1)
    const result = { category: q.category, correct: opt === q.answer }
    const nextAnswers = [...answers, result]
    setAnswers(nextAnswers)
    if (session.track) {
      const saved = load(mixedKey(session.track), null)
      if (saved) save(mixedKey(session.track), { ...saved, selected: opt, correct: correct + (result.correct ? 1 : 0), answers: nextAnswers })
    } else {
      recordAnswers([result])
    }
  }

  const next = () => {
    setSelected(null)
    setIndex(index + 1)
    if (!session.track) return
    const saved = load(mixedKey(session.track), null)
    if (index + 1 < pool.length) {
      if (saved) save(mixedKey(session.track), { ...saved, index: index + 1, selected: null })
    } else {
      // Finished: count the whole session toward progress, then clear it.
      if (saved) recordAnswers(answers)
      save(mixedKey(session.track), undefined)
    }
  }

  return (
    <section className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between">
        <button onClick={exit} className="inline-flex items-center gap-1.5 text-sm font-semibold text-navy-950/55 hover:text-navy-950">
          <Icon name="back" className="h-4 w-4" /> Back to topics
        </button>
        <span className="text-sm font-semibold tabular-nums text-navy-950/55">
          <span className="text-navy-950">{correct}</span> correct
        </span>
      </div>

      <div>
        <div className="mb-2 flex justify-between gap-4 text-xs font-semibold text-navy-950/50">
          <span className="truncate">{session.label}</span>
          <span className="shrink-0 tabular-nums">{index + 1} / {pool.length}</span>
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
          <div className="mt-5 space-y-5" aria-live="polite">
            <div
              className={`flex items-start gap-3 rounded-2xl p-4 ring-1 ${
                isRight
                  ? 'bg-emerald-50 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30'
                  : 'bg-rose-50 ring-rose-200 dark:bg-rose-500/10 dark:ring-rose-500/30'
              }`}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                  isRight ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'
                }`}
              >
                <Icon name={isRight ? 'check' : 'x'} className="h-5 w-5" strokeWidth={2.25} />
              </span>
              <div className="text-sm leading-relaxed text-navy-950/75">
                <p className="text-base font-bold text-navy-950">{isRight ? 'Correct' : 'Not quite'}</p>
                {!isRight && <p>Correct answer: <span className="font-semibold text-navy-950">{q.answer}</span></p>}
                {q.explanation && <p className="mt-2">{q.explanation}</p>}
              </div>
            </div>
            <div className="flex justify-end">
              <button onClick={next} className="btn-primary">
                {index + 1 < pool.length ? 'Next question' : 'See results'} <Icon name="arrow" className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
