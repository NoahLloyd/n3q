# DESIGN.md

Design system reference for the N3Q web and mobile apps. Use this to maintain visual consistency when building new features or modifying existing UI.

## Brand Identity

N3Q (Nine Three Quarters) is a DAO community hub for builders. The visual identity blends **retro-tech / pixel-art aesthetics** with **modern minimalism** — think terminal meets glass morphism. The brand defaults to **dark mode** and uses amber as its signature accent color.

**Tagline:** "a free lab for builders"

### Brand Assets

| Asset | Web | Mobile | Usage |
|---|---|---|---|
| Pixel logo (SVG) | N/A | Inline SVG in `app/index.tsx` | Mobile login screen |
| Pixel logo (PNG) | `apps/web/public/n3q-favicon.png` | `assets/images/n3q-favicon.png` | Sidebar, splash screen |
| Wordmark | `apps/web/public/Logo-text.png` | `assets/images/Logo-text.png` | Login screen |
| App icon | N/A | `assets/images/icon.png` (1024x1024) | App Store, home screen |
| Favicons | `apps/web/public/favicon-16.png`, `favicon-32.png` | N/A | Browser tab |

Always render pixel art with `image-rendering: crisp-edges` (web) or nearest-neighbor scaling.

## Color System

All colors use the **OKLCH** color space on web via CSS custom properties. The mobile app uses hex equivalents defined in `apps/mobile/src/lib/theme.ts`.

### Core Tokens (dark mode — the default)

| Token | Web (OKLCH) | Mobile (hex) | Usage |
|---|---|---|---|
| Background | `oklch(0.145 0 0)` | `#0a0a0a` | Page background |
| Card | `oklch(0.205 0 0)` | `#1c1c1c` | Card surfaces |
| Foreground | `oklch(0.985 0 0)` | `#fafafa` | Primary text |
| Muted foreground | `oklch(0.708 0 0)` | `#a1a1a1` | Secondary text, captions |
| Muted | `oklch(0.269 0 0)` | `#333` | Subtle backgrounds |
| Border | `oklch(1 0 0 / 10%)` | `rgba(255,255,255,0.10)` | Card borders |
| Input | `oklch(1 0 0 / 15%)` | N/A | Input borders |
| Destructive | `oklch(0.704 0.191 22.216)` | `#f87171` | Delete, errors |

### Amber Accent

Amber is the brand color (`#f5a623` / `#FFA236`), used for:
- **Active states**: Badges, tab highlights, selected filters
- **Buttons (mobile)**: Solid `#FFA236` background with `#171717` text
- **Badges**: `bg-amber-500/20 text-amber-500 border-amber-500/30`
- **Header titles (mobile)**: Departure Mono in `#f5a623`
- **Login page glow**: SVG radial gradients with amber stops
- **Switch toggles**: Amber track color when enabled

Amber is NOT used for general primary actions on web — those use the achromatic `primary` token.

### Data Visualization Colors (polls)

| Choice | Color |
|---|---|
| Yes | `amber-500` / `#f5a623` |
| No | `red-500` / `#f87171` |
| Abstain | `zinc-500` / `#a1a1a1` |
| Multiple choice options | Cycle: `#f5a623`, `#60a5fa`, `#4ade80`, `#a78bfa`, `#f472b6` |

## Typography

### Font Stack

| Font | Web | Mobile | Usage |
|---|---|---|---|
| **Departure Mono** | `font-departure` | `fontFamily: "DepartureMono"` | Brand typography — titles, buttons, labels, tab bar, login |
| **Geist Sans** | `font-sans` | N/A | Body text, card content (web) |
| **Geist Mono** | `font-mono` | N/A | Code, wallet addresses (web) |
| **SpaceMono** | N/A | `fontFamily: "SpaceMono"` | Wallet addresses, technical data (mobile) |
| **System** | N/A | Default | Body text, card content (mobile) |

### Mobile Type Scale

| Role | Style |
|---|---|
| Header title | `fontFamily: "DepartureMono"`, `fontSize: 18`, `color: "#f5a623"` |
| Card title | `fontSize: 14`, `fontWeight: "500"`, `color: colors.foreground` |
| Badge text | `fontSize: 10`, `fontWeight: "600"` |
| Section title | `fontSize: 11`, `fontWeight: "600"`, `textTransform: "uppercase"`, `letterSpacing: 1` |
| Body text | `fontSize: 14`, `color: colors.foreground` |
| Meta/caption | `fontSize: 11-12`, `color: colors.mutedForeground` |
| Button text | `fontFamily: "DepartureMono"`, `fontSize: 16`, `color: "#171717"` |
| Tab label | `fontFamily: "DepartureMono"`, `fontSize: 11`, `color: "#f5a623"` |
| Back button | `fontFamily: "DepartureMono"`, `fontSize: 14`, `color: "#6A6B60"` |
| Login text | `fontFamily: "DepartureMono"`, `fontSize: 11`, `color: "#6A6B60"`, `letterSpacing: 3` |

## Border & Corner Treatment

**Sharp corners everywhere.** This is the core design principle.

### Web
- `--radius: 0rem` — all cards and containers have zero border radius
- Cards: `rounded-none` explicitly
- Exception: shadcn badges use `rounded-full`, some buttons use `rounded-md`

### Mobile
- Cards: No border radius (square)
- Buttons: No border radius (square)
- Inputs: No border radius (square)
- Badges: No border radius (square)
- Avatars: No border radius (square) — including profile and directory
- Tab bar corner squares: 5x5px white accent squares at each corner
- Only exception: Tab bar grabber pill uses `borderRadius: 3`

## Spacing & Layout

### Web Dashboard
- **Sidebar:** Fixed `w-72`, `sticky top-0 h-screen`, hidden on mobile
- **Main content:** `flex-1 px-4 py-4 sm:px-6 sm:py-6`, `max-w-5xl`
- **Card grid:** `gap-4`, responsive columns

### Mobile
- **Content padding:** `14px` (list screens), `20px` (create/form screens)
- **Card padding:** `14px`
- **Card gap:** `marginBottom: 8`
- **Header alignment:** `headerTitleContainerStyle: { left: 12, right: 12 }` to align with content
- **Safe areas:** All screens account for transparent header (`44 + insets.top`) and floating tab bar (`60 + insets.bottom`)

## Component Patterns

### Buttons (Mobile)

| Type | Style |
|---|---|
| Primary action | Solid `#FFA236`, text `#171717`, Departure Mono 16px, square |
| Secondary action | `backgroundColor: colors.card`, `borderColor: colors.cardBorder`, muted text |
| Destructive | `backgroundColor: colors.card`, text `#f87171`, Departure Mono |
| Filter tab (active) | `backgroundColor: colors.amberMuted`, `borderColor: colors.amberBorder`, amber text |
| Filter tab (inactive) | `backgroundColor: colors.card`, `borderColor: colors.cardBorder`, muted text |

### Cards (Mobile)

All cards follow the same structure:
```
backgroundColor: colors.card (#1c1c1c)
borderWidth: 1
borderColor: colors.cardBorder (rgba(255,255,255,0.10))
padding: 14
marginBottom: 8
```
With a footer separated by `borderTopWidth: 1` containing timestamp and creator.

### Header Bar (Mobile)

Custom `headerTitle` component (not headerLeft/headerRight, which add their own wrapping styles):
- Left: Square profile avatar (28x28) with `#1c1c1c` background
- Center: Departure Mono title in `#f5a623`
- Right: Square plus icon box (28x28) with `#0a0a0a` background, hairline border
- All positioned via a single flex row with `justifyContent: "space-between"`

### Back Button (Mobile)

Custom pixel arrow SVG (from `←.svg`) + "back" text in Departure Mono `#6A6B60`. Rendered as `headerTitle` with `headerLeft: () => null` and `headerBackVisible: false` to avoid native button wrapper styling.

### Tab Bar (Mobile)

Floating glass container with blur backdrop:
- Position: `absolute`, inset 14px from edges, just above home indicator
- Background: `BlurView intensity={50}` + `rgba(255,255,255,0.06)` fill + `rgba(255,255,255,0.12)` border
- Corner squares: 5x5px at each corner, `rgba(255,255,255,0.25)`
- Icons: Lucide (`BookOpen`, `Rocket`, `CalendarDays`, `Vote`, `Users`), `strokeWidth: 2.2`
- Active tab: Icon + inline label (Departure Mono 11px, amber), animated slide-in
- Inactive tabs: Icon only, `rgba(255,255,255,0.4)`
- Animation: Label clips from `maxWidth: 0` to `100` (350ms bezier ease-out), slides from `-16px` translate, opacity delayed 100ms. Collapse: 150ms width, 80ms opacity fade.

### Modals (Mobile)

- Presentation: `"modal"` (not `formSheet`, to avoid double grabber in production)
- Header: `#0a0a0a` background, custom `headerTitle` with grabber pill + Departure Mono title
- Grabber: 36x5px pill, `borderRadius: 3`, `rgba(255,255,255,0.2)`, `paddingTop: 5`, `gap: 20` to title
- Title: `#FFA236`, Departure Mono 16px
- No native `headerLeft` — set to `() => null`

### Login Screen (Mobile)

Mirrors the web login aesthetic:
- SVG radial gradient background glow (full-screen, centered at 38%)
- Glass card: `rgba(255,255,255,0.04)` fill, `rgba(255,255,255,0.08)` border, top highlight line
- N3Q logo rendered as inline SVG with radial gradient glow behind it
- Wordmark image below logo
- 6-digit code input in amber-bordered container with corner squares
- All text in Departure Mono

### Empty States (Mobile)

Centered Departure Mono text in `colors.mutedForeground`, `paddingTop: 60`.

### Loading Skeletons (Mobile)

Animated pulsing blocks (`opacity: 0.3 → 0.7`, 800ms repeat) in `colors.muted`. Card skeleton matches card layout (title, badge, body, footer). Member skeleton shows avatar block + text lines.

## Animation & Motion

### Mobile Tab Bar
- **Expand:** 350ms bezier `(0.25, 0.1, 0.25, 1)`, text opacity delayed 100ms
- **Collapse:** 150ms width, 80ms text opacity — fast exit
- **Principle:** Reduce simultaneous motion. Old label collapses quickly, icons settle, then new label slides in

### Login Page (Web)
- `animate-fade-up`: 0.6s ease-out, staggered entrance
- `animate-pixel-flicker`: 6s step-end infinite, subtle logo flicker
- `animate-scan-line`: 8s linear infinite, horizontal sweep
- `animate-logo-glow`: 4s ease-in-out infinite, pulsing glow

### Dashboard (Web)
- Hover transitions: `transition-colors`
- Poll bars: `transition-all duration-300`

## Dark Mode

Dark mode is the **default**. Web supports light mode toggle (`Cmd/Ctrl + J`). Mobile is dark-only.

Storage key: `n3q-theme` in `localStorage` (web).

## Design Principles

1. **Dark-first:** Design for dark mode. Light mode is secondary (web only).
2. **Achromatic core:** Grayscale for 95% of the UI. Amber for brand moments and status indicators only.
3. **Sharp geometry:** Zero border radius everywhere — cards, buttons, inputs, avatars, badges. The only exceptions are the tab bar grabber pill and shadcn badge components.
4. **Departure Mono = brand voice:** Headers, buttons, labels, tab bar, login. Always the brand font for anything that should feel "N3Q".
5. **Solid amber buttons:** Mobile primary actions use solid `#FFA236` with `#171717` text. Not outlined, not muted.
6. **Restraint over decoration:** Minimal shadows, subtle borders at low opacity, no gradients in content UI.
7. **Retro-tech login, clean dashboard:** Login is atmospheric (glass, glows, pixel effects). Dashboard/app screens are utilitarian and content-focused.
8. **Consistent cross-platform:** Same colors, same sharp corners, same font, same card structure on web and mobile.
