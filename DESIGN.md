---
name: VT Page
description: "Loa Báo Tiền: a matte orange payment soundbox on a porcelain-grey counter; money goes to your own account, the box only rings."
colors:
  ground: "#E9EAEE"
  plate: "#F6F7F9"
  plate-2: "#DCDEE5"
  slot: "#FBFBFC"
  line: "#C4C7D0"
  ink: "#14161A"
  ink-2: "#383D48"
  ink-3: "#586070"
  orange: "#FF5A1F"
  orange-deep: "#E04310"
  orange-face: "#E24812"
  cobalt: "#2450F5"
  led-amber: "#FF9548"
  led-blue: "#86A6FF"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "clamp(2.6rem, 5.2vw, 4.6rem)"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.035em"
    fontVariation: "font-stretch 92%"
  headline:
    fontFamily: "Bricolage Grotesque, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "clamp(2.1rem, 4.4vw, 3.8rem)"
    fontWeight: 800
    lineHeight: 1.03
    letterSpacing: "-0.035em"
    fontVariation: "font-stretch 92%"
  title:
    fontFamily: "Bricolage Grotesque, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "1.3rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Be Vietnam Pro, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  ui:
    fontFamily: "Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.1
  label:
    fontFamily: "Barlow Condensed, Be Vietnam Pro, system-ui, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.09em"
  led:
    fontFamily: "Doto, Be Vietnam Pro, ui-monospace, monospace"
    fontSize: "clamp(1.9rem, 3.4vw, 2.7rem)"
    fontWeight: 900
    lineHeight: 1
    letterSpacing: "0.02em"
rounded:
  key: "14px"
  key-sm: "12px"
  key-lg: "16px"
  slot: "22px"
  field: "14px"
  lane: "24px"
  plate: "30px"
  label-plate: "8px"
  round: "50%"
  pill: "99px"
spacing:
  gutter: "clamp(18px, 4vw, 40px)"
  wrap: "1200px"
  section-y: "clamp(48px, 7vw, 96px)"
  gap-md: "16px"
  gap-lg: "clamp(28px, 5vw, 72px)"
components:
  button-primary:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.ink}"
    typography: "{typography.ui}"
    rounded: "{rounded.key}"
    height: "44px"
    padding: "0 22px"
  button-primary-lg:
    backgroundColor: "{colors.orange}"
    textColor: "{colors.ink}"
    rounded: "{rounded.key-lg}"
    height: "56px"
    padding: "0 30px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.key}"
    height: "44px"
  button-outline-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.plate}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.key}"
  button-ink:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.plate}"
    rounded: "{rounded.key}"
  input-slot:
    backgroundColor: "{colors.slot}"
    textColor: "{colors.ink}"
    rounded: "{rounded.field}"
    height: "52px"
    padding: "0 16px"
  label-sticker:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.label-plate}"
    padding: "10px 18px 10px 14px"
  led-chip:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.led-amber}"
    typography: "{typography.led}"
  led-chip-money:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.led-blue}"
  result-panel:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.led-blue}"
    rounded: "18px"
    padding: "18px 20px"
  lane-wallet:
    backgroundColor: "{colors.plate-2}"
    rounded: "{rounded.lane}"
  lane-vt:
    backgroundColor: "#FFFFFF"
    rounded: "{rounded.lane}"
  auth-plate:
    backgroundColor: "{colors.plate}"
    rounded: "{rounded.plate}"
    padding: "42px"
  footer-label:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "20px"
    padding: "24px 26px 22px"
---

# Design System: VT Page

## Overview

**Creative North Star: "Loa Báo Tiền"**

The payment soundbox on every Vietnamese counter. The whole site is that object and its shop: a matte signal-orange plastic shell, a cool porcelain-grey ground, ink-black type and grille. The recurring material is the perforated dot lattice: a canvas grille that swells in waves, dot-matrix LED numerals, condensed printed label plates, raised plastic keys, recessed input slots, and a footer that reads as the regulatory label on the back of the device.

The system is calm between beats and precise during them. Surfaces are matte and physical (soft bevels, soft offset shadows), never glassy or luminous. One 5-second beat drives every animation, so the page behaves like one machine, not a collection of effects. The story it tells: money lands in your own account, the box only rings.

**Key Characteristics:**
- Orange is the signal; cobalt is money; ink is structure and blocked states. Colour is a law, not a mood.
- Hardware vocabulary: raised keys, recessed slots, label plates, LED panels, a barcode label.
- Dot lattice is the one recurring texture (hero canvas, speaker grille, diagram paper, CTA, footer slot).
- Editorial display type (wide-tight Bricolage) against printed-plate condensed labels and dot-matrix numerals.
- Depth is soft and physical. No glow halos, no hard offset shadows.
- One phase-locked beat; everything stops on pause or reduced motion.

## Colors

A cool porcelain ground carrying one hot signal orange, ink for everything structural, and a single cobalt reserved for money.

### Primary
- **Signal Orange** (`orange`, #FF5A1F): the speaker shell, primary buttons, the active spec key, the CTA band, live dots, QR scan line, signal and alert flows in the diagram, selection. Ink on it measures about 5.8:1. Never body text on grey.
- **Orange Deep** (`orange-deep`, #E04310): error icon tint only. **Orange Face** (`orange-face`, #E24812): the recessed speaker face inside the shell.

### Secondary
- **Account Cobalt** (`cobalt`, #2450F5): money and the creator's own account only: the money line and coin in the diagram, completed step nodes and the vt lane connector, the "tiền về thẳng tài khoản" underline, the final-step line, the alert-chip amount. About 5.5:1 on plate.

### Neutral
- **Porcelain Ground** (`ground`, #E9EAEE): page background and sticky bar.
- **Plate** (`plate`, #F6F7F9): raised surfaces, keys, label plates, auth panel, footer label.
- **Plate Shade** (`plate-2`, #DCDEE5): the wallet lane, hover fills.
- **Slot** (`slot`, #FBFBFC): recessed input fields.
- **Seam Line** (`line`, #C4C7D0): 1px rules, panel rings, pending connectors.
- **Ink** (`ink`, #14161A): text, grille dots, display panels, footer, held and blocked states, focus ring.
- **Ink 2** (`ink-2`, #383D48): secondary text. **Ink 3** (`ink-3`, #586070): tertiary text, prefixes, pending nodes (about 5.3:1 on ground).

### LED (display panels only)
- **LED Amber** (`led-amber`, #FF9548): signal chips inline in headings; pulses between #C46A22 and #FFAA63 on the beat.
- **LED Blue** (`led-blue`, #86A6FF): money readouts (speaker display, result panels, money chip).

### Named Rules
**The Signal-Money-Ink Rule.** Orange means signal, alert, or the primary action. Cobalt means money or the creator's account. Ink means type, grille, or a held or blocked state. A colour never crosses its meaning.

**The Ink-Panel Rule.** LED colours (amber, blue) appear only on ink display panels with Doto numerals. They are never used on the grey ground, never as text colour elsewhere.

**The Ink-on-Orange Rule.** Text on orange is ink, never white.

## Typography

**Display Font:** Bricolage Grotesque (600-800, width 75-100%, with Be Vietnam Pro fallback)
**Body Font:** Be Vietnam Pro (400/500/600/700)
**Label Font:** Barlow Condensed (600/700, uppercase printed plates)
**LED Font:** Doto (700-900, dot-matrix numerals)

**Character:** Bricolage at 92% width and -0.035em is tight and confident, an editorial voice on a hardware object. Barlow Condensed reads like printing on the device; Doto is the display panel. All faces are self-hosted (latin and vietnamese subsets) and every heading carries Vietnamese diacritics.

### Hierarchy
- **Display** (800, clamp(2.6rem, 5.2vw, 4.6rem), 1.02): hero title; CTA title is clamp(2.5rem, 5.6vw, 4.6rem).
- **Headline** (800, clamp(2.1rem, 4.4vw, 3.8rem), 1.03): section heading; compare title clamp(1.9rem, 3.8vw, 3.2rem); auth title 2.4rem. All at font-stretch 92%.
- **Title** (700, 1.3rem, 1.2, -0.025em): spec titles; dropdown title 1.05rem.
- **Body** (400, 16px, 1.6): hero description scales clamp(1.05rem, 1.5vw, 1.25rem), lede 1.1rem, held to 38-46ch.
- **UI** (600, 15px; 16 large, 14 small): buttons, step labels.
- **Label** (Barlow Condensed 700, 1.05-1.1rem, +0.09em, uppercase): lane titles, footer headings; the sticker is 600 at 1.05rem, +0.02em.
- **LED** (Doto 900): speaker display (4.5cqw), result amount (clamp(1.9rem, 3.4vw, 2.7rem)), inline chips (font-stretch 100%, word-spacing -0.22em).

### Named Rules
**The Plate-Not-Kicker Rule.** Condensed uppercase labels are printed plates inside a component (lane title, footer heading, sticker on the shell). They never sit above a heading as an intro line.

**The LED Numeral Rule.** Only amounts and the 5-second promise are set in Doto, always on an ink panel.

## Layout

A 1200px content wrap with a fluid gutter (clamp(18px, 4vw, 40px)). Sections are two-column asymmetric grids that collapse to one column at 960px: hero (0.86fr / 1.14fr, speaker bleeds past the wrap on the right), mechanism head (1.3 / 0.7) and body (1.05 / 0.95, diagram sticky at top 104px on desktop), CTA (1 / 1), auth (fluid / 460px). Comparison lanes are two equal columns until 720px, then stack. Footer is 1.15 / 1 / 0.6, then two columns at 960px, one at 720px. Section rhythm is clamp(48px, 7vw, 96px) top and clamp(64px, 9vw, 128px) bottom; the hero fills the viewport (min clamp(560px, 100svh - 72px, 820px)). The header is sticky, 72px (64px on phones). Touch targets are 40-56px. The speaker scales by container units, so it stays proportionate at any width. Content is visible without JS; the reveal fade is applied only under `.js`.

## Elevation & Depth

Hybrid of soft offset shadows and soft inner bevels, like moulded plastic under a counter light. Raised things carry an inner top highlight, an inner bottom shade, and a soft drop shadow; recessed things carry an inner top shadow and a 1-2px light lip below. There are no glow halos and no hard offset shadows.

### Shadow Vocabulary
- **Raised key** (`inset 0 1.5px 0 rgba(255,255,255,.45), inset 0 -4px 6px -2px rgba(140,30,0,.42), 0 10px 18px -10px rgba(20,22,26,.6), 0 2px 4px rgba(20,22,26,.16)`): primary button; the plate, ink and icon keys use the same anatomy in their own tints.
- **Recessed slot** (`inset 0 3px 6px rgba(20,22,26,.22), 0 2px 0 rgba(255,255,255,.35)`): username field; form inputs use `inset 0 2px 5px rgba(20,22,26,.2)` plus a 1px line ring.
- **Panel lift** (`0 0 0 1px var(--line), 0 44px 60px -40px rgba(20,22,26,.5)`): auth plate, diagram, dropdown.
- **LED well** (`inset 0 .5em .9em rgba(0,0,0,.6), 0 2px 0 rgba(255,255,255,.6)`): ink display panels.
- **Shell** (speaker, in cqw): inner top highlight, inner bottom shade, 0 3cqw 4.4cqw -1.2cqw drop.

### Named Rules
**The Soft-Offset Rule.** Every shadow has a blur and a negative spread and is tinted from ink. A shadow with zero blur is forbidden, and a coloured glow around a light source is forbidden: light is drawn as fill (LED radial dot), never as halo.

**The Press Rule.** Hover lifts a key 1-2px; active presses it 1px down and flips the bevel inward.

## Shapes

Generous, moulded corners that scale with the object: keys 14px (12 small, 16 large), fields 14px, slots 22px, lanes 24px, panels 30px, the label sticker a deliberately tight 8px, chips and avatars fully round (50% or 99px). The speaker uses 8cqw shell and 5.5cqw face radii. The dot lattice is a hex-offset grid (rows at 0.866 pitch). Icon nodes are circles; keys and speaker keys are rounded squares and circles. The lane for VT Page is outlined in a 2px ink ring, not a shadow.

## Components

### Buttons (raised plastic keys)
- **Primary:** orange, ink text, raised-key bevel, 44px (56 large, 40 small), padding 0 22px, 600 weight.
- **Outline:** transparent, 1.5px ink inset ring; hover fills ink with plate text.
- **Ghost:** transparent; hover a 7% ink wash.
- **Ink:** ink face with light top edge; hover #23272E; used for the username submit, which echoes a ring on the beat.
- **States:** hover lifts 2px, active presses down; focus is a 3px ink outline offset 3px; disabled 50% opacity.

### Inputs (recessed slots)
Slot-white fill (#FBFBFC), inner shadow, 52px, 14px radius, no border. Focus swaps the ring to a 3px ink ring. The username field is one bigger slot (22px) that holds prefix, input and button. Errors are a tinted block (#FFE1D4 on #7C2504) with an orange-deep icon and a short shake.

### Label plates and stickers
Plate-coloured, 8px radius, Barlow Condensed, a 9px orange dot, tilted -4deg, stuck to the shell corner or diagram corner, never above a heading.

### LED chip
Inline ink pill (radius 0.18em) inside a heading, Doto 900, amber for the 5-second promise (pulses on the beat), blue for money amounts. It scales with the heading it sits in.

### Speaker device
The signature component. Orange shell, darker recessed face with a dot-grille canvas (dark dots, warm lit dots), and a right-hand panel: LED, ink display (LED blue digits), two keys, a QR plate with an orange scan line, and two ink feet. An alert chip (plate pill, orange icon disc, cobalt amount) pops out of its corner on the beat. All dimensions are in cqw. Buzz shakes it on demand.

### Mechanism diagram and spec rows
The diagram sits on dotted plate paper (18px dot grid, 30px radius). Nodes are white rounded rects with 2px ink strokes; money runs on cobalt lines with a coin, signal and alert on orange with dots and pulses; the dashed ghost box shows the part VT Page does not hold. Four spec rows on the right (56px plate key, title, text) take turns: the active key turns orange and rises, an orange underline fills over 3.2 s, the diagram dims the other parts to 50%.

### Comparison lanes
Two lanes for the same 100.000 VND: the wallet lane on plate-2 with an inset line, the VT lane white with a 2px ink ring. Step nodes are 38px circles: done is cobalt, warn is ink, pending is a ring in ink-3. A connector runs down each lane (line grey; cobalt at 35% on the VT lane). Each lane ends in an ink LED result panel (blue Doto amount; unknown state greyed and blinking).

### Navigation and header
Sticky ground bar with a logo mark (its LED pulses on the beat), ghost and primary buttons, a motion toggle (44px raised icon key; a fixed ink circle at bottom-left under 640px), and, when signed in, chat and notification icon keys, a round avatar and a plate dropdown.

### Footer regulatory label
Ink footer; the middle column is a plate label with Barlow headings, small text and an SVG barcode; the legal column is a perforated recessed slot; social keys are dark raised keys that turn orange on hover.

### Icons
One authored inline SVG sprite per page, 1.75 stroke, round caps and joins, `currentColor`, sized 1.25em by default (19-26px in keys and nodes). No glyph, emoji or icon font.

## Motion

One master beat of 5 seconds; the speaker "tings" at 1.3s (26%). CSS `beat-*` keyframes (LED, display, chip, echo ring, chip glow, coin, signal dot, alert dot, three pulses, heart) share the clock; fx.js aligns them to `document.timeline` and re-aligns on demand. The canvas grille ripples from the LED at TING and dies within 2.5s; the page lattice (hero, elliptical fade) does the same from the speaker LED; the pointer swells nearby dots; canvases redraw only during the wave, then rest. Between beats it is still. Diagram loops (flow dashes 1.1s, plug, badge) run only in the matching spec state; spec rows advance every 3.2s and hold on hover. The comparison race runs on an 11.8s loop when 30% visible, VT resolving at about 1.6s and the wallet at about 8.5s. Entrances use `cubic-bezier(0.16, 1, 0.3, 1)` (exponential ease-out) at 0.18-0.9s; reveal on scroll. "Xem Demo" and "Đối chiếu" trigger the beat and the race on demand.

Reduced motion: with `prefers-reduced-motion` (or `data-motion="off"`) all animation and transition is disabled, content is shown at rest, and canvases draw one still frame. The header toggle pauses or resumes and remembers the choice; buttons that trigger the beat turn motion back on.

## Do's and Don'ts

### Do:
- **Do** keep orange for signal, alert and the primary action; cobalt for money and the creator's account; ink for type, grille and held or blocked states.
- **Do** put LED amber and blue only on ink panels, set in Doto.
- **Do** build depth from soft inner bevels plus soft, negative-spread, ink-tinted offset shadows.
- **Do** set headings in Bricolage 800 at 92% width and -0.035em; labels in Barlow Condensed uppercase inside plates.
- **Do** draw every icon in the sprite at 1.75 stroke, round caps.
- **Do** drive any new motion off the 5s beat, with exponential ease-out, and honour the pause toggle and reduced motion.
- **Do** use the dot lattice as the one recurring texture.

### Don't:
- **Don't** go dark neon gaming: no black-page with glowing accents, no glow halos or coloured blooms.
- **Don't** use gradient text, glossy hardware-on-gradient hero staging, or hard offset (zero-blur) shadows.
- **Don't** place a kicker, eyebrow or small label above a heading.
- **Don't** lay out features as equal icon-card grids.
- **Don't** use emoji, glyph characters or icon fonts as icons.
- **Don't** put white text on orange, or use cobalt for anything that is not money or the account.
