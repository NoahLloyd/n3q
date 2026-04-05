# DESIGN.md

Design system reference for the N3Q web and mobile apps. Use this to maintain visual consistency when building new features or modifying existing UI.

## Brand Identity

N3Q (Nine Three Quarters) is a DAO community hub for builders. The visual identity blends **retro-tech / pixel-art aesthetics** with **modern minimalism** — think terminal meets glass morphism. The brand defaults to **dark mode** and uses amber as its signature accent color.

**Tagline:** "a free lab for builders"

### Brand Assets (`apps/web/public/`)

| Asset | File | Usage |
|---|---|---|
| Pixel logo | `n3q-favicon.png` | Sidebar, login page, favicons. Always render with `image-rendering: crisp-edges` |
| Wordmark | `Logo-text.png` | Login page. Max width 220px, `image-rendering: crisp-edges` |
| Favicons | `favicon-16.png`, `favicon-32.png` | Browser tab |

## Color System

All colors use the **OKLCH** color space via CSS custom properties. The palette is intentionally **achromatic** (zero saturation) for the core UI, with amber as the only chromatic accent.

### Core Tokens (dark mode — the default)

```
--background:         oklch(0.145 0 0)    /* near-black */
--foreground:         oklch(0.985 0 0)    /* near-white */
--card:               oklch(0.205 0 0)    /* slightly lighter than bg */
--card-foreground:    oklch(0.985 0 0)
--primary:            oklch(0.922 0 0)    /* light gray (buttons, emphasis) */
--primary-foreground: oklch(0.205 0 0)    /* dark text on primary */
--secondary:          oklch(0.269 0 0)    /* dark gray */
--muted:              oklch(0.269 0 0)    /* same as secondary */
--muted-foreground:   oklch(0.708 0 0)    /* mid-gray for captions */
--border:             oklch(1 0 0 / 10%)  /* white at 10% — very subtle */
--input:              oklch(1 0 0 / 15%)
--destructive:        oklch(0.704 0.191 22.216)  /* warm red */
```

### Light Mode Overrides

Light mode inverts the grayscale. `--primary` becomes near-black, `--background` becomes white. The structure is identical — just swapped luminance values.

### Amber Accent

Amber is the brand color, used sparingly for:
- **Wallet/crypto actions** on login: `text-amber-400`, `border-amber-500/25`, `bg-amber-500/[0.03]`
- **Active status badges**: `bg-amber-500/20 text-amber-500 border-amber-500/30`
- **Membership indicators**: `border-amber-500/30 bg-amber-500/10` with a `h-2 w-2 rounded-full bg-amber-500` dot
- **Login page ambient glow**: `bg-amber-500/[0.04] blur-[120px]`
- **Pixel grid overlay**: `rgba(255,162,54,0.5)` at 3% opacity

Amber is NOT used for general primary actions — those use the achromatic `primary` token.

### Mobile Colors

The mobile app uses hex equivalents:
- Background: `#0a0a0a`
- Card: `#1a1a1a`
- Borders: `#333`, `#222`
- Amber accent: `#f5a623`
- Text: `#fff`, `#aaa` (muted), `#888` (subtle), `#666` (placeholder)

### Data Visualization Colors (polls)

Poll voting bars use distinct Tailwind colors:
- Yes: `amber-500`
- No: `red-500`
- Abstain: `zinc-500`
- Multiple choice options cycle through: `blue-500`, `purple-500`, `pink-500`, `cyan-500`

## Typography

### Font Stack

| Font | CSS | Usage |
|---|---|---|
| **Departure Mono** | `font-departure` (custom class) | Brand typography — login page, button labels on login, status badges, section labels |
| **Geist Sans** | `font-sans` (default) | All body text, card content, navigation labels |
| **Geist Mono** | `font-mono` | Code, wallet addresses, technical data |

Departure Mono is loaded as a custom `@font-face` from `/fonts/DepartureMono-Regular.otf`. The mobile app uses **SpaceMono** as its monospace font.

### Type Scale

| Role | Classes | Example |
|---|---|---|
| Page title | `text-xl font-semibold tracking-tight` | Dashboard section headers |
| Card title | `text-sm font-medium leading-tight` | Feed items, poll titles |
| Section label | `text-sm font-medium text-muted-foreground` | Card headers |
| Body text | `text-sm text-muted-foreground` | Descriptions, sidebar copy |
| Caption | `text-xs text-muted-foreground` | Timestamps, meta info |
| Brand label | `font-departure text-[11px] uppercase tracking-[0.2em]` | Login page text, status badges |
| Brand micro | `font-departure text-[10px] uppercase tracking-[0.2em]` | Dividers, smallest brand text |

**Key pattern:** Departure Mono is always paired with `uppercase tracking-[0.2em]` for the distinctive wide-spaced brand look.

## Spacing & Layout

### Dashboard Layout

- **Sidebar:** Fixed `w-72`, `sticky top-0 h-screen`, hidden on mobile (`hidden sm:flex`)
- **Main content:** `flex-1 px-4 py-4 sm:px-6 sm:py-6`
- **Content max-width:** `max-w-5xl`
- **Section gaps:** `space-y-4`
- **Card grid:** Responsive columns with `gap-4`

### Sidebar Navigation Items

Each nav item is a card-like block:
```
border border-border/60 bg-background/60 px-3 py-3
```
With a `h-12 w-12` icon container (`bg-muted`) and title + description below it.

Active state: `border-sidebar-accent bg-sidebar-accent text-sidebar-foreground`
Hover: `hover:border-sidebar-ring hover:bg-muted/60`

### Mobile Spacing

- Screen padding: `24px` (login), `16px` (content screens)
- Card padding: `16-24px`
- Card gaps: `marginBottom: 12`
- Touch targets: minimum `padding: 14` on buttons

## Border & Corner Treatment

### Web

- **Border radius:** `--radius: 0rem` — **all cards and containers have sharp corners** by default. This is a deliberate design choice maintaining the retro aesthetic.
- **Exception:** shadcn components like badges use `rounded-full`, buttons use `rounded-md` — these are component-level overrides, not the global default.
- **Border color:** `border-border` or `border-border/60` (muted)
- **Shadows:** Minimal — `shadow-xs` on inputs, `shadow-sm` on cards

### Mobile

- Cards use rounded corners: `borderRadius: 10-12`
- Inputs: `borderRadius: 8`
- Buttons: `borderRadius: 8`

## Component Patterns

### Buttons

Web buttons use shadcn/CVA variants:

| Variant | Style | Usage |
|---|---|---|
| `default` | `bg-primary text-primary-foreground` | Primary actions |
| `outline` | `border bg-background shadow-xs` | Secondary actions, icon buttons |
| `ghost` | `hover:bg-accent` | Inline/toolbar actions |
| `secondary` | `bg-secondary` | Tertiary actions |
| `destructive` | `bg-destructive text-white` | Delete, dangerous actions |
| `link` | `text-primary underline` | Inline links |

Sizes: `sm` (h-8), `default` (h-9), `lg` (h-10), `icon` (9x9), `icon-sm` (8x8), `icon-lg` (10x10)

**Login page buttons** are custom — NOT shadcn. They use a distinct pattern:
- Outer `<span>` with border overlay and bg tint
- Four corner accent dots (`w-1.5 h-1.5`) at each corner
- `font-departure text-xs uppercase tracking-[0.2em]`
- White variant for Google, amber variant for wallet

### Cards

Standard shadcn Card with `rounded-xl border pt-6 pb-6 shadow-sm`. In practice, many dashboard cards override with `rounded-none` or custom styling.

### Badges

Rounded-full pills (`rounded-full border px-2 py-0.5 text-xs`). Variants: default, secondary, destructive, outline.

Custom status badges used in voting/events:
- Active: `bg-amber-500/20 text-amber-500 border-amber-500/30`
- Closed/Past: muted gray styling

### Inputs

`h-9 px-3 py-1 border border-input bg-transparent shadow-xs`. Focus ring: `focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]`.

### Avatars

Radix Avatar with fallback initials. Stacked avatar groups use `-space-x-1.5` overlap with `border border-background` rings. Sizes: `h-5 w-5` (stacked), `h-7 w-7` (sidebar), standard for profile.

### Icons

**Lucide React** for web. Standard sizes: `h-3 w-3` (small UI), `h-4 w-4` (inline), `h-5 w-5` (navigation/sidebar). Color inherits from parent, typically `text-muted-foreground`.

**FontAwesome** (`@expo/vector-icons`) for mobile.

## Animation & Motion

### Login Page Effects

| Animation | Duration | Purpose |
|---|---|---|
| `animate-fade-up` | 0.6s ease-out | Staggered entrance of elements (delays: 0.1s, 0.12s, 0.15s, 0.18s, 0.2s, 0.3s) |
| `animate-pixel-flicker` | 6s step-end infinite | Subtle opacity flicker on logo (92-98% keyframes) |
| `animate-scan-line` | 8s linear infinite | Horizontal line sweeping down the viewport |
| `animate-logo-glow` | 4s ease-in-out infinite | Pulsing glow behind logo (scale + opacity) |

### Ambient Effects (Login)

- **Pixel grid:** `background-size: 8px 8px` with amber gridlines at 3% opacity
- **Scan line:** 2px gradient line (`via-amber-500/10`) animating vertically
- **Warm glow:** 600px blur circle at viewport center (`bg-amber-500/[0.04] blur-[120px]`)
- **Glass card:** `backdrop-blur-xl bg-white/[0.04] border border-white/[0.08]`
- **Inner glow:** 1px gradient at card top edge (`via-white/20`)

### Dashboard Interactions

- Hover transitions: `transition-colors` (default Tailwind duration)
- Loading spinner: `animate-spin` on circular border element
- Poll bars: `transition-all duration-300` for width changes
- Button hover: `duration-300` on login page custom buttons

## Dark Mode

Dark mode is the **default** (set in `ThemeProvider` if no stored preference). Toggle via `Cmd/Ctrl + J` or the sidebar toggle button. Implementation uses a `.dark` class on `<html>` with CSS variable overrides.

Storage key: `n3q-theme` in `localStorage`.

## RainbowKit Theme

The wallet connection modal uses a separate emerald accent (not amber):
```js
darkTheme({
  accentColor: "#10b981",        // emerald-500
  accentColorForeground: "white",
  borderRadius: "small",
  fontStack: "system",
})
```

This is intentional — the wallet UI has its own crypto-native identity distinct from the N3Q brand palette.

## Design Principles

1. **Dark-first:** Design for dark mode, light mode is secondary
2. **Achromatic core:** Use the grayscale token system for 95% of the UI. Reserve amber for brand moments and status indicators
3. **Sharp geometry:** Zero border radius at the layout level (cards, containers). Only component-level elements (badges, buttons) get rounding
4. **Departure Mono = brand voice:** Use it for anything that should feel distinctly "N3Q" — always uppercase with wide tracking
5. **Restraint over decoration:** Minimal shadows, subtle borders at low opacity, no gradients in the dashboard UI
6. **Retro-tech login, clean dashboard:** The login page is atmospheric (glass, glows, pixel effects). The dashboard is utilitarian and content-focused
