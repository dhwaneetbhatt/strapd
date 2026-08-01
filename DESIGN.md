---
name: strapd
description: A dependable offline developer utility belt for terminal and web workflows.
colors:
  editor-blue: "#0ea5e9"
  focus-blue: "#007acc"
  workbench-gray: "#f3f3f3"
  panel-white: "#ffffff"
  muted-panel: "#f8f8f8"
  border-gray: "#e5e5e5"
  ink: "#1f1f1f"
  dark-workbench: "#1e1e1e"
  dark-panel: "#2d2d30"
  dark-ink: "#e6e6e6"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontWeight: 700
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
  mono:
    fontFamily: "JetBrains Mono, SF Mono, Monaco, Consolas, monospace"
    fontSize: "0.875rem"
rounded:
  sm: "0.25rem"
  base: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
spacing:
  4: "1rem"
  4-5: "1.125rem"
  5-5: "1.375rem"
  6: "1.5rem"
  8: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.editor-blue}"
    textColor: "{colors.panel-white}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-copy:
    backgroundColor: "transparent"
    textColor: "#4a5568"
    rounded: "{rounded.md}"
    height: "1.5rem"
  tool-card:
    backgroundColor: "{colors.muted-panel}"
    rounded: "{rounded.md}"
    padding: "1.5rem"
  tool-input:
    backgroundColor: "{colors.panel-white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
---

# Design System: strapd

## Overview

**Creative North Star: "The Dependable Codebench"**

strapd is a calm, familiar developer workspace: a VS Code-inspired workbench where practical utility takes priority over spectacle. Light and dark modes use neutral gray planes, restrained borders, and a single clear blue signal for the actions and states that need attention.

The interface is compact but not cramped. Inter keeps navigation and explanatory copy readable, while JetBrains Mono gives input, output, and data handling the texture of a real developer tool. Every visual decision should make repetitive micro-tasks feel predictable, local, and quick.

**Key Characteristics:**

- Familiar editor-like neutral surfaces in both color modes.
- One reliable blue accent for focus, selection, and primary action.
- Monospace fields for data; clean sans-serif UI for orientation and controls.
- Flat operational surfaces that lift only to communicate interaction or persistent structure.

## Colors

The palette behaves like an editor workbench: neutral backgrounds carry the interface while Editor Blue communicates the active path.

### Primary

- **Editor Blue:** the brand action color for primary controls and emphasis.
- **Focus Blue:** the stronger keyboard-focus and active-selection signal.

### Neutral

- **Workbench Gray:** the light-mode application canvas, header, and sidebar surface.
- **Panel White:** the light-mode raised surface for forms, search, and output.
- **Muted Panel:** a subtly separated light-mode tool and card surface.
- **Border Gray:** quiet division between work areas.
- **Ink:** high-legibility light-mode text.
- **Dark Workbench:** the dark-mode application canvas.
- **Dark Panel:** dark-mode raised forms, sidebar, and header surfaces.
- **Dark Ink:** high-legibility dark-mode text.

**The One Signal Rule.** Use blue to identify focus, selection, primary action, and product navigation—not as a decorative fill across every surface.

## Typography

**Display Font:** Inter (with system sans-serif fallbacks)
**Body Font:** Inter (with system sans-serif fallbacks)
**Label/Mono Font:** JetBrains Mono (with SF Mono, Monaco, and Consolas fallbacks)

**Character:** Inter gives the surrounding workspace a clear, contemporary UI voice. JetBrains Mono is reserved for developer data: text inputs, textareas, placeholders, and generated output.

### Hierarchy

- **Display** (700 weight): page-level product and tool headings.
- **Title** (Chakra heading sizes, commonly `lg` and `2xl`): tool names, section titles, and high-level orientation.
- **Body** (default Inter body sizing): descriptions and supporting guidance.
- **Label** (small to medium Inter sizing): controls, navigation, keyboard hints, and metadata.
- **Mono** (0.875rem): editable source text, transformed results, and machine-readable values.

**The Data Texture Rule.** Keep interface labels and explanations in Inter; reserve monospace typography for content a developer might inspect, paste, transform, or pipe.

## Layout

The application uses a sticky full-width header, optional responsive sidebar, and a centered workspace. Tool discovery begins with a responsive grid: one column on small screens, two at small breakpoints, three at medium, and four at large. Individual tool views use a generous vertical rhythm (`1.5rem` gaps are common) and constrain content within broad centered containers.

On narrow screens, navigation becomes a toggleable sidebar and the mobile menu control remains directly reachable. Tool regions are sized to fill the viewport below the header while allowing input and output areas to scroll and resize naturally.

## Elevation & Depth

Depth is flat by default. Separation comes from tonal layers—Workbench Gray, Panel White, and Muted Panel—and quiet one-pixel borders. Shadows are reserved for persistent chrome and explicit interaction: the sticky header uses a small shadow, while tool cards lift on hover with a subtle `0 4px 12px rgba(0, 0, 0, 0.1)` shadow and a short upward translation.

**The Earned Lift Rule.** A surface earns elevation only when it is sticky, hovered, or otherwise actively inviting interaction.

## Shapes

The form language uses practical, gently rounded rectangles rather than sharp terminal panes or highly pill-shaped consumer UI. Controls and cards most often use the medium radius (0.5rem); larger feature cards use the large radius (0.75rem). Borders are thin and neutral; selected sidebar items gain a precise 2px blue left edge rather than a heavy container treatment.

## Components

### Buttons

Quiet, direct controls with the blue solid variant serving as the primary action. The copy variant is deliberately lightweight: transparent at rest, compact, and responsive to hover/active tint. Action icon buttons remove visual weight until state requires it.

- **Primary:** Editor Blue fill with white text and medium-rounded geometry.
- **Hover / Focus:** focus is communicated with Focus Blue; interactive surfaces may gain a light neutral tint rather than a second accent color.
- **Copy / Action:** transparent background, compact sizing, and subdued gray text at rest.

### Inputs / Fields

Inputs and textareas are white in light mode and Dark Panel in dark mode. They use medium corners, quiet borders, monospace text, and a clear Focus Blue border on focus. Tool textareas preserve a generous, resizable working area rather than collapsing to a single-line control.

### Cards / Containers

Tool cards use a Muted Panel background, one-pixel Border Gray stroke, medium corners, and generous internal padding. They stay flat at rest and lift on hover to indicate clickability.

### Navigation

The header is a sticky Workbench Gray or Dark Panel bar with a bottom divider and small shadow. The sidebar uses grouped ghost buttons; selected tools use a pale blue background in light mode or deep blue in dark mode, reinforced by the Focus Blue left border. Keyboard shortcut keys use compact gray keycaps.

### Search

Search is a compact, read-only launcher field rather than a conventional text entry. It uses a left search icon, compact keyboard shortcut keycaps, Panel White, a quiet border, and a Focus Blue outline when activated.

## Do's and Don'ts

### Do:

- **Do** use neutral layered surfaces and thin borders to organize operational space.
- **Do** make keyboard focus unmistakable with Focus Blue.
- **Do** use JetBrains Mono for input, output, placeholders, and values under transformation.
- **Do** keep interactive movement brief and restrained, such as the existing small card lift on hover.

### Don't:

- **Don't** spread the blue accent across backgrounds that do not convey action, focus, or selection.
- **Don't** introduce heavy shadows, glossy effects, or decorative gradients into tool workflows.
- **Don't** use monospace as the default for navigation, explanations, or broad page copy.
- **Don't** hide essential navigation or fast actions behind pointer-only interactions.
