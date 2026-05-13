# CFA Interactive Notebook SOP

Use this structure whenever adding a new CFA chapter.

## Chapter Content Standard

Each chapter should include:

- Module and Level placement
- Plain-language explanation
- Three practical deep-dive points
- Life analogy
- Finance usage
- Two or more formulas or indicators
- One real-world causal chain
- Memory line
- Common misconception
- Two or more scenario quizzes
- Mind-map nodes
- Relationship chains
- Cross-topic links

## Data Location

Add new chapters to:

`cfa-notebook/data/chapters.js`

Keep chapter IDs stable and lowercase, for example:

`bond-duration`

## Local Preview

From the repository root:

```bash
python3 -m http.server 4173
```

Open:

`http://localhost:4173/cfa-notebook/`

## GitHub Pages

Publish from the repository root on the `main` branch. The notebook path will be:

`https://<username>.github.io/<repo-name>/cfa-notebook/`
