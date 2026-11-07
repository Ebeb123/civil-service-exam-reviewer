import questions from './questions.json'

// Exam subjects and the reviewer categories under each (same grouping as the PDF's table of contents).
export const SUBJECTS = [
  { name: 'Mathematics', icon: 'calculator', items: ['Word Problems and Operations', 'Data Sufficiency'] },
  {
    name: 'English',
    icon: 'language',
    items: ['Alphabetizing', 'Synonyms', 'Antonyms', 'Single-Word Analogy', 'Double-Word Analogy', 'Paragraph Development', 'Correct Usage', 'Reading Comprehension'],
  },
  {
    name: 'Filipino',
    icon: 'chat',
    items: ['Kasingkahulugan', 'Kasalungat', 'Mga Kawikaan', 'Wastong Gamit', 'Pag-unawa sa Binasa', 'Pagtatalata'],
  },
  { name: 'Constitution', icon: 'landmark', items: ['Philippine Constitution'] },
  { name: 'Reasoning', icon: 'puzzle', items: ['Inductive Reasoning'] },
]

export const countByCategory = questions.reduce((m, q) => ({ ...m, [q.category]: (m[q.category] ?? 0) + 1 }), {})

export const subjectOf = (category) => SUBJECTS.find((s) => s.items.includes(category))
