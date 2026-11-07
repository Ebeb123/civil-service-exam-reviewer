# CSE Reviewer

A practice app for the Philippine Civil Service Exam (Professional and Sub-Professional levels), with 587 questions across 18 topics.

- **Practice by topic**: you see the answer right after each question, and every question has a hint.
- **Mock exam**: random questions under a strict countdown. Professional is 170 items in 3h10m, Sub-Professional is 165 items in 2h40m, and a quick drill is 50 items. The clock survives a page refresh, and the exam submits itself when time runs out.
- **Flag for review**: mark guesses and come back to them later.
- **Progress tracking**: scores are saved per topic in the browser, and topics below 75% are flagged.
- **Dark mode**.

Practice questions are from the [CSE Reviewer ebook by Teach Pinas](https://www.teachpinas.com/download/cse-reviewer-ebook-professional-and-sub-professional/). All rights to the questions belong to Teach Pinas.

Independent, free review tool. Not affiliated with or endorsed by the Civil Service Commission.

## Develop

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # outputs dist/
```

## Deploy (Vercel)

Import the repo in Vercel. `vercel.json` already sets the Vite framework, `npm run build` and the `dist` output, so no extra settings are needed. Routing uses hash URLs (`/#/practice`), so no rewrite rules are required.

## Question bank

The app reads `src/data/questions.json`, which was generated from the reviewer PDF:

```bash
uv run --no-project --with pdfplumber python scripts/extract_questions.py   # needs reviewer.pdf in the project root
node scripts/check-hints.mjs                                                # checks no hint ever rules out the right answer
```

Each question has `id`, `category`, `question`, `options`, `answer` and `explanation`. Some also have `passage` (reading sections), `highlight` (the italicized word in Synonyms and Antonyms) and an optional hand-written `hint`.
