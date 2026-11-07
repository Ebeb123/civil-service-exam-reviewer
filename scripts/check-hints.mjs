// Self-check: every generated hint must leave the correct answer (and at least one other choice) standing.
// Run: node scripts/check-hints.mjs
import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import { getHint } from '../src/lib/hints.js'

const questions = JSON.parse(readFileSync(new URL('../src/data/questions.json', import.meta.url), 'utf8'))
for (const q of questions) {
  const { tip, ruledOut } = getHint(q)
  const kept = q.options.filter((_, i) => !ruledOut.includes('ABCDE'[i]))
  assert.ok(tip, `#${q.id} has no tip`)
  assert.ok(kept.includes(q.answer), `#${q.id} rules out the answer`)
  assert.ok(kept.length >= 2, `#${q.id} leaves only the answer`)
  // Whole-word match; tiny function words like "ng" or "sa" in a generic tip don't give anything away.
  const named = q.answer.length > 3 && new RegExp(`(^|[^\\p{L}])${q.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^\\p{L}]|$)`, 'iu').test(tip)
  assert.ok(!named || q.question.includes(q.answer), `#${q.id} tip names the answer`)
  assert.deepEqual(getHint(q), { tip, ruledOut }, `#${q.id} hint is not stable`)
}
console.log(`hints OK for ${questions.length} questions`)
