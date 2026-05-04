---
name: Vantage Executive
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#404944'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#735c00'
  on-secondary: '#ffffff'
  secondary-container: '#fed65b'
  on-secondary-container: '#745c00'
  tertiary: '#003623'
  on-tertiary: '#ffffff'
  tertiary-container: '#004f34'
  on-tertiary-container: '#31c98f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#ffe088'
  secondary-fixed-dim: '#e9c349'
  on-secondary-fixed: '#241a00'
  on-secondary-fixed-variant: '#574500'
  tertiary-fixed: '#6ffbbe'
  tertiary-fixed-dim: '#4edea3'
  on-tertiary-fixed: '#002113'
  on-tertiary-fixed-variant: '#005236'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  h1:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.03em
  h2:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: -0.01em
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: -0.01em
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0em
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  button:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '600'
    lineHeight: '1.0'
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  xxl: 80px
  gutter: 24px
  margin: 32px
---

## Brand & Style

The design system is engineered for a high-stakes sales environment where precision meets prestige. It targets high-performing sales executives who require a workspace that feels like a private digital lounge—quiet, authoritative, and impeccably organized.

The aesthetic blends **Minimalism** with **Glassmorphism**. By utilizing generous whitespace and translucent layers, the interface achieves a sense of depth and airiness. The primary emotional response is one of "calm confidence," moving away from the frantic energy of typical CRM platforms toward a curated, editorial experience. Every interaction should feel intentional, leveraging high-contrast typography and subtle motion to guide the user through complex data sets.

## Colors

The palette is anchored by **Deep Emerald**, providing a foundation of stability and growth. This is contrasted by **Gold accents**, reserved strictly for high-value indicators, primary calls to action, and "win" states to maintain its premium association.

**Clean Off-Whites** serve as the canvas, preventing the clinical feel of pure white and reducing eye strain. For functional feedback, use a brighter emerald for success and a muted slate for secondary information. Text should maintain high contrast, utilizing the Deep Emerald for headings rather than true black to keep the palette cohesive.

## Typography

This design system utilizes **Inter** exclusively to leverage its systematic clarity and modern architectural feel. To achieve the requested "luxurious" look, typography employs **tight tracking** (negative letter spacing) on all headlines, creating a dense, professional typographic block.

Hierarchy is established through weight and color rather than just size. Headlines should use the Deep Emerald color, while body text uses a slightly desaturated charcoal derived from the emerald base. Small labels and metadata should use uppercase with slight tracking increases to act as clear navigational markers.

## Layout & Spacing

The system follows a **Fixed Grid** philosophy for dashboard views to ensure executive-level data visualization remains consistent across ultra-wide monitors. A 12-column grid is used with generous 24px gutters.

Rhythm is based on a 4px baseline. Use the `xxl` (80px) spacing for section separation to reinforce the minimalist, "airy" feel. Content should be grouped in containers that utilize internal padding of `lg` (24px) to ensure that the glassmorphic backgrounds have enough breathing room to be perceived.

## Elevation & Depth

Depth is articulated through **Subtle Glassmorphism** and ambient, tinted shadows. Surfaces are not simply layered; they are treated as physical panes of glass with varying degrees of "frost."

- **Level 0 (Background):** Solid `#f9fafb`.
- **Level 1 (Cards):** Background-blur (12px), 80% opacity off-white, with a 1px white inner border to simulate a glass edge.
- **Level 2 (Modals/Popovers):** Deep Emerald tinted shadows (0px 20px 40px rgba(6, 78, 59, 0.08)).
- **Level 3 (Active States):** Gold-tinted glow for selected high-priority items.

Shadows must never be black; they must always contain a hint of the Deep Emerald primary color to maintain a sophisticated, tonal depth.

## Shapes

The shape language is defined by **rounded-2xl** corners (1rem / 16px) for all primary containers and cards. This extreme rounding softens the data-heavy nature of a sales workspace, making the software feel approachable and modern.

Buttons and input fields should follow a slightly smaller radius (0.75rem) to maintain structural integrity within larger containers. For decorative elements like status badges or "win" indicators, a full-pill radius is used to distinguish them from functional UI components.

## Components

### Buttons
- **Primary:** Solid Deep Emerald with white text. High-contrast, no gradient.
- **Secondary:** Transparent with a 1px Gold border and Gold text.
- **Action:** Gold background with Deep Emerald text for critical "Close Deal" or "Convert" actions.

### Cards
- Utilize the Level 1 glassmorphism specs.
- Headers within cards should have a subtle bottom border (1px, 5% Emerald) to separate titles from content without breaking the glass effect.

### Input Fields
- Soft grey background (#F3F4F6) with no border in default state.
- On focus: 1px Gold border and a subtle Gold outer glow.
- Labels are always `label-caps` positioned above the field.

### Chips & Badges
- Status badges use a desaturated version of the status color with high-contrast text.
- Deal stage chips use a subtle gradient from Emerald to a slightly lighter green.

### Sales Specific Components
- **The Pipeline Ribbon:** A horizontal glass pane with segmented progress indicators using the Gold accent for the current stage.
- **Revenue Metric Displays:** Large `display` typography for dollar amounts, paired with a small Gold trend icon.