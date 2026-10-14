---
name: Typecade
description: A monochrome arcade where one sentence becomes a playable game; the only colour comes from the games.
colors:
  ground: "#0b0b0c"
  ground-raised: "#121214"
  ground-well: "#19191c"
  code-well: "#050506"
  ink: "#f3f3f1"
  ink-bright: "#ffffff"
  ink-2: "#b4b4b9"
  ink-3: "#7d7d84"
  code-ink: "#d8d8dc"
  key-skirt: "#8d8d93"
  line: "rgba(243, 243, 241, 0.13)"
  line-2: "rgba(243, 243, 241, 0.3)"
  rec: "#ff3b30"
typography:
  display:
    fontFamily: "Pixelify Sans, ui-monospace, monospace"
    fontSize: "clamp(64px, 10.4vw, 168px)"
    fontWeight: 700
    lineHeight: 0.84
    letterSpacing: "0"
  headline:
    fontFamily: "Pixelify Sans, ui-monospace, monospace"
    fontSize: "clamp(40px, 6vw, 92px)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "0"
  title:
    fontFamily: "Pixelify Sans, ui-monospace, monospace"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: "Onest, system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Pixelify Sans, ui-monospace, monospace"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.04em"
  data:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "clamp(20px, 2.2vw, 30px)"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.02em"
    fontFeature: "tnum"
  code:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "12.5px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  badge: "6px"
  control: "8px"
  field: "10px"
  panel-inner: "12px"
  tile: "14px"
  make-field: "16px"
  stage: "20px"
  console: "22px"
  pill: "999px"
spacing:
  page-gutter: "clamp(16px, 4vw, 48px)"
  section: "clamp(56px, 8vw, 110px)"
  mosaic-gap-phone: "10px"
  mosaic-gap: "14px"
  control-gap: "8px"
  stack: "22px"
components:
  button-solid:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "42px"
  button-solid-hover:
    backgroundColor: "{colors.ink-bright}"
    textColor: "{colors.ground}"
  button-line:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "42px"
  button-small:
    padding: "0 12px"
    height: "36px"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    size: "42px"
  make-button:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.field}"
    padding: "0 20px"
  make-field:
    backgroundColor: "{colors.ground-raised}"
    textColor: "{colors.ink}"
    rounded: "{rounded.make-field}"
    padding: "8px"
  chip:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    padding: "7px 13px"
  search-field:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.field}"
    padding: "0 14px"
    height: "44px"
  badge-new:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.badge}"
    padding: "4px 8px"
  badge-starter:
    backgroundColor: "rgba(11, 11, 12, 0.78)"
    textColor: "{colors.ink}"
    rounded: "{rounded.badge}"
    padding: "4px 8px"
  game-tile:
    rounded: "{rounded.tile}"
  tab-on:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ground}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "36px"
  console:
    backgroundColor: "{colors.ground-raised}"
    rounded: "{rounded.console}"
    padding: "12px"
  code-well:
    backgroundColor: "{colors.code-well}"
    textColor: "{colors.code-ink}"
    typography: "{typography.code}"
    rounded: "{rounded.panel-inner}"
    padding: "14px 16px"
---

# Design System: Typecade

## Overview

**Creative North Star: "The Midnight Arcade Cabinet"**

Typecade is a near-black arcade cabinet with white ink, hairlines and halftone dots, where the games are the only lit, coloured thing in the room. Pixel type speaks in capitals (TYPE A GAME., THE ARCADE, PRESS ENTER TO PLAY), a calm grotesque explains, and a terminal mono carries numbers and code. The chrome stays monochrome and premium so that every thumbnail in the mosaic reads as a lit screen.

The pages are dense the way a games platform is dense. The mosaic runs edge to edge in Poki's rhythm of big and small rounded tiles, sections are separated by hairline rules rather than cards, and each surface has one white filled call to action. Depth comes from glass objects lit from a studio (the logo, the hero Enter key, the four move icons), from soft dark drop shadows under raised panels, and from the keycap's own travel when a press button goes down.

Motion feels like an arcade screen: headings scramble into place, the hero headline types itself key by key behind a blinking block cursor, the ticker scrolls, and new games pop into the mosaic. Reduced motion and `?still` settle everything at once.

**Key Characteristics:**
- Near-black ground, white ink, greys only; colour comes from game thumbnails and covers.
- Pixelify Sans capitals for display and buttons, Onest for prose, JetBrains Mono for data and code.
- Hairline borders (13% and 30% white) instead of filled cards.
- Clear glass objects with an inner core light on black, never a glow around them.
- A flush-closing mosaic of rounded tiles with real thumbnails.

## Colors

A monochrome ink-on-black palette with one functional red; the games supply all hue.

### Primary
- **Cabinet White** (ink): headlines, primary text, the filled buttons, the active tab, the NEW badge, the focus outline. It is the brand colour; filled white means "press this".
- **Bright White** (ink-bright): only the hover state of white filled buttons, one step brighter than ink.

### Tertiary
- **Record Red** (rec): the live recording dot in the console while a game is being written, and the edge of an error note (55% alpha border). It never decorates.

### Neutral
- **Cabinet Black** (ground): the page, the nav at 82% with a 12px blur, the intro.
- **Raised Black** (ground-raised): the create field, console, wallet popover, picker, contract-address bar.
- **Well Black** (ground-well): rows inside the wallet picker.
- **Code Black** (code-well) with **Code Grey** (code-ink): the streaming code panel and the intro's code card.
- **Fog Grey** (ink-2): sub copy, nav links at rest, chips, secondary lines.
- **Ash Grey** (ink-3): fine print, placeholders, table headers, disabled text, the "drag to tilt" hint.
- **Key Skirt Grey** (key-skirt): the visible under-edge of press buttons (see Elevation).
- **Hairline** (line) and **Hairline Strong** (line-2): borders, section rules, dotted rails, the halftone dots (ink at 50%).

### Named Rules
**The Games Are The Colour Rule.** The chrome is monochrome. Hue enters only through game thumbnails, covers, a tile's fallback tint derived from its id (hsl at 22% saturation, 16% lightness), and the games themselves. Never add an accent, gradient or candy colour to the chrome.

**The Red Means Live Rule.** Record Red marks a game being written right now, or an error. Nothing else is red.

## Typography

**Display Font:** Pixelify Sans (500, 600, 700; fallback ui-monospace)
**Body Font:** Onest (400 to 700; fallback system-ui)
**Data/Code Font:** JetBrains Mono (400, 500, 700; fallback ui-monospace)

**Character:** Pixel capitals give the press-start voice; Onest keeps the explanations calm and readable; JetBrains Mono makes every number and address look like a readout.

### Hierarchy
- **Display** (700, clamp(64px, 10.4vw, 168px), line-height 0.84): the hero headline only; on phones 21vw. Gate name, footer "PRESS ENTER TO PLAY" (clamp(46px, 9vw, 140px), 0.86) and game page titles (clamp(42px, 5vw, 76px), 0.92) are its siblings.
- **Headline** (700, clamp(40px, 6vw, 92px), line-height 0.9): section titles, set in capitals, often over two or three lines with `text-wrap: balance`.
- **Title** (700, 16px to 22px, line-height 1.1): tile names, the played-game title, the four moves (clamp(22px, 2.2vw, 28px)), FAQ terms.
- **Body** (400, 16px, line-height 1.55): prose in Onest, max 46 to 60ch; docs at 16.5px/1.7 in a 68ch column; the create field at 500 18px.
- **Label** (700, 15px, 0.04em to 0.08em tracking, capitals): every button, nav link (600 14px), tab (13px), badge (11px), ticker (600 15px, 0.08em).
- **Data** (JetBrains Mono 700, tabular, -0.02em): pool size, countdown, stats, percentages, ranks and like counts.
- **Code** (JetBrains Mono 400, 12.5px, line-height 1.6): the streaming code, fine print, wallet addresses.

### Named Rules
**The Tabular Numbers Rule.** Any numeral that carries data is JetBrains Mono, tabular, never Pixelify. Pixelify's 2 and 5 read as S at small sizes.

**The No Collision Rule.** No glyph may touch the line below it. Display and headline run tight (0.84 to 0.9) only because they are pixel capitals; any multi-line heading with a dollar sign, comma or descender is checked for ink overlap before it ships (users/tools/inkcheck.mjs), and loosened if it touches.

**The No Kicker Rule.** No eyebrow or kicker label sits above a heading. A heading stands alone; context goes in the sub line under it.

## Layout

The page is a stack of full-width sections, each with the page gutter clamp(16px, 4vw, 48px) left and right, clamp(56px, 8vw, 110px) vertical padding, and a hairline rule at the bottom. The nav is sticky (12px padding, 24px gaps). The hero is a two-column grid (1.08fr text, 1fr stage) filling the first viewport above the ticker; the stage is clamp(360px, 62vh, 640px) high and becomes the console, then the game, in place (a 480ms view transition named stage).

Two-column content sections (leaderboard, coin) split about 1:1 with clamp(28px, 5vw, 80px) gaps. The game page is 1.45fr stage, 0.75fr info (min 320px). Docs are Read mode: a 240px sticky contents rail and a 68ch body inside 1240px.

**The mosaic.** A container-queried grid of square cells: 2 columns (gap 10px), 4 from 560px (gap 14px), 6 from 1000px, 8 from 1500px. Columns come in 2-wide blocks; each block holds one big tile, a wide tile over two small ones, two wide tiles, or four small ones, following a repeating band pattern per column count. Tile areas are computed in components/mosaic.js and passed as custom properties.

**The Flush Mosaic Rule.** Every mosaic row closes flush, at every column count and every game count. Never place tiles by hand or with auto-flow; always go through `tilePlaces(n)`.

**Breakpoints.** 1100px hides the nav links and stacks the game page; 820px stacks the hero (stage 190px), coin, leaderboard, open source, docs, and turns the four moves into a vertical rail; 600px tightens nav and buttons (40px), stacks the create field and sets the game stage to 3:4.

## Elevation & Depth

Surfaces are flat and separated by hairlines. Depth comes from three things only: soft, dark, downward drop shadows under panels that float above the page (console, game stage, popovers, hovered tiles); the grey under-edge of keycap-like press buttons; and studio-lit glass objects.

### Shadow Vocabulary
- **Popover** (`0 24px 50px -12px rgba(0,0,0,0.8)`): wallet popover.
- **Console** (`0 40px 80px -30px rgba(0,0,0,0.9)`): the hero console and intro game card.
- **Stage** (`0 50px 90px -40px rgba(0,0,0,0.95)`): the game page stage.
- **Tile lift** (`0 22px 40px -18px rgba(0,0,0,0.9)`): a hovered or focused game tile, which also rises 4px and tilts toward the pointer.
- **Key travel** (`0 5px 0 #8d8d93`, pressed `0 1px 0` with translateY(4px)): the create button; 6 to 7px on the big PLAY and ENTER buttons.

### Named Rules
**The Key Travel Rule.** Only buttons that act as the Enter key (make, play, enter) carry a grey under-edge, straight down, and it collapses when pressed. It is a keycap's skirt, not a decorative offset shadow: never diagonal, never black, never on ordinary buttons or cards.

**The Light Stays Inside Rule.** No glow, halo or coloured light ever spreads beyond an object's edge. Light lives inside things: the core light inside glass, the pointer sheen clipped inside a tile (white at 22%), the halftone dot cloud behind the key. Shadows below objects are black.

**The Clear Glass Rule.** Glass icons (the logo controller and the four move icons in public/moves/) use the logo's material: water-clear glass (transmission 1, roughness 0.05, ior 1.45) with a soft inner core light (about 0.6 grey) and black ink, lit by the shared studio environment (components/studio.js) on the page's black. Render new icons through tools/glass/icons.html.

## Shapes

Gently rounded rectangles throughout, with radius growing with the object's size: badges 6px, buttons, tabs and icon buttons 8px, fields and address bars 10px, inner panels and the fee bar 12px, game tiles 14px, the create field 16px, game stage 20px, console 22px. Chips are full pills. The logo image is rounded 8px small and 22px large. Pixel steps live in the type and in square details: the ticker's 7px square separators, the block cursor, the gate's segmented loading bar, dotted rails (6px dash, 8px gap) between the four moves. Line icons are one family: 24px grid, 2px stroke, round caps and joins.

## Components

### Buttons
- **Shape:** gently rounded (8px), 42px high, 16px horizontal padding, pixel label in capitals.
- **Solid:** white fill, black label; the one primary action per surface (BUY $TYPECADE, PLAY, MAKE A GAME). Hover lifts 2px and goes to bright white. A disabled solid becomes transparent with an ash label and a hairline inset.
- **Line:** transparent with a strong hairline; hover lifts 2px and the border turns white. A pressed like button inverts to white.
- **Small:** 36px high, 12px padding, 13px label; in the console's action row.
- **Icon button:** 42px square, hairline border, white border on hover.
- **Make button:** the Enter key of the page. White, 16px pixel label, key-travel under-edge that collapses on press; disabled goes dark grey with a dark skirt.

### Chips
- **Style:** transparent pills with a hairline, Onest 13.5px in fog grey; hover turns border and text white. Used for example ideas under the create field.

### Cards / Containers
- **Game tile:** 14px radius, hairline border, the thumbnail covering the tile (square art, a 16:10 cover when the tile is wider than 3:2), a black-to-transparent label scrim at the bottom with the title in pixel type and, on tiles at least 300px square, the prompt in quotes. Badges top left (NEW white, STARTER dark glass with a strong hairline), likes top right in mono. Hover: white border, 4px rise, pointer tilt, image scale 1.05, sheen.
- **Console:** raised black, 22px radius, strong hairline; head row with the red recording dot, a WRITING tag, the prompt and a seconds counter; a code well below.
- **Panels:** popover, picker and notes are raised black with hairlines; no filled grey cards on the page.

### Inputs / Fields
- **Create field:** raised black, 16px radius, strong hairline, 8px inset holding a textarea (Onest 500 18px) and the make button. Focus: border turns white plus a 4px ring of white at 8%. Placeholder ideas type themselves while idle.
- **Search:** 44px, 10px radius, strong hairline, icon in fog grey; focus turns border and icon white.

### Navigation
- Sticky bar on 82% black with a 12px backdrop blur and a hairline bottom. Logo and TYPECADE wordmark (pixel 19px), section links in pixel 14px fog grey turning white on hover, then the X icon button, the wallet line button, and the solid BUY button. Links hide below 1100px; the wordmark hides below 600px.

### Tabs
- A hairline-framed strip with 5px inset; tabs are 36px pixel labels; the active tab is filled white.

### Hi-score Table
- Ten rows always; open places stay as dashes in ash grey. Rank and score columns in tabular mono, the game name in pixel type with a mono sub line; the top three ranks in white.

### Fee Bar
- One bar split by the real fee weights, monochrome: white with fine grey stripes for the developer, mid grey stripes for the AI tank, black with a white inset line for the prize pool. It grows in from the left when it scrolls into view.

### PRESS START Gate and Film
- A full-screen black opener: the glass logo bobbing, the wordmark, a segmented loading bar with a mono percentage, a blinking PRESS START outline button, then a 15.6s seven-scene film with SOUND and SKIP controls. Once per session; skipped under reduced motion.

## Do's and Don'ts

### Do:
- **Do** keep the chrome in ink, greys and hairlines on Cabinet Black, and let thumbnails and covers carry all colour.
- **Do** set every data numeral in JetBrains Mono, bold and tabular.
- **Do** lay out every mosaic through `tilePlaces(n)` so each row closes flush at 2, 4, 6 and 8 columns.
- **Do** give each surface one white solid button for its main action; everything else is a line button.
- **Do** render new icons and hero objects in the logo's clear glass with an inner core light, on black.
- **Do** capture game pictures from the game's own `#cover` still (tools/thumbs.mjs), never drawn or generated art.
- **Do** write all site copy in English.
- **Do** let every animation settle instantly under reduced motion and `?still`.

### Don't:
- **Don't** add an accent colour, gradient, neon or candy colour to the chrome.
- **Don't** put glow, halo or coloured light around any object, text or button.
- **Don't** put kicker or eyebrow labels above headings.
- **Don't** set numbers that carry data in Pixelify Sans.
- **Don't** let any glyph touch the next line, including dollar signs and commas in tight pixel headings.
- **Don't** give ordinary buttons, cards or tiles an offset shadow; key travel belongs only to Enter-key buttons.
- **Don't** use red for anything other than live recording or an error.
