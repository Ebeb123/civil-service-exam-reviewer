// Hints that point toward the answer without giving it: a strategy tip for the topic,
// plus a few wrong choices ruled out. Always leaves at least two choices standing.
// A hand-written `hint` in questions.json takes priority.

const TIPS = {
  'Word Problems and Operations': 'Write the numbers down and work it step by step. Estimate first so you can spot answers that are way off.',
  'Data Sufficiency': "Don't solve it fully. Test statement (1) alone, then (2) alone, and only combine them if neither works alone.",
  Alphabetizing: 'Compare letter by letter, and when the first words match, move on to the next word.',
  Synonyms: (q) => `Look for the choice that means the same as “${q.highlight ?? 'the key word'}”. Use the rest of the sentence as a clue.`,
  Antonyms: (q) => `Look for the choice that means the opposite of “${q.highlight ?? 'the key word'}”. Choices that mean the same thing are traps.`,
  'Single-Word Analogy': 'Name how the first pair is related (part of, used for, kind of…), then find the word that makes the second pair work the same way.',
  'Double-Word Analogy': 'Say the relationship as a sentence, like “A is a kind of B”, and check which choice fits that sentence.',
  'Paragraph Development': 'Find the sentence that introduces the topic. Linking words like “however” or “also” never come first.',
  'Correct Usage': 'Read the sentence with each choice in the blank, and check subject-verb agreement and fixed expressions.',
  'Reading Comprehension': 'Go back to the passage and pick the choice the text actually supports, not the one that just sounds true.',
  Kasingkahulugan: (q) => `Hanapin ang salitang kapareho ng kahulugan ng “${q.highlight ?? 'salitang may diin'}”. Gamitin ang buong pangungusap bilang palatandaan.`,
  Kasalungat: (q) => `Hanapin ang salitang kabaligtaran ng kahulugan ng “${q.highlight ?? 'salitang may diin'}”.`,
  'Mga Kawikaan': (q) => `Huwag basahin nang literal ang “${q.highlight ?? 'idyoma'}”. Isipin kung ano ang ibig sabihin nito sa sitwasyon.`,
  'Wastong Gamit': 'Basahin ang pangungusap kasama ang bawat pagpipilian. Dapat umangkop ang pang-ugnay o pang-ukol sa bilang at diwa ng pangungusap.',
  'Pag-unawa sa Binasa': 'Balikan ang teksto. Ang tamang sagot ay may suporta sa binasa mismo.',
  Pagtatalata: 'Hanapin ang pangungusap na nagpapakilala ng paksa, saka sundan ang lohikal na daloy.',
  'Philippine Constitution': 'Think about which branch, office or right the question is about, and drop choices that belong to a different one.',
  'Inductive Reasoning': 'Check the differences between terms (+, −, ×) and whether two patterns alternate.',
}

const LETTERS = 'abcde'

// Small deterministic shuffle so a question always shows the same hint.
function seeded(list, seed) {
  const a = [...list]
  let s = seed
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function getHint(q) {
  if (q.hint) return { tip: q.hint, ruledOut: [] }
  const tip = typeof TIPS[q.category] === 'function' ? TIPS[q.category](q) : TIPS[q.category] ?? 'Rule out the choices you know are wrong first.'
  const wrong = q.options.map((o, i) => i).filter((i) => q.options[i] !== q.answer)
  const keep = 2 // the answer plus at least one wrong choice stay
  const ruledOut = seeded(wrong, q.id)
    .slice(0, Math.max(0, q.options.length - keep - (q.options.length > 4 ? 1 : 0)))
    .sort()
    .map((i) => LETTERS[i].toUpperCase())
  return { tip, ruledOut }
}
