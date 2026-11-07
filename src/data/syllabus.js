import questions from './questions.json'

// Practice Mode syllabus. Each topic pulls questions from one or more reviewer categories.
// Topics with no matching questions yet are still listed so the full syllabus is visible.
const from = (...cats) => (q) => cats.includes(q.category)

// "Word Problems and Operations" mixes both: ids 1–30 are computation items, 31+ are word problems.
const BASIC_OPS_LAST_ID = 30
const isOps = (q) => q.category === 'Word Problems and Operations'

const VERBAL = {
  name: 'Verbal',
  icon: 'language',
  topics: [
    { name: 'Vocabulary', match: from('Synonyms', 'Antonyms', 'Kasingkahulugan', 'Kasalungat') },
    { name: 'Grammar', match: from('Correct Usage', 'Wastong Gamit') },
    { name: 'Paragraph Org', match: from('Paragraph Development', 'Pagtatalata') },
    { name: 'Reading Comprehension', match: from('Reading Comprehension', 'Pag-unawa sa Binasa') },
    { name: 'Idioms', match: from('Mga Kawikaan') },
  ],
}

const NUMERICAL = {
  name: 'Numerical',
  icon: 'calculator',
  topics: [
    { name: 'Basic Ops', match: (q) => isOps(q) && q.id <= BASIC_OPS_LAST_ID },
    { name: 'Word Problems', match: (q) => (isOps(q) && q.id > BASIC_OPS_LAST_ID) },
    { name: 'Sequences', match: from('Inductive Reasoning') },
  ],
}

const ANALYTICAL = {
  name: 'Analytical',
  icon: 'puzzle',
  topics: [
    { name: 'Analogy', match: from('Single-Word Analogy', 'Double-Word Analogy') },
    { name: 'Logic', match: from('Data Sufficiency') },
    { name: 'Abstract', match: from() },
  ],
}

const CLERICAL = {
  name: 'Clerical',
  icon: 'list',
  topics: [
    { name: 'Alphabetizing', match: from('Alphabetizing') },
    { name: 'Spelling', match: from() },
  ],
}

const GEN_INFO = {
  name: 'Gen Info',
  icon: 'landmark',
  topics: [
    { name: 'PH Constitution', match: from('Philippine Constitution') },
    { name: 'R.A. 6713', match: from() },
    { name: 'Human Rights', match: from() },
    { name: 'Environment', match: from() },
  ],
}

const withQuestions = (section) => ({
  ...section,
  topics: section.topics.map((t) => ({ name: t.name, questions: questions.filter(t.match) })),
})

export const TRACKS = {
  professional: {
    name: 'Professional',
    sections: [VERBAL, NUMERICAL, ANALYTICAL, GEN_INFO].map(withQuestions),
  },
  subprofessional: {
    name: 'Sub-Professional',
    sections: [VERBAL, NUMERICAL, CLERICAL, GEN_INFO].map(withQuestions),
  },
}

export const trackCount = (track) => new Set(track.sections.flatMap((s) => s.topics.flatMap((t) => t.questions.map((q) => q.id)))).size

// Every unique question in a track, for mixed "Practice Now" sessions.
export const trackPool = (track) => [...new Map(track.sections.flatMap((s) => s.topics.flatMap((t) => t.questions)).map((q) => [q.id, q])).values()]

export const MIXED_COUNTS = [40, 85, 125, 170]

// Exam areas (Verbal, Numerical, …) and the reviewer categories each one covers.
export const AREAS = [VERBAL, NUMERICAL, ANALYTICAL, CLERICAL, GEN_INFO].map((s) => {
  const { topics } = withQuestions(s)
  return { name: s.name, icon: s.icon, categories: new Set(topics.flatMap((t) => t.questions.map((q) => q.category))) }
})

export const areaOf = (category) => AREAS.find((a) => a.categories.has(category))

// progress: { [category]: { correct, wrong } } -> [{ name, icon, correct, total, pct }] per area.
export const areaScores = (progress) =>
  AREAS.map((a) => {
    let correct = 0
    let total = 0
    for (const c of a.categories) {
      const p = progress[c]
      if (p) {
        correct += p.correct
        total += p.correct + p.wrong
      }
    }
    return { name: a.name, icon: a.icon, correct, total, pct: total ? Math.round((correct / total) * 100) : null }
  })
