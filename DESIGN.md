---
name: Production OS Design System
description: Premium Cinematic tool interface for film and video production management
colors:
  primary: "#cca43b"
  primary-hover: "#dec61b"
  neutral-bg: "#faf7f2"
  neutral-bg-dark: "#0a0a0a"
  neutral-surface-dark: "#121212"
  neutral-border-dark: "#1e1e1e"
  neutral-text-dark: "#e2e8f0"
  neutral-text-light: "#0f172a"
typography:
  display:
    fontFamily: "Outfit, 'Noto Sans Thai', sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Outfit, 'Noto Sans Thai', sans-serif"
    fontSize: "clamp(1.5rem, 3.5vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Outfit, 'Noto Sans Thai', sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Inter, 'Noto Sans Thai', sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, 'Noto Sans Thai', sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.05em"
rounded:
  sm: "6px"
  md: "10px"
  lg: "16px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  card:
    backgroundColor: "{colors.neutral-surface-dark}"
    rounded: "{rounded.md}"
    padding: "24px"
---

# Design System: Production OS

## 1. Overview

**Creative North Star: "The Director's Suite"**

Production OS is modeled after professional editing suites, color-grading environments, and high-end camera rigs. It is a premium, cinematic tool designed for production managers, coordinators, directors, and crew. It rejects standard corporate blues, light grey-on-white tables, and generic SaaS layouts. Instead, it embraces a high-contrast dark mode as the default experience, complemented by subtle, premium gold accents and highly legible typography.

The interface prioritizes utility and speed on set and in the production office. Every view is built to minimize cognitive load, allowing users to rapidly find schedule details, breakdowns, and crew contact info.

**Key Characteristics:**
- **Cinematic Depth**: Dark Obsidian surfaces contrasted with gold accents and crisp typography.
- **On-Set Readability**: Default dark mode optimized for low-light environments and variable tablet displays.
- **Tactile Density**: Compact spacing and crisp borders representing specialized production gear controls.

## 2. Colors

A premium, cinematic palette consisting of deep obsidian greys and a rich, muted gold accent.

### Primary
- **Muted Gold** (#cca43b): The signature brand accent. Used sparingly for active states, key CTAs, and focal indicators.
- **Bright Gold** (#dec61b): Used for hover and interactive focus states to enhance contrast.

### Neutral
- **Obsidian Dark Background** (#0a0a0a): The default canvas. Deep and immersive.
- **Obsidian Surface** (#121212): Used for cards, panels, and sidebars to establish layering.
- **Obsidian Border** (#1e1e1e): Crisp, thin dividers.
- **Ink Light** (#faf7f2 / #ffffff): Primary text color in light mode.
- **Slate Text** (#e2e8f0): Primary text color in dark mode.

### Named Rules
**The 10% Gold Rule.** Gold is a premium accent. It must never occupy more than 10% of any screen surface. If it screams, it's not cinematic.
**The Absolute Contrast Rule.** Text contrast must hit at least 4.5:1 against its background. Neutral text in dark mode should be Slate Text (#e2e8f0) or White, never dark grey.

## 3. Typography

**Display Font:** Outfit
**Body Font:** Inter
**Thai Fallback:** Noto Sans Thai

### Hierarchy
- **Display** (Bold 800, clamp(2rem, 5vw, 3.5rem), 1.15): Used for main page headers and dashboard metrics.
- **Headline** (Bold 700, clamp(1.5rem, 3.5vw, 2.25rem), 1.2): Used for sections and modal titles.
- **Title** (Semi-bold 600, 1.25rem, 1.3): Used for subheadings and card headers.
- **Body** (Regular 400, 0.875rem, 1.5): Used for paragraph text, lists, and data cells.
- **Label** (Semi-bold 600, 0.75rem, tracking-wider uppercase): Used for eyebrows, table column headers, and status tags.

### Named Rules
**The Subdued Eyebrow Rule.** All kicker/eyebrow text must use the Label style and be colored in a muted neutral shade, never the primary accent gold.

## 4. Elevation

The depth system uses subtle borders, semi-transparent overlays (glassmorphism), and dark backgrounds rather than deep shadow drops to organize layouts.

### Shadow Vocabulary
- **Ambient Low** (`box-shadow: 0 4px 12px rgba(0,0,0,0.5)`): Used for card hover states to provide a subtle float effect.
- **Modal Overlay** (`box-shadow: 0 20px 40px rgba(0,0,0,0.8)`): Used for dialogs and popovers.

### Named Rules
**The Flat Overlay Rule.** Drop shadows are forbidden on containers unless they float above the main page layout (e.g., modals, dropdowns). Depth is established using Obsidian Surface (#121212) on top of Obsidian Background (#0a0a0a).

## 5. Components

### Buttons
- **Shape:** Soft square (6px / 10px rounded)
- **Primary:** Muted Gold background with white text, 8px vertical and 16px horizontal padding.
- **Hover:** Bright Gold (#dec61b) with a scale transition of 105%.
- **Secondary:** Transparent background with Obsidian Border and Slate Text.

### Cards / Containers
- **Corner Style:** Medium radius (10px)
- **Background:** Obsidian Surface (#121212 / bg-obsidian-900/60)
- **Border:** Obsidian Border (#1e1e1e / border-obsidian-800/40)

### Inputs / Fields
- **Style:** 1px Obsidian Border with a darker Obsidian background.
- **Focus:** Muted Gold border transition with a 1px ring offset.

### Navigation
- **Style:** Left sidebar on desktop (64px collapsed, 256px expanded) with border-r dividers.
- **Active State:** Left-stripe accent in Gold with a semi-transparent gold background hover effect.

## 6. Do's and Don'ts

### Do:
- **Do** use dark mode as the primary interface state to protect eyes in dark environments.
- **Do** keep cards and panels flat and structured using the layout grid.
- **Do** wrap Thai headings in `text-wrap: balance` for clean multi-line display.

### Don't:
- **Don't** use neon, saturated purple or blue gradients.
- **Don't** use thick borders (greater than 1px) as colored stripes on cards.
- **Don't** hover-scale images or non-action elements.
