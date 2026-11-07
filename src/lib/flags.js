import { useState } from 'react'
import { load, save } from './store.js'

// Question ids the user flagged for review (guesses, tricky items), kept across sessions.
const KEY = 'cse-flags'

// Pseudo-category name used to practice the flagged set.
export const FLAGGED = 'Flagged for review'

export function useFlags() {
  const [flags, setFlags] = useState(() => new Set(load(KEY, [])))
  const toggle = (id) => {
    const next = new Set(flags)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    save(KEY, [...next])
    setFlags(next)
  }
  return [flags, toggle]
}
