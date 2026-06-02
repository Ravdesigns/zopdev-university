# ZopDev Design System

The canonical visual language for ZopDev (ZopNight, ZopDay, ZopCloud) — extracted from the homepage at `/Users/zopdev/zopdev-site/index.html` and the shared chrome at `homepage-chrome.css`. Use this when building product surfaces, internal tools, marketing pages, or anything that wears the ZopDev wordmark.

---

## 1. Register

Every screen is **brand** (marketing, content, identity-driven) or **product** (app UI, dashboards, settings). The design system serves both — but tonal weight differs:

- **Brand** uses bigger type, more white space, tighter copy, more accent color, more motion.
- **Product** uses denser type, tighter spacing, almost no accent color, minimal motion, monochromatic where possible.

Default to **product register** for app UI. The marketing site (the homepage) is **brand register**.

---

## 2. Voice

- Direct, confident, no marketing fluff.
- Short sentences. Periods preferred over em-dashes (em-dashes are banned in copy — they read as AI-generated).
- Mono labels for meta information, sentence case for headings.
- Specific numbers: "$31,000–$54,000" not "thousands of dollars."
- Never use "amazing", "powerful", "transform", "leverage", "revolutionize", "best-in-class", "industry-leading."

---

## 3. Colors

### Brand colors (locked, never change)

| Token | Hex | OKLCH | Usage |
|---|---|---|---|
| `--zop-blue` | `#2A4494` | — | ZopNight identity. Cloud / infra surfaces. ~5% of any screen. |
| `--zop-orange` | `#F58549` | — | ZopDay identity + signature accent. CTAs, dots, alerts. ~10% of any screen, max. |
| `--zop-green` | `#7FB236` | — | ZopCloud identity. Success states, financial outcomes. Use on dark surfaces only — `#7FB236` fails AA on white text. Use `#3f6320` darker variant when text is white. |

### Neutrals (cream-tinted, never pure black/white)

| Token | Light hex | Dark hex |
|---|---|---|
| `--paper` | `#FAF7EC` | `#0F0F12` |
| `--ink` | `#0A0A0A` | `#F0EBDB` |
| `--g-50` | `#F0EBDB` | `#18181c` |
| `--g-100` | `#ECE7D7` | `#1e1e22` |
| `--g-200` | `#E2DDCD` | `#2e2e33` |
| `--g-300` | `#C9C4B5` | `#4a4a4e` |
| `--g-400` | `#A3A3A3` | `#8A8378` |
| `--g-500` | `#707070` | `#9C9588` |
| `--g-600` | `#525252` | `#B8B0A0` |
| `--g-700` | `#2a2a2a` | `#D4CDB5` |
| `--g-900` | `#111111` | `#F5F2E8` |
| `--line` | `#D9D3BF` | `#3a3a42` |

**Rule**: never use `#000` or `#fff`. Tint every neutral toward cream. WCAG AA minimum: 4.5:1 for body, 3:1 for large text.

### Color strategy

- **Restrained** (default): tinted neutrals + one accent ≤10%. Product UIs.
- **Committed**: one saturated color carries 30–60% of surface. Brand pages with strong identity.
- **Drenched**: surface IS the color. Hero sections, campaign moments. (Used sparingly.)

The homepage uses **Restrained**. The PCB integrations section uses **Committed** (orange traces dominant).

---

## 4. Typography

### Fonts

- **Display / headings**: `Space Grotesk` (300, 400, 500, 600, 700) — token `--font`
- **Body prose + small UI labels**: `Inter` — token `--font-body`. Used on `<body>`, `.lead`, `*-sub`, paragraph copy, button labels, form text.
- **Labels + code + data**: `JetBrains Mono` (400, 500, 600) — token `--mono`
- **Never use**: Inter on any heading or display surface (hard-locked, see below). `system-ui` as primary heading. Helvetica.

### Heading font hard-lock (`homepage-chrome.css`)

Every heading-shaped element on the site is forced onto Space Grotesk via a single `!important` rule in `homepage-chrome.css`. This is a brand contract — it overrides any class-level override and makes the rule unambiguous:

```css
h1, h2, h3, h4, h5, h6,
.hero h1, .hero-headline, .end-arc-headline, .bridge-headline,
.hr-word, .hr-rest, .hr-conn,
.np-cell-title, .np-hero-title, .pui-detail-title,
.eclipse-word,
.zd-stat-num, .pym-step-title,
.cs-headline, .cs-ba-title, .eb-title,
.ds-h2, .ds-section-title,
.sec-heading, .value-title,
.cb-big-heading, .cb-small-heading,
.pg-h2,
.zn-callout-headline, .zd-callout-headline,
.zn-final h2, .zd-final h2, .zc-final h2,
.zn-hero h1, .zd-hero h1, .zc-hero h1,
[class*="-headline"], [class*="-heading"]{
  font-family: var(--font) !important;
  letter-spacing: -0.02em;
}
```

The `[class*="-headline"]` and `[class*="-heading"]` catch-alls mean any new component that follows the naming convention auto-inherits Space Grotesk. To add a new heading-shaped class with an irregular name, add it to the selector list — never override font-family on the element itself.

### Scale

| Step | Size | Use |
|---|---|---|
| Hero h1 | `clamp(48px, 6.4vw, 86px)` | Hero only, max one per page |
| Section h2 | `clamp(28px, 3.2vw, 44px)` | Section headers |
| Card h3 | 17–22px | Card titles, feature names |
| Body | 14–15px | Default body text |
| Mono label | 10–11px, `letter-spacing: 0.08–0.14em`, `text-transform: uppercase` | Eyebrows, chips, meta labels |
| Caption | 13px | Secondary copy |

### Rules

- Body never below 12px.
- Wide letter-spacing (≥0.05em) only on uppercase mono labels, never on prose.
- Line-height: 1.0–1.2 for headings, 1.5–1.6 for body.
- Headings use negative letter-spacing (-0.02 to -0.045em).
- Multi-sentence headings break each sentence to a new line: `<h2>See everything.<br/>Find what's wrong.</h2>`.

---

## 5. Layout

### Grid

- `--max: 1200px` — content max width
- `--gutter: 32px` — horizontal page padding (24px on mobile)
- Sections wrapped in `<div class="container">` for centered content.

### Section rhythm

```html
<section class="section">
  <div class="container">
    <div class="sec-head">
      <div class="sec-meta">§ · section name</div>
      <div>
        <h2>Heading.</h2>
        <p class="sub">Description on the right.</p>
      </div>
    </div>
    <!-- section body -->
  </div>
</section>
```

- `.sec-meta` has the orange `10×10px` square pseudo-element before the text.
- Heading and sub are in a flex row: heading left, sub right-aligned.
- Border-bottom on the head separates from body.

### Spacing scale

Use multiples of 4px. Common values: 4, 8, 12, 16, 20, 24, 32, 48, 64. Vary spacing for rhythm — same padding everywhere is monotony.

---

## 6. Motion

### Easing tokens

- `--ease-out: cubic-bezier(.22, 1, .36, 1)` — default, exponential ease-out
- `--ease-in-out: cubic-bezier(.65, 0, .35, 1)` — bidirectional
- `--ease-snap: cubic-bezier(.19, 1, .22, 1)` — fast initial pop

### Durations

- `--dur-fast: 160ms` — hover states, focus
- `--dur-med: 250ms` — card lift, button press, panel toggle
- `--dur-slow: 400ms` — section reveal, layout shift

### Rules

- **Never** animate layout properties (`width`, `height`, `padding`, `margin`). Use `transform` + `opacity`. For accordion-style height, use `grid-template-rows: 0fr → 1fr`.
- **Never** use bounce or elastic easing.
- All transitions respect `prefers-reduced-motion`.
- Page transitions use the View Transitions API with a 360ms cross-fade.

---

## 7. Components

All components use `homepage-chrome.css`. Below are the primary patterns.

### 7.1 Buttons

Three tiers, one geometry. Square corners (`border-radius: 0`).

| Class | Style | Use |
|---|---|---|
| `.btn .btn-primary` | Ink fill, paper text | Primary CTA |
| `.btn .btn-secondary` | Outline, ink text | Secondary CTA |
| `.btn .btn-accent` | Orange fill, ink text | Brand-led CTA, signature actions |
| `.btn-ghost` | Underlined inline link | Tertiary links inline with text |

**Hover signature** (universal): `transform: translateY(-4px)` + `box-shadow: 0 8px 0 -4px var(--ink)`. Plus orange offset stripe on the left edge for `.feature` and `.cb-*` cards.

```html
<a class="btn btn-primary" href="/start">Start free <span class="arrow">→</span></a>
```

### 7.2 Section meta eyebrow

The signature ZopDev visual element. Mono uppercase, with an orange 10×10 square preceding it.

```html
<div class="sec-meta">§04 · section title</div>
```

```css
.sec-meta::before { content:''; width:10px; height:10px; background:var(--zop-orange); }
```

Never replace the orange square with a circle, dot, or icon. Single consistent accent.

### 7.3 Cards

There are **two sanctioned card patterns** — pick by layout context:

#### A. Feature card · standalone with card-lift (`.feature`, `.cert-card`, `.case-card`, `.outcome-tile`, `.role-card`, `.zd-card`, etc.)
- 1px `--line` border
- Sit in a grid with non-zero `gap` (cards are visually separated)
- Card-lift hover (canonical signature, single source in `homepage-chrome.css`):
  - `transform: translateY(-4px)`
  - `box-shadow: 0 8px 0 -4px var(--ink)` (ink hard-offset block — same hover ink shadow on all card classes)
  - `border-color: var(--line-b)`
  - `::after` orange 4px stripe `width:4px; height:100%; transform: scaleY(0)` → `transform: scaleY(1)` on hover (origin: top — stripe appears to grow downward)
- The `::after` stripe is implemented as a `transform`-based scale animation, **never** as a `height: 0 → 100%` animation (DESIGN.md §6 bans layout-property animation).
- Page-level CSS should NOT redefine the hover. Add the class to the shared `:is(...)` rule list in `homepage-chrome.css` and declare only the static state locally.
- Content: meta number + h3 + p + visual

#### B. Grid-cell card · connected with background-change (`.number-tile`, `.value-card`, `.zd-card`, `.cs-rel-card`, `.eb-rel-card`, `.channel-card`)
- **No** per-cell border. The parent grid renders the dividers via `gap:0; border:1px solid var(--line); background:var(--line)` — each cell gets `background:var(--bg-1)` and the gap reveals the parent's line colour.
- Hover: `background:var(--bg-2)` (subtle lift to a slightly warmer tile). Optionally a small `transform: translateY(-2px)` if the cell is a primary action; never the full `-4px` lift (that breaks grid cohesion).
- Use this pattern for connected stat tiles, related-content rows, value grids, and any layout where cells share edges.

#### Bento card (`.feat-expand` button + `.feat-drawer-tpl` template)
- Same visual as Feature card (Pattern A)
- Whole card is clickable, opens drawer with deeper content

### 7.4 Marquee (`.trust-marquee`)
- Continuous-scroll logo strip
- Mask-image fade on left/right edges
- Pauses on hover
- `prefers-reduced-motion`: stops + centers
- Mono font, dot prefix for each item

### 7.5 Pill / chip
- Square corners, line border, mono uppercase, 10–11px
- Optional dot prefix in brand color

### 7.6 Theme toggle
- Segmented pill with sun + moon icons
- Sliding ink-filled thumb

### 7.7 Megamenu (Product / Solutions / Resources / Developers)
- 3-column bento grid: hero card (2-row span) + 4 compact cells + bottom promo strip
- Hero has `.np-badge` (live / featured / new) in lane color
- `.np-cell` with 28×28 icon tile + title + 1-line description
- Hover brightens background; title turns orange

### 7.8 Calculator (Braun ET66 tribute)
- Ivory chassis (light) / matte dark (dark)
- LCD display window with green numerals (`#b4cc85`)
- Preset keypad (8 keys for spend) + fine-tune slider
- Signature mustard `=` action key with site-wide button hover
- Advanced mode reveals 3 sub-keypads + savings breakdown bars inside same chassis (no layout swap)

### 7.9 PCB / circuit-board diagram
- Dot-grid background
- Color-coded copper traces (blue / orange / green per integration lane)
- Animated pulses traveling along traces
- Click-to-burst central core
- Chip impact: lane-color fill flash + expanding shockwave ring

### 7.10 Dotted world map
- Canvas-rendered dots at 1.4° lat/lon density
- Fixed land-mask polygons (~100 rectangles)
- Region pins as DOM elements (HTML), color-coded with pulse
- Animated arc pulses traveling between pins
- Pin hover: 1.5× scale + label inverts colors

### 7.11 Dashboard mock UI

For "show the product" sections, use a dark always-on UI box:
- Browser chrome strip (3 traffic lights + URL + live chip)
- Body uses `#0f0f12` bg, `#F0EBDB` text
- Cards use `#1a1a1e` bg, `#2a2a30` borders
- Mono labels, monospace numerals (`font-variant-numeric: tabular-nums`)

### 7.12 Product hero 3D canvas (`product-3d.js`)

Each product page hero (`.zn-hero`, `.zd-hero`, `.zc-hero`) carries one large dotted 3D object that mirrors the homepage globe's render grammar. Same projection math, same dot rendering, drag-to-rotate + click-to-activate.

**Render contract:**
- Cream dots (`rgba(240, 235, 219, ...)`) on transparent canvas
- Front-facing alpha: `max(0.45, 0.72 + z*0.28)`; back: `0.12`
- Front radius: `0.9 + z*0.25`; back: `0.5`
- Painter's-algorithm z-sort
- Slow Y-axis auto-rotation (~`0.0028 rad/frame`), paused while dragging
- Sparse brand-color `hi: true` accent dots (≤1 per ~250)

**Per-product shape & accent:**

| Page | Shape | Accent | Click activation |
|---|---|---|---|
| ZopNight | Padlock ↔ piracy eye morph (11s cycle) | `#4A66D4` lifted blue | Ring pulse + force-flash to eye for 1.4s |
| ZopDay | Suspension bridge (towers + catenary cables + suspenders) | `#F58549` orange | Fires a 26-particle deploy packet across one cable |
| ZopCloud | Cumulus cloud (8 Fibonacci spheres, neighbour-rejection) | `#7FB236` green | Spawns a 60-particle orbiting deploy instance |

**Distribution rule:** every shape uses Fibonacci-style structured sampling, never random. Same `Φ = π(3 - √5)` golden angle the homepage globe uses, paired with stratified jitter on flat surfaces (cuboids, deck, towers).

**Bleed pattern:** the canvas is sized `clamp(720px, 78vw, 1280px)` and positioned absolutely with `right: 0; transform: translate(40%, -50%)` — anchors the right edge at hero right, then pushes 40% of canvas width past it. Result: exactly 60% visible, 40% bleeding off the right viewport edge. Hero `overflow: clip` handles the cut. Mobile (≤980px): canvas stacks below text via `flex-direction: column; order: 1/2`.

**Layering:** canvas frame at `z-index: 1`, hero text at `z-index: 5`. Drag hits the visible canvas where text doesn't sit, like the homepage globe.

**Scaffold:** `product-3d.js` (shared) takes a point generator and options. Optional `pointsB` enables shape morphing. Optional `onActivate(controller, point)` fires on tap; the controller exposes `pulse(x, y)`, `flashMorph(value, ttl)`, and `addParticle({x,y,z,vx,vy,vz,life,accent})` so each page can compose its own creative interaction.

```js
ZopProduct3D(canvas, genLockPoints, {
  pointsB:     genEyePoints,
  morphPeriod: 11000,
  accent:      '#4A66D4',
  radiusFactor: 0.58,
  speed:       0.0028,
  rotX:        -0.10,
  onActivate:  function(c, p){ c.pulse(p.x, p.y); c.flashMorph(1, 1400); }
});
```

`prefers-reduced-motion: reduce` collapses auto-rotation, morphing, pulses, and particles — the shape paints once and stays still.

---

## 8. Iconography

- Inline SVG only. No icon fonts.
- 16–20px stroke-1.5 line icons for inline use.
- Brand marks (ZopNight moon, ZopDay sun, ZopCloud pixel cloud) use the locked SVGs in `<symbol>` defs at the top of `index.html`.

---

## 9. Brand marks

```html
<svg viewBox="0 0 32 32"><use href="#mark-zopnight"/></svg>  <!-- blue + moon -->
<svg viewBox="0 0 32 32"><use href="#mark-zopday"/></svg>     <!-- orange + sun -->
<svg viewBox="0 0 32 32"><use href="#mark-zopcloud"/></svg>   <!-- blue + 8-bit cloud -->
<svg viewBox="0 0 32 32"><use href="#mark-zopdev"/></svg>     <!-- 4-quadrant family -->
<svg viewBox="0 0 715 276"><use href="#logo-zopdev"/></svg>   <!-- full wordmark -->
```

Defs live at the top of every page. Don't recreate the marks elsewhere.

---

## 10. Dark mode

- Toggled via `html[data-theme="dark"]` (or `light`).
- Default: dark on first visit. Preference persisted via `localStorage` (key `zop-theme`, written by `chrome-mobilenav.js` on every toggle, read on every load).
- All chrome elements respect both themes via the token system. Page-specific dark overrides are scoped to specific selectors (e.g. `html[data-theme="dark"] .nav-overlay`).
- Some surfaces are **always dark regardless of theme**: getting-started product UI, calculator LCD display, PCB dot grid, dashboard mock components, **and the per-product hero on `zopnight.html` / `zopday.html` / `zopcloud.html`** (each scopes the dark token values directly onto `.zX-hero` so the whole hero subtree resolves dark in any document theme).

### Always-dark hero scoping pattern

```css
.zn-hero{
  --bg-0:#060608; --bg-1:#0E0E12; --bg-2:#15151A; --bg-3:#1C1C24;
  --ink:#F0EBDB; --ink-2:#D4CDB5; --ink-3:#A8A195; --ink-4:#8A8378;
  --line:#2A2A34; --line-2:#3A3A46; --line-b:#55555E;
  background:var(--bg-1) !important;
  color:var(--ink) !important;
  border-bottom:1px solid var(--line) !important;
}
```

The `!important` ensures the dark scope wins against any later body-level theme rule. The `is-tinted` body class (which used to paint the hero in saturated brand color) is **not** used on these pages — the hero stays its own dark surface, and the brand color appears once on the page in the closing `.zX-final` band (see §23).

---

## 11. Anti-patterns (banned)

If you write any of these, rewrite the element with different structure:

- **Rounded corners** (`border-radius: 3px`, `4px`, `6px`, `8px`, etc.) on any panel, card, button, input, or container. Square corners only (`border-radius: 0`). The two permitted exceptions: `9999px` for status pills, `50%` for circular dot indicators ≤8px. If you find `border-radius: 6px` in a stylesheet, it's a defect — strip it.
- **Side-stripe borders** larger than 1px as a *static* colored accent on cards. The hover-revealed orange `::after` stripe (Pattern A card-lift) is a separate idiom and is permitted. For static accents use full borders, background tints, leading numbers, or nothing.
- **Gradient text** (`background-clip: text` + gradient).
- **Glassmorphism** as default. Rare, purposeful, or nothing.
- **The hero-metric template, decorative use** (big number + small label + supporting stats + gradient accent, used purely as visual filler with no causal claim). Banned. The pattern itself is not banned outright: a stats strip *is* allowed when (1) every number is a measured outcome the customer actually delivered, (2) at least one number can be traced to a named case in `customers.html`, and (3) no gradient accent is used on the digits. The homepage's "$2.4M reclaimed / 47% avg cut / 14-day median" strip qualifies under this clause. Decorative variants without causal claims still fall under the ban.
- **Identical card grids** (5+ same-sized cards with icon + heading + text). Vary sizes, asymmetric bento.
- **Modal as first thought**. Exhaust inline / progressive alternatives.
- **Em-dashes in copy** (`—`, `--`). Use commas, colons, periods, parentheses.
- **Bounce / elastic easing**.
- **Pure `#000` or `#fff`** anywhere.
- **Layout-property animations** (`width`, `height`, `padding`, `margin`).
- **Generic fonts** (Inter, system-ui as primary heading font).

---

## 12. Accessibility

- WCAG 2.1 AA minimum (4.5:1 for body, 3:1 for large text).
- All interactive elements have `:focus-visible` state with 2px orange outline + 2px offset.
- Heading hierarchy must not skip levels (`h2 → h3`, never `h2 → h4`).
- Form inputs always paired with `<label>`.
- SVG decorations have `aria-hidden="true"`.
- Brand marks have `aria-label` or are wrapped in a labeled link.
- Keyboard: every interactive element reachable via Tab; Enter/Space triggers click.
- Reduced motion: animations stop / fade in only / become instant.

---

## 13. File map

| File | Purpose |
|---|---|
| `homepage-chrome.css` | Canonical chrome (nav + footer + buttons + sections + tokens) — link this from every page. |
| `tokens.css` | Backward-compat tokens for legacy chrome. |
| `chrome.css` | Legacy chrome — being phased out. |
| `index.html` | Homepage source of truth. All component patterns live here. |
| `design-system.html` | Live visual reference for devs (this doc's HTML companion). |

---

## 14. How to use this on product surfaces

1. Link `homepage-chrome.css` from every page.
2. Use the canonical `<nav>` and `<footer>` blocks (copy from `index.html`).
3. For new components, follow the patterns above. If a pattern isn't here, propose an extension via PR before shipping.
4. Run the impeccable detector before launch:
   ```bash
   npx impeccable --json path/to/your-page.html
   ```
   Aim for **zero high-priority anti-patterns**.
5. Test both themes (`html[data-theme="dark|light"]`) and `prefers-reduced-motion`.
6. Test mobile breakpoints at 375px, 768px, 1024px, 1440px.

---

## 15. Forms

### Input states · all text inputs, selects, textareas

| State | Treatment |
|---|---|
| Default | 1px `--line` border, no background, square corners |
| Focused | Border flips to `--zop-orange`, no glow, no ring |
| Hover | Border deepens to `--g-500` |
| Disabled | Background `--g-100`, text `--g-500`, cursor `not-allowed` |
| Error | Border `--zop-orange`, helper text `--zop-orange` below |
| Success | Border `--zop-green`, optional check glyph |
| Loading | Right-edge mono spinner `⋯` cycling |

### Labels

- Above the input, mono uppercase, 10–11px, `--g-600`, letter-spacing 0.12em.
- Required marker: prepend `· ` not `*`. Optional marker: append `(optional)` in `--g-500`.

### Helper text

- Below the input, 12px, `--g-600`, line-height 1.5.
- Error helper text is `--zop-orange`, 12px, with a leading mono `→`.

### Buttons inside forms

- Primary submit: `.btn .btn-primary`, full-width on mobile, auto-width on desktop.
- Submit button position: bottom-right of the form, never centered.
- Cancel/back: `.btn-ghost` underlined link, sits left of submit.

### Fieldset structure

```html
<fieldset class="form-group">
  <legend class="label">connection details</legend>
  <div class="field">
    <label class="label" for="x">Work email</label>
    <input class="input" id="x" type="email"/>
    <p class="helper">We'll send a magic link.</p>
  </div>
</fieldset>
```

---

## 16. Tables

### Anatomy

- Header row: mono uppercase, 10–11px, `--g-600`, bottom border 1px solid `--line`.
- Body rows: 14px body font, 12–14px vertical padding, dashed bottom border (`1px dashed --line`).
- Numerics: monospace, `tabular-nums`, right-aligned.
- Hover: row gets `--g-50` background subtly.
- Selected row: 1px solid `--zop-orange` left edge, no fill.

### Sort indicators

- Sortable header gets a small `↕` glyph in `--g-500`, right-aligned within the header cell.
- Active sort: `↑` or `↓` in `--ink`, header text in `--ink`.
- Never style sortable headers as buttons — they're text with a glyph.

### Empty / no-data

- 1 row centered with the empty-state pattern (see §18).
- Don't show "—" everywhere — that reads as data corruption.

### Pagination

- Footer area: `1–25 of 847` left-aligned, page chevrons right-aligned.
- Chevrons are `‹‹ ‹ › ››` mono, 12px, `--g-600`, `--ink` on hover.
- Items-per-page selector: dropdown, mono uppercase.

---

## 17. Alerts, toasts, notifications

### Alert (inline, block-level)

- Square corners. 1px solid border. Left-edge color tag (4px wide), full-bleed background tint.
- Icon at top-left, 16px stroke-1.5.
- Heading bold 14px, body 13px.
- Dismiss button top-right (`×`), mono 14px, `--g-500` → `--ink` on hover.

| Severity | Border | Tint | Icon |
|---|---|---|---|
| info | `--zop-blue` | `rgba(42,68,148,.06)` | ⓘ |
| success | `--zop-green` | `rgba(127,178,54,.08)` | ✓ |
| warning | `--zop-orange` | `rgba(245,133,73,.07)` | ! |
| critical | `--zop-orange` | `rgba(245,133,73,.12)` | ⚠ |

### Toast (transient)

- Bottom-right viewport corner, 320–400px wide.
- Slides up + fades in, 200ms `--ease-out`.
- Auto-dismiss at 5s default; `critical` toasts never auto-dismiss.
- Stack vertically with 8px gap; max 4 visible.

### Inline status pills

- Mono uppercase, 10px, 1px border, square corners.
- Color matches severity (border + text), background transparent.
- Examples: `● live`, `● draft`, `● failed`, `● pending`.

---

## 18. Empty, loading, and error states

### Empty state

```
┌──────────────────────────────┐
│                              │
│   [16px square accent]       │
│                              │
│   No findings yet.           │
│                              │
│   Connect an account to      │
│   start scanning.            │
│                              │
│   [Connect AWS →]            │
│                              │
└──────────────────────────────┘
```

- Centered, 320–480px wide.
- Heading 18–22px, body 14px `--g-600`, primary CTA below.
- Icon: 16×16 orange square, never an illustration.
- Copy: 1 sentence statement + 1 sentence next step. Never apologetic ("oops!").

### Loading state

- Skeleton bars, 1px solid `--line`, no background fill, no shimmer animation.
- Match the height of the data they'll replace, never taller.
- Don't use spinners except for: form submit buttons, table-cell loading, < 2s waits.

### Error state

- Red is not in the brand palette — use orange.
- Title: factual, non-apologetic. "Couldn't reach AWS." not "Oh no, something went wrong!"
- Body: what we tried + what to do next.
- Two actions max: `Retry` (primary) + `Contact support` (ghost).

---

## 19. Tabs and segmented controls

### Tabs (top-anchored, page-level)

- Tab labels: mono uppercase 11px, `--g-600` inactive, `--ink` active.
- Active tab: 2px bottom border `--ink`, no background fill.
- Container has 1px bottom border `--line` running the full width.
- Hover: text `--ink`, no background change.

### Segmented controls (inline, smaller surfaces)

- Square 1px border `--line` wrapping all segments.
- Active segment: `--ink` background, `--paper` text, `--ink` border.
- Inactive: transparent, `--g-700` text.
- Border-collapse so adjacent segments share their edge.

```html
<div class="segmented">
  <button class="seg active">Daily</button>
  <button class="seg">Weekly</button>
  <button class="seg">Monthly</button>
</div>
```

---

## 20. Modals and dialogs

### When to use

- Action requires confirmation AND is destructive (delete, terminate).
- Critical input flow that demands user attention (payment, MFA).
- The user opted into the dialog (clicked "Edit profile" → modal).

### When NOT to use

- Onboarding (use a dedicated page or drawer).
- Information that could be inline (use a popover or expandable).
- Marketing/upsell (never).
- Confirmations of non-destructive actions.

### Anatomy

- Backdrop: `rgba(10,10,10,.4)`, no blur.
- Container: 480–640px wide, square corners, 1px `--line` border, `--paper` bg.
- Header: title 18px, close button top-right.
- Body: padding 24px, max-height 70vh, scrollable.
- Footer: actions right-aligned, primary on right, ghost cancel on left.

### Behavior

- ESC closes, click-backdrop closes, focus trap inside, return focus to trigger on close.
- Animate in 200ms scale 0.97 → 1, opacity 0 → 1.
- Never stack modals — if one is open, no new ones open until close.

---

## 21. Dropdowns and menus

- Anchor: any button or input.
- Panel: 1px `--line` border, square corners, `--paper` bg, padding 4px 0.
- Items: 36px tall, padding `8px 14px`, font 14px, hover `--g-50`.
- Active/selected: leading 8px orange square (the brand mark).
- Section divider: 1px solid `--line`, no padding around it.
- Keyboard: `↑↓` navigate, `Enter` select, `Esc` close.
- Position: right-anchored under the trigger by default; flip up if no space below.

---

## 22. Breakpoints + layout system

| Token | Value | Use |
|---|---|---|
| `--break-xs` | 480px | Phone landscape pivot |
| `--break-sm` | 640px | Small tablets, large phones |
| `--break-md` | 768px | Tablets |
| `--break-lg` | 1024px | Small laptops |
| `--break-xl` | 1280px | Standard laptop |
| `--break-2xl` | 1536px | Large desktop |

### Container widths

- `--max: 1200px` — content max-width
- `--gutter`: 32px desktop, 24px tablet, 20px phone
- Always wrap content in `<div class="container">` for centered layout

### Spacing scale (multiples of 4px)

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128`

Vary spacing for rhythm; same padding everywhere is monotony.

### Test breakpoints

- 375 (iPhone SE)
- 414 (iPhone Plus)
- 768 (iPad)
- 1024 (iPad Pro / small laptop)
- 1440 (typical desktop)
- 1920 (large desktop)

---

## 23. Sub-brand guidance · ZopNight, ZopDay, ZopCloud

Each sub-brand owns ONE color from the locked palette:

| Sub-brand | Color | Domain |
|---|---|---|
| **ZopNight** | `--zop-blue` | Cloud cost, infrastructure, CDCR |
| **ZopDay** | `--zop-orange` | Activation, signature accent, high-energy moments |
| **ZopCloud** | `--zop-green` | Multi-cloud platform, financial outcomes, success states |

### Rules

- Never swap a sub-brand's color. ZopNight is never orange. ZopDay is never green.
- Use the sub-brand's color as ~5–10% of the surface, never as the dominant fill (unless on a Drenched campaign page).
- ZopDev (umbrella) shows all three colors in the 4-quadrant mark.
- Per-sub-brand pages should anchor the brand color in eyebrows, accent details, and primary actions — but body color stays neutral.

### Handoff to product UI

When a product surface is sub-brand-specific:
- Eyebrow / section meta: in the sub-brand color.
- Primary CTA: ink, with sub-brand color as a leading dot/icon.
- Accent details (charts, status pills, focus states): sub-brand color.
- Body text and chrome: neutral (paper / ink / grays).

### Single saturated brand band per page

Each product page (`zopnight.html`, `zopday.html`, `zopcloud.html`) carries **exactly one** section with a fully saturated sub-brand background — the closing CTA (`.zX-final`). Rest of the page sits on a single shared canvas (no per-section background overrides). The brand band is the page's visual sign-off.

| Page | Section | BG | Text | Primary CTA | Secondary CTA |
|---|---|---|---|---|---|
| zopnight | `.zn-final` | `var(--zop-blue)` `#2A4494` | `var(--paper)` cream (~10:1 AA) | paper bg + blue text | transparent + cream border |
| zopday | `.zd-final` | `var(--zop-orange)` `#F58549` | `#0A0A0A` ink (AAA) | ink bg + orange text | transparent + ink border |
| zopcloud | `.zc-final` | `var(--zop-green)` `#7FB236` | `#0A0A0A` ink | ink bg + green text | transparent + ink border |

**Text-color rule:** green and orange both fail AA when paired with cream text — use ink. Blue is dark enough that cream pairs cleanly. Per §3 ("Use `#3f6320` darker variant when text is white" applies if you ever DO need cream-on-green; for the brand band we side-step by keeping text dark).

**No other section** on a product page may use a saturated brand fill. Brand color anywhere else is restricted to small accents (eyebrow squares, hover stripes, h1 `<em>` highlights, button focus rings) — same 5–10% surface ratio as the homepage.

---

## 24. Motion choreography

### Stagger rules

- Sibling reveals: 60–80ms stagger between elements.
- Section enters: parent fades + first child slides up. Stagger children at 80ms.
- Card grids: stagger by row, not by individual card. Row 1 reveals together, row 2 follows 100ms later.

### Entry vs exit

- Entry: longer (350–500ms), softer easing (`--ease-out`).
- Exit: shorter (180–250ms), no overshoot.
- Disappearing elements never animate position; just fade.

### Choreography hierarchy

1. **Container** fades in.
2. **Headline** slides up + fades.
3. **Body copy** slides up + fades, 80ms after headline.
4. **CTAs** slide up + fades, 80ms after body.
5. **Visual / illustration** scales in (0.96 → 1) + fades, 100ms after CTAs.

### Cross-page transitions

- View Transitions API where supported, 360ms cross-fade.
- Fallback: simple body opacity 0 → 1 over 420ms on load.

### Scroll-driven motion

- Use IntersectionObserver, threshold 0.15–0.20.
- Trigger once per element by default; re-trigger only for ambient backgrounds (continuous loops).
- Reduced motion: stop all loops, replace fade-in with instant show.

---

## 25. Show-more toggle pattern

When a section has a long tail of cards/items that aren't essential on first scan, hide them behind a toggle. Used on the homepage ZopNight FinOps section: 4 engine bento cards visible, 5 capability tiles hidden behind a "Show more features" button.

### Markup

```html
<button class="cap-toggle" type="button"
        aria-expanded="false" aria-controls="cap-strip-zn">
  <span class="cap-toggle-label">Show more features</span>
  <svg class="cap-toggle-arrow" viewBox="0 0 16 16" fill="none"
       stroke="currentColor" stroke-width="1.75" aria-hidden="true">
    <path d="M3 6 L8 11 L13 6"/>
  </svg>
</button>

<div class="cap-strip" id="cap-strip-zn" hidden>
  <!-- additional cards -->
</div>
```

### Style

- Centered button, 1px `--line` border, transparent fill, `--ink` text, 14px Space Grotesk.
- Hover: canonical card-lift (`translateY(-4px)` + `box-shadow: 0 8px 0 -4px var(--zop-orange)` + ink border).
- Chevron rotates 180° when expanded (`[aria-expanded="true"] .arrow{ transform:rotate(180deg) }`).
- Hidden tail container uses the HTML `hidden` attribute — `[hidden]{ display:none }` in CSS so the JS just toggles the attribute.

### Reveal animation (matches §24 stagger rules)

Each child card animates in with an 80ms sibling stagger:

```css
.cap-strip.is-revealed .cap-card{
  animation: cap-card-in 480ms cubic-bezier(.22, 1, .36, 1) both;
}
.cap-strip.is-revealed .cap-card:nth-child(1){ animation-delay: 40ms; }
.cap-strip.is-revealed .cap-card:nth-child(2){ animation-delay: 120ms; }
.cap-strip.is-revealed .cap-card:nth-child(3){ animation-delay: 200ms; }
.cap-strip.is-revealed .cap-card:nth-child(4){ animation-delay: 280ms; }
.cap-strip.is-revealed .cap-card:nth-child(5){ animation-delay: 360ms; }

@keyframes cap-card-in{
  from{ opacity:0; transform:translateY(28px) scale(0.97); }
  to  { opacity:1; transform:translateY(0)    scale(1); }
}
@media (prefers-reduced-motion: reduce){
  .cap-strip.is-revealed .cap-card{
    animation:none; opacity:1; transform:none;
  }
}
```

### Behaviour

- Click expands: removes `hidden`, adds `.is-revealed` (force reflow before adding so the animation runs each open), button label flips to "Hide extra features", `aria-expanded="true"`.
- Click again collapses instantly: adds `hidden`, removes `.is-revealed`, label and arrow restore.
- No exit animation — `display:none` kills transitions, and instant collapse is more honest per §24 (disappearing elements just fade or, here, simply disappear with the layout reflow).
- `aria-controls` ties the button to the controlled region for screen readers.

---

## 26. Tables · canonical lockdown

§16 defines the visual spec; this section locks the implementation pattern. On any page with multiple tables (e.g. `zopnight.html` carries 5: `.zn-problem`, `.zn-compare`, `.zn-proof-table`, `.zn-pricing`, `.zn-stake`), apply the spec via a single `:is(...)` selector at the END of the page CSS so source order beats the older per-table rules:

```css
:is(.zn-problem, .zn-compare, .zn-proof-table, .zn-pricing, .zn-stake){
  width:100%; border-collapse:collapse;
  font-family:var(--font); font-size:var(--t-14);
  line-height:1.5; background:transparent;
}
:is(.zn-problem, .zn-compare, .zn-proof-table, .zn-pricing, .zn-stake) th,
:is(.zn-problem, .zn-compare, .zn-proof-table, .zn-pricing, .zn-stake) td{
  padding:14px var(--sp-5);
  border-bottom:1px dashed var(--line);
  text-align:left;
  vertical-align:top;
}
:is(...) thead th{
  font-family:var(--mono); font-size:var(--t-11); font-weight:600;
  color:var(--ink-3); letter-spacing:.08em; text-transform:uppercase;
  border-bottom:1px solid var(--ink);
}
:is(...) tbody tr:hover{ background:var(--bg-2); }
:is(...) tbody tr:last-child :is(th,td){ border-bottom:0; }
:is(...) .zn-us{ background:rgba(245,133,73,.08); }
:is(...) thead .zn-us{ color:var(--zop-orange); border-bottom-color:var(--zop-orange); }
:is(...) tbody td.zn-us strong{ color:var(--zop-orange); font-weight:700; }
```

Per-table overrides should only carry truly unique data dimensions (column widths, special row types like `.zn-pricing-tagline`, `.zn-pricing-hi`, `.zn-pricing-price`). Never re-declare font, padding, border, or hover behaviour locally — those come from the unified rule.

Don't introduce a fresh table style on a new page; add the new class to the `:is(...)` list.

---

**Last updated**: 2026-05-06 — sourced from this session's product-page overhaul (always-dark hero, 3D dotted shape per product, single saturated brand band, unified table spec, show-more toggle on the FinOps bento, font lockdown). Sections 7.12, 25, and 26 are new; §3, §4, §7.3, §10, §11, and §23 expanded; §16 anatomy unchanged but now governed by §26's lockdown pattern.
