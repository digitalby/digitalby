# Banner Generator

Generates social media heading banners as SVG files.

## Generate

```bash
npm run banner
```

Outputs 16 SVGs to `output/banners/` — 4 platforms × 2 variants × 2 themes.

### Options

```bash
npm run banner -- --platforms twitter,linkedin,youtube,upwork
npm run banner -- --variants basic,advanced
npm run banner -- --themes dark,light,yellow
```

| Flag | Values | Default |
|---|---|---|
| `--platforms` | `twitter`, `linkedin`, `youtube`, `upwork` | all four |
| `--variants` | `basic`, `advanced` | both |
| `--themes` | `dark`, `light`, `yellow` | `dark,light` |

### Output structure

```
output/banners/
  {platform}/{variant}/{theme}.svg
```

### Platform dimensions

| Platform | Width | Height |
|---|---|---|
| Twitter/X | 1500 | 500 |
| LinkedIn | 1584 | 396 |
| YouTube | 2560 | 1440 |
| Upwork | 3200 | 320 |

### Adding a platform

1. Add a string literal to the `Platform` union in `src/banner/types.ts`
2. Add a corresponding entry to `PLATFORM_CONFIGS` in `src/banner/config.ts`

---

## Convert SVG to PNG

SVGs cannot be uploaded directly to most social platforms. Convert with one of the following.

### Inkscape (recommended)

```bash
brew install inkscape
inkscape output/banners/twitter/basic/dark.svg \
  --export-type=png \
  --export-filename=twitter-basic-dark.png \
  --export-width=1500
```

### rsvg-convert

```bash
brew install librsvg
rsvg-convert -w 1500 output/banners/twitter/basic/dark.svg \
  -o twitter-basic-dark.png
```

### Browser

Open any `.svg` file in Chrome or Safari, then use the browser's built-in screenshot or print-to-PDF tool. For pixel-accurate export at the correct dimensions, use the DevTools device emulator set to the exact canvas width.

### Batch convert all outputs (Inkscape)

```bash
find output/banners -name '*.svg' | while read f; do
  out="${f%.svg}.png"
  inkscape "$f" --export-type=png --export-filename="$out"
done
```
