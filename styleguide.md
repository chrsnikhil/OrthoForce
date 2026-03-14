# NEOBRUTALIST UI STYLEGUIDE
### For: Denture Strap Monitor / ESP32 Dashboard

---

## PHILOSOPHY

Neobrutalism is **raw, honest, and unapologetic**. No shadows pretending to be real objects. No rounded corners trying to be friendly. Everything is flat, bold, and in your face. The interface doesn't hide what it is — a machine reading data. Embrace that.

> "Make it look like it was built, not designed."

---

## COLOR PALETTE

```
--black:       #0A0A0A   /* Primary text, borders */
--white:       #FAFAFA   /* Background */
--yellow:      #FFE500   /* Primary accent — alerts, highlights */
--red:         #FF2D2D   /* Danger, exceeded state */
--green:       #00FF85   /* Normal/safe state */
--blue:        #0047FF   /* Interactive elements, links */
--gray:        #C8C8C8   /* Disabled, secondary text */
--paper:       #F5F0E8   /* Card backgrounds */
```

### Usage Rules
- **Background**: Always `--white` or `--paper`. Never dark mode (unless explicitly requested).
- **Borders**: Always `--black`, minimum `2px`, usually `3px`.
- **Accent**: Use `--yellow` sparingly — one per screen max.
- **Status colors**: `--red` for exceeded, `--green` for normal. Never muted versions.

---

## TYPOGRAPHY

```css
/* Display / Headers */
font-family: 'Space Mono', 'Courier New', monospace;
font-weight: 700;

/* Body */
font-family: 'IBM Plex Mono', monospace;
font-weight: 400;

/* Labels / UI */
font-family: 'Space Mono', monospace;
font-weight: 400;
text-transform: uppercase;
letter-spacing: 0.08em;
```

### Type Scale
```
--text-xs:    11px   /* Labels, metadata */
--text-sm:    13px   /* Secondary text */
--text-base:  16px   /* Body */
--text-lg:    20px   /* Subheadings */
--text-xl:    28px   /* Section titles */
--text-2xl:   40px   /* Page title */
--text-3xl:   72px   /* Hero numbers (FSR value display) */
--text-4xl:  120px   /* Oversized display numbers */
```

### Rules
- All headings: **UPPERCASE**
- No italic — ever
- No font weights between 400 and 700
- Line height: `1.1` for headings, `1.6` for body

---

## BORDERS & SHADOWS

Neobrutalism uses **hard offset shadows** — no blur, no spread, just solid black offsets.

```css
/* Standard shadow */
box-shadow: 4px 4px 0px #0A0A0A;

/* Large shadow (cards, modals) */
box-shadow: 6px 6px 0px #0A0A0A;

/* Accent shadow (CTA buttons) */
box-shadow: 6px 6px 0px #FFE500;

/* Danger shadow */
box-shadow: 6px 6px 0px #FF2D2D;

/* No shadow (flat, secondary elements) */
box-shadow: none;
```

### Border Rules
```css
border: 3px solid #0A0A0A;   /* Default */
border: 2px solid #0A0A0A;   /* Small elements */
border: 4px solid #0A0A0A;   /* Hero/featured elements */
border-radius: 0;             /* ALWAYS — no rounded corners */
```

---

## SPACING SYSTEM

Based on an **8px grid**. Everything snaps to multiples of 8.

```
--space-1:   4px
--space-2:   8px
--space-3:  12px
--space-4:  16px
--space-5:  24px
--space-6:  32px
--space-7:  48px
--space-8:  64px
--space-9:  96px
--space-10: 128px
```

### Layout Rules
- Page padding: minimum `--space-7` (48px) on desktop
- Card padding: `--space-6` (32px)
- Component gap: `--space-5` (24px)
- Label-to-input gap: `--space-2` (8px)

---

## COMPONENTS

### Button — Primary
```css
.btn-primary {
  background: #FFE500;
  color: #0A0A0A;
  border: 3px solid #0A0A0A;
  box-shadow: 4px 4px 0px #0A0A0A;
  padding: 12px 24px;
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  cursor: pointer;
  transition: transform 0.1s, box-shadow 0.1s;
}

.btn-primary:hover {
  transform: translate(-2px, -2px);
  box-shadow: 6px 6px 0px #0A0A0A;
}

.btn-primary:active {
  transform: translate(2px, 2px);
  box-shadow: 2px 2px 0px #0A0A0A;
}
```

### Button — Danger
```css
.btn-danger {
  background: #FF2D2D;
  color: #FAFAFA;
  border: 3px solid #0A0A0A;
  box-shadow: 4px 4px 0px #0A0A0A;
  /* same padding/font as primary */
}
```

### Button — Ghost
```css
.btn-ghost {
  background: transparent;
  color: #0A0A0A;
  border: 3px solid #0A0A0A;
  box-shadow: none;
}

.btn-ghost:hover {
  background: #0A0A0A;
  color: #FAFAFA;
}
```

---

### Card
```css
.card {
  background: #F5F0E8;
  border: 3px solid #0A0A0A;
  box-shadow: 6px 6px 0px #0A0A0A;
  padding: 32px;
}

.card-header {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #0A0A0A;
  border-bottom: 2px solid #0A0A0A;
  padding-bottom: 12px;
  margin-bottom: 24px;
}
```

---

### Status Badge
```css
.badge {
  display: inline-block;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  border: 2px solid #0A0A0A;
}

.badge-normal   { background: #00FF85; color: #0A0A0A; }
.badge-exceeded { background: #FF2D2D; color: #FAFAFA; }
.badge-idle     { background: #C8C8C8; color: #0A0A0A; }
```

---

### Progress Bar
```css
.progress-container {
  width: 100%;
  height: 24px;
  background: #FAFAFA;
  border: 3px solid #0A0A0A;
}

.progress-fill {
  height: 100%;
  background: #0047FF;
  transition: width 0.3s linear;
}

.progress-fill.exceeded {
  background: #FF2D2D;
}
```

---

### Data Display (FSR Value)
```css
.data-value {
  font-family: 'Space Mono', monospace;
  font-size: 120px;
  font-weight: 700;
  line-height: 1;
  color: #0A0A0A;
  /* No decoration, raw number */
}

.data-label {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: #0A0A0A;
  margin-top: 8px;
}
```

---

### Input / Text Field
```css
.input {
  background: #FAFAFA;
  border: 3px solid #0A0A0A;
  box-shadow: none;
  padding: 10px 14px;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 14px;
  color: #0A0A0A;
  outline: none;
  width: 100%;
  transition: box-shadow 0.1s;
}

.input:focus {
  box-shadow: 4px 4px 0px #0047FF;
}
```

---

### Alert / Warning Banner
```css
.alert {
  background: #FFE500;
  border: 3px solid #0A0A0A;
  border-left: 8px solid #0A0A0A;
  padding: 16px 20px;
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
}

.alert-danger {
  background: #FF2D2D;
  color: #FAFAFA;
}
```

---

## LAYOUT PRINCIPLES

### Grid
```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 48px;
}

.grid {
  display: grid;
  gap: 24px;
}

.grid-2 { grid-template-columns: repeat(2, 1fr); }
.grid-3 { grid-template-columns: repeat(3, 1fr); }
```

### Rules
- **No centered hero layouts** — offset everything slightly left or right
- **Use visible grid lines** — borders between sections instead of whitespace
- **Overlap elements** intentionally — cards overlapping headers, numbers breaking containers
- **Thick top border on page** — 6px black top border on `<body>` or main container

---

## ICONOGRAPHY

- Use **no icon libraries** — substitute with text symbols and unicode
- Preferred symbols:
  ```
  ⚠   Warning
  ✓   Success / Normal
  ✗   Error
  →   Navigation / Direction
  ↑↓  Data direction
  ◆   Bullet / Marker
  ░▓  Progress indicator (ASCII style)
  ```
- Icons must match body text size — never decorative large icons

---

## ANIMATION

Keep animations **mechanical and intentional** — no easing curves that feel "organic".

```css
/* Standard transition */
transition: all 0.1s linear;

/* Button press */
transform: translate(2px, 2px);

/* State change flash */
@keyframes flash {
  0%   { background: #FF2D2D; }
  50%  { background: #FFE500; }
  100% { background: #FF2D2D; }
}

/* Blink (for exceeded state) */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
.blink { animation: blink 0.8s step-end infinite; }
```

### Rules
- Duration: max `200ms` for interactions, max `600ms` for state changes
- Easing: `linear` or `steps()` only — no `ease-in-out`
- No entrance animations on data — data appears instantly
- Reserve animation for **alerts and state changes only**

---

## DARK MODE VARIANT

If dark mode is needed, invert deliberately — not automatically:

```
--black:  #FAFAFA
--white:  #0A0A0A
--paper:  #1A1A1A
--yellow: #FFE500   /* stays the same */
--red:    #FF2D2D   /* stays the same */
--green:  #00FF85   /* stays the same */
--blue:   #4D7FFF   /* slightly lighter */
```

---

## WHAT NOT TO DO

```
✗ No border-radius (ever)
✗ No box-shadow with blur
✗ No gradients
✗ No opacity tricks for hierarchy — use size and weight
✗ No Google Material or Fluent icons
✗ No Inter, Roboto, or system fonts
✗ No centered text blocks over 2 lines
✗ No hover color transitions that take > 200ms
✗ No skeleton loaders — show raw "--" or "..." instead
✗ No cards without visible borders
✗ No subtle colors — if it needs to be noticed, make it loud
```

---

## QUICK REFERENCE CHEATSHEET

| Element         | Background  | Border           | Shadow              | Font          |
|-----------------|-------------|------------------|---------------------|---------------|
| Page            | `#FAFAFA`   | none             | none                | IBM Plex Mono |
| Card            | `#F5F0E8`   | 3px `#0A0A0A`    | 6px 6px `#0A0A0A`   | Space Mono    |
| Primary Button  | `#FFE500`   | 3px `#0A0A0A`    | 4px 4px `#0A0A0A`   | Space Mono 700|
| Danger Button   | `#FF2D2D`   | 3px `#0A0A0A`    | 4px 4px `#0A0A0A`   | Space Mono 700|
| Input           | `#FAFAFA`   | 3px `#0A0A0A`    | none (focus: blue)  | IBM Plex Mono |
| Badge Normal    | `#00FF85`   | 2px `#0A0A0A`    | none                | Space Mono 700|
| Badge Exceeded  | `#FF2D2D`   | 2px `#0A0A0A`    | none                | Space Mono 700|
| Alert           | `#FFE500`   | 3px + 8px left   | none                | Space Mono 700|

---

*Styleguide version 1.0 — Denture Strap Monitor Project*