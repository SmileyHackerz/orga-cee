---
name: Orga
description: The council's calm control room for the Commission Organisation du CEE ESP.
colors:
  stone: "#ede9e1"
  stone-2: "#e3ded3"
  stone-3: "#d8d2c4"
  paper: "#f8f6f1"
  paper-2: "#fdfcf9"
  logo-white: "#ffffff"
  ink: "#0c0b09"
  ink-2: "#181612"
  ink-3: "#26231d"
  text: "#16140f"
  mute: "#635d52"
  mute-2: "#8b8475"
  on-ink: "#ede9e1"
  on-ink-mute: "rgba(237, 233, 225, 0.62)"
  gold: "#c9a13b"
  gold-hi: "#e6c66a"
  gold-deep: "#7d5e10"
  gold-wash: "rgba(201, 161, 59, 0.14)"
  red: "#c7361b"
  red-soft: "#f6ddd5"
  red-ink: "#5f1a0c"
  line: "rgba(12, 11, 9, 0.11)"
  line-2: "rgba(12, 11, 9, 0.2)"
  line-ink: "rgba(237, 233, 225, 0.11)"
typography:
  display:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(34px, 4.2vw, 56px)"
    fontWeight: 820
    lineHeight: 0.95
    letterSpacing: "-0.025em"
    fontVariation: "'wdth' 120"
  figure:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "38px"
    fontWeight: 820
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 118"
    fontFeature: "'tnum' 1"
  headline:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1.02
    letterSpacing: "-0.02em"
    fontVariation: "'wdth' 116"
  title:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 740
    lineHeight: 1.3
    letterSpacing: "-0.01em"
    fontVariation: "'wdth' 108"
  row-title:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "14.5px"
    fontWeight: 620
    lineHeight: 1.3
  body:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.5
  meta:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "'Archivo Variable', 'Archivo', ui-sans-serif, system-ui, sans-serif"
    fontSize: "10.5px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.14em"
rounded:
  tag: "4px"
  sm: "8px"
  row: "9px"
  md: "12px"
  lg: "16px"
  full: "999px"
spacing:
  gap-xs: "6px"
  gap-sm: "10px"
  gap-md: "14px"
  gap-lg: "16px"
  section: "24px"
  card: "22px 24px 24px"
  page-gutter: "clamp(16px, 3vw, 44px)"
components:
  button-solid:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "40px"
  button-solid-hover:
    backgroundColor: "{colors.ink-3}"
    textColor: "{colors.on-ink}"
  button-line:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
    height: "40px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.mute}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "32px"
  button-danger:
    backgroundColor: "{colors.red}"
    textColor: "{colors.logo-white}"
    rounded: "{rounded.sm}"
    padding: "0 12px"
    height: "32px"
  input:
    backgroundColor: "{colors.paper-2}"
    textColor: "{colors.text}"
    rounded: "{rounded.sm}"
    padding: "9px 12px"
    height: "42px"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "{spacing.card}"
  kpi-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.md}"
    padding: "18px 20px"
  pole-tag:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.tag}"
    padding: "0 6px"
    height: "20px"
  pill-red:
    backgroundColor: "{colors.red-soft}"
    textColor: "{colors.red}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "25px"
  pill-gold:
    backgroundColor: "{colors.gold-wash}"
    textColor: "{colors.gold-deep}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "25px"
  pill-ok:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.full}"
    padding: "0 10px"
    height: "25px"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.on-ink-mute}"
    rounded: "{rounded.row}"
    padding: "10px 12px"
  nav-link-active:
    backgroundColor: "{colors.gold-wash}"
    textColor: "{colors.gold-hi}"
  brand-mark:
    backgroundColor: "{colors.logo-white}"
    rounded: "10px"
    size: "44px"
  toast:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.on-ink}"
    rounded: "{rounded.full}"
    padding: "11px 16px"
---

# Design System: Orga

## Overview

**Creative North Star: "The Council's Control Room"**

Orga is a category-standard classic dashboard, chosen by the user over six alternatives: a fixed ink sidebar, a stone work floor, paper cards held by hairlines, and a first screen that states the Commission's condition in three figures. It refuses the widget wall. The overview carries broad lines only; detail sits one click deeper in a drawer or a pole page, and sensitive data (who paid, private items) lives only in each pole's admin space. Public pages read only rows a pole has published.

The palette is the Orga logo's own: black, gold, white. Black becomes the ink of the sidebar, the next-meeting card and every "done" state; gold is spent on what comes next and what is selected; the warm stone and paper neutrals carry everything else. Red exists for lateness, problems and destructive confirmation, nothing more. Ordinary states are never decorated: they read as quiet grey text.

Type is one family, Archivo, used as a variable font whose width axis does the hierarchy work: titles and figures widen to 106–125% and grow heavy, running text stays at normal width. Density is moderate and phone-first; the same shell collapses to an ink top bar with a slide-in sidebar below 1024px.

**Key Characteristics:**
- Ink sidebar (264px) beside a stone work floor; paper cards outlined by 1px hairlines, not shadows.
- Logo colours only: ink, gold, and the white of the logo's own tile.
- Status colour for exceptions; neutral states are quiet text.
- Widened Archivo for titles and figures; tabular numerals on every figure, date and amount.
- Progressive disclosure: rows open drawers, cards link onward, nothing sensitive on shared views.
- Motion is one ease (`cubic-bezier(0.16, 1, 0.3, 1)`), springs for toggles and drawers, and all of it collapses under reduced motion.

## Colors

A warm-neutral ground with two voices taken from the Orga logo: ink for weight and gold for "next". Red appears only when something is wrong.

### Primary
- **Logo Ink** (ink): the sidebar and mobile top bar, the next-meeting card, solid buttons, pole tags, "ready/paid/done" states (the `ok` pill, paid cells, checked boxes, ready calendar chips), the active tab underline, toasts. Its two lifts, **Ink Raised** (ink-2) for the member card and **Ink Hover** (ink-3) for solid-button hover and keycaps, stay inside the ink world.

### Secondary
- **Orga Gold** (gold): the focus ring, the cotisation meter and bars, the "next" outline on calendar chips, the current-month marker, the supervisor access badge.
- **Lit Gold** (gold-hi): gold on ink. Active nav text, the dark card's label and countdown, checkmarks and knob on dark, text selection.
- **Deep Gold** (gold-deep): gold on light ground where legibility needs it: "soon" due dates, the "Prochaine" flag, pinned items, ordinal numbers in agendas and registers, the input caret.
- **Gold Wash** (gold-wash): the active nav background, the "next" activity row, "soon" alert lines, the input focus halo.

### Tertiary
- **Alarm Red** (red): late due dates, problem calendar chips, the late-count figure, absent dots, nav badges, destructive buttons, form errors, error toasts.
- **Red Wash** (red-soft) with **Red Ink** (red-ink) text: late alert lines and open incidents.

### Neutral
- **Stone** (stone): the page ground behind everything; also the text colour on ink (on-ink).
- **Stone Shade** (stone-2): segmented tracks, kanban columns, the demo bar, read-only bars, empty meter tracks, closed incidents.
- **Stone Deep** (stone-3): the off toggle track, "in preparation" month cells, scrollbar thumbs.
- **Paper** (paper): card, drawer and palette surfaces.
- **Bright Paper** (paper-2): inputs, nested tiles inside cards, row hover, drawer footers, the segmented thumb.
- **Logo White** (logo-white): the tile behind the Orga logo, and text on red.
- **Text** (text): all primary copy. **Mute** (mute) for secondary copy, labels and quiet statuses; **Mute Light** (mute-2) for placeholders, dimmed figures and past months only.
- **Hairline** (line), **Firm Hairline** (line-2), **Ink Hairline** (line-ink): row dividers and card outlines; table heads, input and line-button outlines; dividers on ink.

### Named Rules
**The Exceptions-Only Rule.** Colour marks attention, never routine. The Pill component renders `neutral` and `muted` tones as quiet grey text; only `red` (late, problem), `gold` (next, soon), and `ink`/`ok` (ready, done) get a filled pill.

**The Gold Means Next Rule.** Gold is spent on what is next, soon, active or selected. It is never a decorative fill for a section or a card.

**The Logo Tile Rule.** The Orga logo always sits on its own white tile (44px, 10px radius in the sidebar; a 20px-radius plate on login), because the user asked to keep the logo's original white background. Never place the logo directly on ink or stone.

## Typography

**Display Font:** Archivo Variable (with Archivo, ui-sans-serif, system-ui)
**Body Font:** Archivo Variable (same family)

**Character:** One grotesque carrying two registers through its width axis: widened and heavy for titles, figures and the wordmark; normal width for reading and controls.

### Hierarchy
- **Display** (820, clamp(34px, 4.2vw, 56px), 0.95, width 120%): page titles ("Vue commune", pole names). The login wordmark pushes the same voice to 900 and width 125%.
- **Figure** (820, 38px, 1, width 118%, tabular): KPI numbers. The dark card's date uses the same voice at 30px; countdown digits at 22–36px.
- **Headline** (800, 26px, 1.02, width 116%): drawer titles and the meeting banner heading (clamp to 42px).
- **Title** (740, 17px, width 108%): card titles, pole strip names, feed titles.
- **Row Title** (620, 14.5px, 1.3): list rows, table strong cells, palette items.
- **Body** (400, 15px, 1.5): running text; long prose (PV, feed) at line-height 1.6–1.65 capped at 68–78ch.
- **Meta** (400, 13px): row subtitles, due dates, legends, in mute.
- **Label** (700, 10.5px, 0.14em, uppercase): data labels only: KPI labels, table and grid heads, fact names, palette groups, kanban heads.

### Named Rules
**The Width-Is-Hierarchy Rule.** Rank is expressed by widening (106–125%) and weight (720–900), not by a second family. Body text never widens.

**The Tabular Figures Rule.** Every count, amount, date and countdown uses tabular numerals so figures do not jitter as they animate.

## Layout

A two-column app frame: a sticky 264px ink sidebar and a fluid main column. Pages pad `30px` top and `72px` bottom with a `clamp(16px, 3vw, 44px)` side gutter, capped at 1480px wide. Page heads sit title-left, actions-right, 26px above content.

The dashboard runs a KPI row (1.3fr 1fr 1fr, the dark card widest) and below it a 1.5fr / 1fr two-card grid, all at a 16px gap. Pole pages use 1.6fr / 1fr and 1fr / 1fr grids and vertical stacks at 14px. Card internals use 10–16px gaps.

Breakpoints are set in the build at 1200px (KPIs to two columns), 1100px (all two-column grids stack), 1023px (sidebar becomes an ink top bar plus a slide-in sheet, `min(86vw, 320px)`), 860px (login stacks), 720px (single column; activity rows drop pole tag and chevron; tables become wrapped rows; card padding drops to 16px), and 560px (forms to one column). Overflowing segmented filters and tabs scroll horizontally behind a fade mask.

## Elevation & Depth

Depth is tonal and hairline-led. Resting surfaces are flat: paper on stone, outlined by a 1px inset hairline. Shadows are reserved for three cases: the ink next-meeting card, surfaces that float over the page (drawer, palette, toast, login plate), and a lift on hover for clickable tiles.

### Shadow Vocabulary
- **Hover lift** (`box-shadow: 0 1px 2px rgba(12,11,9,0.05), 0 10px 30px -18px rgba(12,11,9,0.28)`): added with a -2px translate to calendar chips, progress cards and profile cards on hover.
- **Ink card** (`box-shadow: 0 20px 40px -26px rgba(12,11,9,0.7)`): the dark next-meeting KPI only.
- **Drawer** (`box-shadow: 0 30px 80px -30px rgba(12,11,9,0.5)`) and **Palette** (`0 40px 90px -30px rgba(12,11,9,0.55)` plus hairline): floating panels over a 38% ink scrim with a 2px blur.
- **Toast** (`box-shadow: 0 16px 40px -16px rgba(12,11,9,0.6)`).

### Named Rules
**The Hairline-Not-Shadow Rule.** A resting card is defined by its 1px inset hairline, never by a drop shadow. Shadows answer hover or floating, and the ink card is the one resting exception.

## Shapes

Softly rounded, never pill-shaped except where the element is a status or a toast. Pole tags and badges 4px; buttons, inputs and grid cells 8px; rows, nav links and calendar chips 9px; incidents and alert lines 10px; cards, KPI tiles, tile grids and settings rows 12px; drawers, the palette and the meeting banner 16px. Pills, toggles, toasts and nav badges are fully round. Outlines are drawn as inset box-shadows (1px, 1.5px on emphasis) so they never shift layout.

## Components

### Buttons
Compact and matter-of-fact.
- **Shape:** gently rounded (8px), 40px tall (medium) or 32px (small), weight 620.
- **Solid:** ink with stone text; the primary page action ("Ordre du jour"). Hover lifts to Ink Hover.
- **Line:** Bright Paper with a Firm Hairline; hover darkens the outline to ink. The default.
- **Ghost:** mute text, hover to text with a 5% ink wash.
- **Danger:** red with white text; appears only as the armed state of a two-step delete ("Confirmer la suppression"), which disarms after 3.5s.
- **Press:** every button scales to 0.97 on press. Disabled at 45% opacity.

### Status: Pills and Quiet Text
- **Quiet status:** 12.5px, 560, mute; used for every neutral or muted state.
- **Pills:** 25px, fully round, 6px leading dot in currentColor. Red (Red Wash, dark red text), gold (Gold Wash, Deep Gold text, gold hairline), ink/ok (ink, stone text, gold dot). They fade and scale in from 0.92 when a state changes.
- **Due text:** mute by default, Deep Gold 650 when soon, red 700 when late.

### Pole Tags
Small ink tags (20px tall, 4px radius, 9.5px 800 with 0.12em tracking) carrying the pole code. Ink by default, gold for emphasis, hairline-outlined in lists. Omitted where the pole is implied (activities belong to Logistique).

### Cards / Containers
- **Corner Style:** 12px.
- **Background:** Paper on stone; nested tiles in Bright Paper.
- **Shadow Strategy:** hairline only (see Elevation).
- **Internal Padding:** 22px 24px 24px, 16px on phones. Head row: Title left, a quiet "link-more" (13px, mute, arrow that widens its gap on hover) right.

### KPI Tiles
Paper tiles with a Label, a Figure that counts up on load, and a mute sub-line. The alert variant turns only the figure red. The dark variant is the next-meeting card: ink, Lit Gold label, a widened date, and a live countdown whose digits roll vertically; its arrow nudges up-right on hover.

### Rows and Lists
Rows are separated by hairlines and bleed 10px into the card padding so hover (Bright Paper plus hairline ring, 9px radius) reads as a lifted strip. Clickable rows end with a chevron that shifts 3px on hover and open a right-hand drawer. The "next" activity row carries the Gold Wash.

### Inputs / Fields
- **Style:** Bright Paper, 8px radius, 42px min height, inset Firm Hairline; field labels 12.5px 650 above.
- **Hover:** outline darkens to Mute Light.
- **Focus:** 1.5px ink inset plus a 4px Gold Wash halo. Global focus-visible elsewhere is a 2px gold outline, 2px offset.
- **Error:** red 13px 600 line under the form.

### Controls
- **Segmented:** Stone Shade track, 10px radius, with a Bright Paper thumb that springs between options; counts in 11px tabular mute.
- **Visibility toggle:** 40px track, stone when private, ink when published with a Lit Gold knob holding an eye icon; always labelled "Affiché" / "Privé".
- **Checkbox:** 22px, 6px radius, hairline; checked fills ink with a gold check that springs in.
- **Private badge:** uppercase 10.5px mute text on a faint diagonal hatch; marks items only the pole and supervisors can see.

### Navigation
Ink sidebar: white logo tile and widened letter-spaced wordmark, a search button with a keycap hint, grouped links (14px 520, on-ink-mute, 9px radius). Hover brightens to on-ink; active turns Lit Gold over a Gold Wash with a faint gold ring, and the pole code turns gold. Red count badges flag late items. The member card sits at the bottom on Ink Raised with a gold access badge (supervisors) or an outlined one. Below 1024px the sidebar becomes a sticky ink top bar and a slide-in sheet over a 50% scrim. Admin tabs use a 2px ink underline that slides between tabs.

### Drawer
The detail layer. A Paper panel inset 8px from the right edge (560px, wide 760px), 16px radius, springing in from the right; head with a Headline and close button, scrolling body whose content rises in after 120ms, Bright Paper footer. Facts sit in a hairline grid of label and value cells.

### Command Palette
Paper panel (620px, 16px radius) at 12vh with a 17px input; the active item is marked by an ink cursor that glides between rows, with the hint turning Lit Gold.

### Toasts
Ink capsules centred at the bottom, a Lit Gold check icon; errors turn red. Three at most, auto-dismissed after 3.2s.

## Do's and Don'ts

### Do:
- **Do** keep every colour inside the Orga logo's palette: ink, gold, and white, over the warm stone and paper neutrals.
- **Do** render ordinary states through the Pill component's quiet text; reserve filled pills for red (late, problem), gold (next, soon) and ink (ready, done).
- **Do** show the Orga logo on its white tile everywhere it appears.
- **Do** outline resting cards with a 1px inset hairline (line) at 12px radius on Paper.
- **Do** widen Archivo (106–125%) and weight it (720–900) for titles and figures; keep body text at normal width.
- **Do** use tabular numerals for every count, amount, date and countdown.
- **Do** keep shared views to published rows and broad lines; put detail in a drawer or pole page, and sensitive data in the pole's admin space.
- **Do** animate with the single ease `cubic-bezier(0.16, 1, 0.3, 1)` and honour reduced motion.

### Don't:
- **Don't** give neutral or muted states a filled pill or a colour.
- **Don't** use gold as a decorative fill; it means next, soon, active or selected.
- **Don't** use red for anything but lateness, problems, errors and confirmed destruction.
- **Don't** put the Orga logo directly on ink or stone, or recolour it.
- **Don't** add a drop shadow to a resting paper card; shadows are for hover, floating layers and the one ink card.
- **Don't** introduce a second type family; hierarchy comes from Archivo's width and weight.
- **Don't** surface cotisation payers, private items or other admin-only detail on the Vue commune or pole pages.
