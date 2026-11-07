import { load, save } from './store.js'

// Per-topic answer counts: { [category]: { correct, wrong } }
const KEY = 'cse-progress'

export const getProgress = () => load(KEY, {})

// results: [{ category, correct: boolean }]
export function recordAnswers(results) {
  const progress = getProgress()
  for (const { category, correct } of results) {
    const p = (progress[category] ??= { correct: 0, wrong: 0 })
    p[correct ? 'correct' : 'wrong']++
  }
  save(KEY, progress)
}

export const resetProgress = () => save(KEY, undefined)
