# testimonials-generator

TypeScript CLI that generates WCAG-analysed testimonial logo strips and social media banners from a directory of SVG logos.

---

## What is it

Two generators in one tool:

**Logo strip generator** (`npm run generate`)
Loads SVG logos, runs a full analysis pipeline, and renders HTML testimonial strips ("As seen on") in every combination of size, theme, and layout. Also writes legibility, aesthetic, and accessibility reports.

**Banner generator** (`npm run banner`)
Generates platform-specific SVG social media banners (Twitter/X, LinkedIn, YouTube) in basic and advanced variants with brand assets and a client logo strip.

### Analysis pipeline

- **Legibility** — extracts dominant colors from each SVG and calculates WCAG 2.0 contrast ratios against white, light gray, dark gray, and black backgrounds; grades each logo AA / AAA / AA-Large / Fail
- **Aesthetic** — scores visual harmony (0–100) based on aspect ratio variance, logo count, and size consistency; flags extreme aspect ratios and suggests layouts
- **Accessibility** — audits alt text, minimum size compliance (WCAG 2.5.5), and overall contrast pass rate; produces a final WCAG grade

---

## Install

Requires **Node.js 20.0.0 or higher**.

```bash
npm install
```

---

## Run

### Generate logo strips and analysis reports

```bash
npm run generate
```

With custom paths:

```bash
npm run generate -- \
  --logos-dir ../assets/logos \
  --output-dir output \
  --sizes xs,sm,md,lg,xl \
  --themes light,dark,transparent \
  --layouts inline,grid,compact
```

### Generate social media banners

```bash
npm run banner
```

With custom paths:

```bash
npm run banner -- \
  --assets-dir ../assets \
  --logos-dir ../assets/logos \
  --output-dir output \
  --platforms twitter,linkedin,youtube \
  --variants basic,advanced \
  --themes dark,light
```

---

## Interpreting results

### Logo strips

Output path: `output/testimonials/{size}/{theme}/{layout}.html`

| Dimension | Values |
|-----------|--------|
| Size | `xs` (20 px), `sm` (30 px), `md` (45 px), `lg` (60 px), `xl` (80 px) |
| Theme | `light` (white bg), `dark` (dark bg), `transparent` (checkered preview) |
| Layout | `inline` (flex row), `grid` (CSS grid), `compact` (tight flex wrap) |

### Analysis reports

| File | Contents |
|------|----------|
| `output/reports/report.md` | Per-logo WCAG contrast ratios on all four backgrounds, per-size minimum height compliance, grade, and recommendations |
| `output/reports/report.json` | Machine-readable report: `meta`, `legibility`, `aesthetic`, `accessibility`, `overallGrade` |
| `output/reports/summary.md` | Executive summary — pass/fail counts and key issues |
| `output/reports/snippets/` | Markdown snippets ready to embed in other READMEs |

**WCAG grades explained:**

| Grade | Meaning |
|-------|---------|
| `AAA` | Contrast ≥ 7:1 on at least one background — enhanced compliance |
| `AA` | Contrast ≥ 4.5:1 — standard text compliance |
| `AA-Large` | Contrast ≥ 3:1 — large text / UI component compliance only |
| `Fail` | Contrast < 3:1 on all tested backgrounds |

### Social media banners

Output path: `output/banners/{platform}/{variant}/{theme}.svg`

| Platform | Dimensions | Safe zone inset |
|----------|-----------|-----------------|
| Twitter/X | 1500 × 500 | 60 px |
| LinkedIn | 1584 × 396 | 40 px |
| YouTube | 2560 × 1440 | 420 px (center 1546 × 423) |

| Variant | Description |
|---------|-------------|
| `basic` | Centered "yuryv.info" text with a colored border |
| `advanced` | Wordmark at top + client logo strip at bottom, within safe zone |

Themes: `dark` (black bg, yellow border), `light` (white bg, yellow border), `yellow` (bright bg, black border).

---

## Compile / test / lint

```bash
npm run build          # Compile TypeScript → dist/
npm run typecheck      # Type-check without emitting

npm test               # Run Jest unit tests
npm run test:coverage  # Coverage report → coverage/

npm run lint           # Check for ESLint violations
npm run lint:fix       # Auto-fix linting issues

npm run clean          # Remove dist/, output/, coverage/
```

---

## License

MIT
