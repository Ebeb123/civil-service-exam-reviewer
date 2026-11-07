"""Extract multiple-choice questions from reviewer.pdf into src/data/questions.json.

Run:  uv run --no-project --with pdfplumber python scripts/extract_questions.py
The correct answer is detected by its red text colour in the PDF.
"""
import json
import re
import sys
from pathlib import Path

import pdfplumber

ROOT = Path(__file__).resolve().parent.parent
PDF = ROOT / "reviewer.pdf"
OUT = ROOT / "src" / "data" / "questions.json"

# Section header line -> category name
SECTIONS = {
    "Word Problems and Operations": "Word Problems and Operations",
    "Data Sufficiency": "Data Sufficiency",
    "Clerical Operations (Alphabetizing)": "Alphabetizing",
    "Synonyms": "Synonyms",
    "Antonyms": "Antonyms",
    "Single-Word Analogy": "Single-Word Analogy",
    "Double-Word Analogy": "Double-Word Analogy",
    "Identifying Errors": "Identifying Errors",
    "Paragraph Development": "Paragraph Development",
    "Correct Usage": "Correct Usage",
    "Reading Comprehension": "Reading Comprehension",
    "Kasingkahulugan": "Kasingkahulugan",
    "Kasalungat": "Kasalungat",
    "Kawikaan": "Mga Kawikaan",
    "Wastong Gamit": "Wastong Gamit",
    "Pagkilala sa Mali": "Pagkilala sa Mali",
    "Pag-unawa sa Binasa": "Pag-unawa sa Binasa",
    "Pagtatalata": "Pagtatalata",
    "Constitution": "Philippine Constitution",
    "Inductive Reasoning": "Inductive Reasoning",
    "Abstract Reasoning": "Abstract Reasoning",
}
# shortcut: these rely on underlines / images the text layer can't carry; parse them from the PDF graphics if needed.
SKIP = {"Identifying Errors", "Pagkilala sa Mali", "Abstract Reasoning"}

# Categories whose directions say "the italicized word"; that word is kept as `highlight`.
HIGHLIGHT = {"Synonyms", "Antonyms", "Kasingkahulugan", "Kasalungat", "Mga Kawikaan"}

QUESTION = re.compile(r"^(\d{1,3})\.\s+(.*)")  # 1-3 digits so a wrapped year like "1999." isn't a question
OPTION = re.compile(r"^([a-e])\.\s+(.*)")
ANSWER = re.compile(r"^Answer:\s*([a-e])\.")
HEADER = re.compile(r"^Pag\s?e\s*\|\s*\d+")
DIRECTIONS = re.compile(r"^(Directions|Panuto):")
PASSAGE_LABEL = re.compile(r"^(?:[IVX]+\.|[A-Z]\.|Example:)(\s|$)")


def fix_symbols(s):
    # Symbol-font glyphs come out in the U+F020-F07E private range; shift back to ASCII.
    return "".join(chr(ord(c) - 0xF000) if 0xF020 <= ord(c) <= 0xF07E else c for c in s)


def is_red(line):
    chars = [c for c in line["chars"] if c["text"].strip()]
    red = [c for c in chars if tuple(c.get("non_stroking_color") or ()) == (1.0, 0.0, 0.0)]
    return bool(chars) and len(red) * 2 > len(chars)


def italic_runs(line):
    """Italic words on a line; the PDF has no space chars, so spaces come from x gaps."""
    runs, cur, prev = [], "", None
    for c in line["chars"]:
        if "Oblique" in c["fontname"] or "Italic" in c["fontname"]:
            if cur and c["x0"] - prev["x1"] > 0.15 * c["size"]:
                cur += " "
            cur += c["text"]
            prev = c
        elif c["text"].strip() and cur:
            runs.append(cur.strip())
            cur = ""
    if cur.strip():
        runs.append(cur.strip())
    return runs


def lines(pdf):
    for page in pdf.pages:
        for ln in page.extract_text_lines(return_chars=True):
            text = fix_symbols(ln["text"]).strip()
            if text and not HEADER.match(text):
                yield text, ln["x0"], is_red(ln), italic_runs(ln)


def parse(pdf):
    questions, category = [], None
    q = None              # question being built
    opt_x = None          # x0 of the last option line (continuations are indented further)
    buffer = []           # loose text after a question's options: passage or lead-in
    passage = ""
    in_directions = False
    ds_options = []       # Data Sufficiency shares one option list from its directions

    def flush():
        nonlocal q
        if q and category not in SKIP:
            questions.append(q)
        q = None

    for text, x0, red, italics in lines(pdf):
        if text in SECTIONS:
            flush()
            category, buffer, passage, ds_options, opt_x = SECTIONS[text], [], "", [], None
            continue
        if category is None:
            continue  # cover and table of contents

        if DIRECTIONS.match(text):
            in_directions = True
            continue

        m_q, m_o, m_a = QUESTION.match(text), OPTION.match(text), ANSWER.match(text)

        if in_directions:
            if m_o and category == "Data Sufficiency":
                ds_options.append(m_o.group(2))
                opt_x = x0
                continue
            if ds_options and x0 > opt_x:
                ds_options[-1] += " " + text
                continue
            if not (m_q or m_o or PASSAGE_LABEL.match(text)):
                continue  # still directions text
            in_directions = False

        if m_q:
            flush()
            lead = ""
            if buffer:
                joined = " ".join(buffer)
                if PASSAGE_LABEL.match(joined):
                    passage = joined
                else:
                    lead = joined + " "
                buffer = []
            q = {"category": category, "number": int(m_q.group(1)),
                 "question": lead + m_q.group(2), "options": [], "answer": None,
                 "explanation": "", "passage": passage, "italics": list(italics)}
            if category == "Data Sufficiency":
                q["options"] = list(ds_options)
            opt_x = None
        elif q and m_a:
            q["answer"] = q["options"]["abcde".index(m_a.group(1))]
            q["_ds_answer"] = True
        elif q and q.get("_ds_answer"):
            pass  # wrapped tail of the "Answer:" line
        elif q and m_o and category != "Data Sufficiency":
            q["options"].append(m_o.group(2))
            if red:
                q["answer"] = len(q["options"]) - 1
            opt_x = x0
        elif q and opt_x is not None and x0 > opt_x and not buffer:
            q["options"][-1] += " " + text  # wrapped option
        elif q and (not q["options"] or category == "Data Sufficiency"):
            q["question"] += " " + text      # wrapped question / statements
            q["italics"] += italics
        else:
            buffer.append(text)              # passage or lead-in for the next question
    flush()
    return questions


def finalize(raw):
    out, problems = [], []
    for q in raw:
        where = f'{q["category"]} #{q["number"]}'
        ans = q["answer"]
        if isinstance(ans, int):
            ans = q["options"][ans]
        passage = q.pop("passage")
        # A passage that is only a label ("G.") was an image/chart, so the question can't be answered from text.
        if passage and (not PASSAGE_LABEL.sub("", passage).strip() or re.search(r"tsart|grap", passage, re.I)):
            problems.append(f"{where}: passage is an image, skipped")
            continue
        if ans is None:
            problems.append(f"{where}: no red answer found, skipped")
            continue
        if len(q["options"]) < 2:
            problems.append(f"{where}: only {len(q['options'])} options, skipped")
            continue
        if len(set(q["options"])) != len(q["options"]):
            problems.append(f"{where}: duplicate options in source PDF (kept)")
        item = {"id": len(out) + 1, "category": q["category"], "question": q["question"],
                "options": q["options"], "answer": ans, "explanation": q["explanation"]}
        if passage:
            item["passage"] = passage
        if q["category"] in HIGHLIGHT and q["italics"]:
            item["highlight"] = " ".join(q["italics"])  # the italicized word the question asks about
        elif q["category"] in HIGHLIGHT:
            problems.append(f"{where}: no italic target word found")
        out.append(item)
    return out, problems


def check(questions):
    assert questions, "no questions extracted"
    ids = [q["id"] for q in questions]
    assert ids == list(range(1, len(ids) + 1)), "ids not sequential"
    for q in questions:
        assert q["question"].strip(), q
        assert q["answer"] in q["options"], q


def main():
    with pdfplumber.open(PDF) as pdf:
        raw = parse(pdf)
    questions, problems = finalize(raw)
    check(questions)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8")

    counts = {}
    for q in questions:
        counts[q["category"]] = counts.get(q["category"], 0) + 1
    for c, n in counts.items():
        print(f"{n:4}  {c}")
    print(f"{len(questions)} questions -> {OUT}")
    for p in problems:
        print("WARN", p, file=sys.stderr)


if __name__ == "__main__":
    main()
