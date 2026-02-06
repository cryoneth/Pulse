# Pulse Brand Kit & Customization Guide

> Technical reference for design decisions. What's flexible, what's fixed, and what to avoid.

---

## 1. Styling & Theming

### Current Architecture

| Layer | File | Purpose |
|-------|------|---------|
| CSS Variables | `globals.css` | Design tokens (colors, spacing) |
| Tailwind Config | `tailwind.config.ts` | Maps CSS vars to utility classes |
| Component Styles | `*.tsx` files | Inline Tailwind classes |

### CSS Variables (Design Tokens)

**Location:** `src/app/globals.css`

```css
@theme inline {
  --color-success: #10B981;      /* Emerald - YES, profits, confirmations */
  --color-success-hover: #059669;
  --color-success-bg: #ECFDF5;
  --color-danger: #EF4444;       /* Red - NO, losses, errors */
  --color-danger-hover: #DC2626;
  --color-danger-bg: #FEF2F2;
  --color-action: #2563EB;       /* Blue - primary CTAs, links */
  --color-muted: #6B7280;        /* Gray - secondary text */
}
```

### Tailwind Semantic Colors

**Location:** `tailwind.config.ts`

```ts
colors: {
  page: "var(--bg-page)",      // Page background
  card: "var(--bg-card)",      // Card backgrounds
  border: "var(--border-subtle)",
  main: "var(--text-main)",    // Primary text
  muted: "var(--text-muted)",  // Secondary text
  primary: "var(--primary)",   // Brand color
  success: "var(--success)",   // YES / positive
  danger: "var(--danger)",     // NO / negative
}
```

### What's Easy to Change

| Element | Location | Difficulty | Notes |
|---------|----------|------------|-------|
| Background colors | `globals.css` body | Easy | Single location |
| Primary accent (blue) | CSS vars + find/replace `blue-500/600` | Medium | ~20 occurrences |
| YES color (emerald) | CSS vars + find/replace `emerald-*` | Medium | ~15 occurrences |
| NO color (red) | CSS vars + find/replace `red-*` | Medium | ~15 occurrences |
| Gray palette | Find/replace `gray-*` | Hard | ~100+ occurrences |

### What's Hard-Coded

Many colors are inline Tailwind classes, not CSS variables:

```tsx
// Example from MarketCard.tsx - these are NOT using CSS vars
className="bg-gradient-to-b from-emerald-400 to-emerald-500"
className="bg-gradient-to-b from-red-400 to-red-500"
```

**Recommendation:** Create a centralized color constants file if you want easy swapping:

```ts
// lib/theme.ts (proposed)
export const COLORS = {
  yes: { gradient: "from-emerald-400 to-emerald-500", text: "text-emerald-600" },
  no: { gradient: "from-red-400 to-red-500", text: "text-red-600" },
  // ...
}
```

### Dark Mode

**Current state:** Light mode only. No dark mode infrastructure.

**To add dark mode:**
1. Add `dark:` variants in Tailwind classes
2. Add media query or toggle in globals.css
3. Estimated effort: Medium-High (every component needs dark variants)

---

## 2. Typography

### Font Stack

**Location:** `src/app/layout.tsx`

| Font | Variable | Usage |
|------|----------|-------|
| **Source Sans 3** | `--font-source-sans` | Body text, UI elements (primary) |
| **Playfair Display** | `--font-playfair` | Headlines, news titles (accent) |
| Geist Sans | `--font-geist-sans` | System fallback |
| Geist Mono | `--font-geist-mono` | Code, addresses |

### Font Loading

```tsx
// layout.tsx
const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
  weight: ["300", "400", "600"],
});
```

**All fonts load via Google Fonts with Next.js optimization** - no performance concerns for mobile.

### What's Easy to Change

| Change | How | Difficulty |
|--------|-----|------------|
| Swap body font | Change `Source_Sans_3` import in layout.tsx | Easy |
| Change headline font | Change `Playfair_Display` import | Easy |
| Add font weights | Modify `weight` array in font config | Easy |
| Global font size | Add base size in globals.css body | Easy |

### What's Harder

| Change | Difficulty | Notes |
|--------|------------|-------|
| Tabular numbers | Medium | Requires font-variant-numeric CSS, not all fonts support |
| Variable font axes | Medium | Depends on font availability |
| Self-hosted fonts | Medium | Replace Google Fonts imports with local files |

### Font Usage in Components

```tsx
// Playfair used for news headlines
style={{ fontFamily: "var(--font-playfair), serif" }}

// Source Sans is the default (set in globals.css body)
font-family: 'Source Sans 3', -apple-system, BlinkMacSystemFont...
```

---

## 3. Component Flexibility

### Buttons

**Current variants (informal):**

| Style | Classes | Usage |
|-------|---------|-------|
| Primary | `bg-gradient-to-b from-blue-500 to-blue-600 text-white` | Connect Wallet |
| YES Action | `bg-gradient-to-b from-emerald-400 to-emerald-500 text-white` | Buy YES |
| NO Action | `bg-gradient-to-b from-red-400 to-red-500 text-white` | Buy NO |
| Secondary | `bg-white border border-gray-200 text-gray-700` | Portfolio link |
| Dark | `bg-gray-800 hover:bg-gray-900 text-white` | Sell buttons |

**No formal Button component** - all buttons are inline styled.

**Flexibility:**
- Size: Ad-hoc (`py-2`, `py-3`, `py-3.5` used inconsistently)
- No disabled/loading variants standardized
- Gradients are hard-coded per button

**Recommendation:** Create a shared `Button` component with props for variant, size, loading state.

---

### Market Cards (`MarketCard.tsx`)

**Structure:**
```
[Category Badge] [Volume]
[Question Title]
[YES Button] [NO Button]
```

**Flexible:**
- Category badge colors (defined in component)
- Question text length (uses `line-clamp-2`)
- Button gradients

**Fixed:**
- Layout (vertical stack)
- Button arrangement (side-by-side)
- Border radius (`rounded-xl`)

**Category Colors:**
```tsx
const categoryConfig = {
  sports: { bg: "bg-orange-100", text: "text-orange-700" },
  crypto: { bg: "bg-violet-100", text: "text-violet-700" },
  "pop-culture": { bg: "bg-pink-100", text: "text-pink-700" },
  politics: { bg: "bg-blue-100", text: "text-blue-700" },
};
```

---

### YES / NO Selector

**Locations:** `market/detail/[id]/page.tsx`, `FloatingPositions/PositionCard.tsx`

```tsx
// Toggle implementation
<div className="flex p-1 bg-gray-100 rounded-lg">
  <button className={side === "YES" ? "bg-white shadow-sm text-emerald-500" : "text-muted"}>
    YES
  </button>
  <button className={side === "NO" ? "bg-white shadow-sm text-red-500" : "text-muted"}>
    NO
  </button>
</div>
```

**Flexible:**
- Colors (emerald/red)
- Background (gray-100)
- Border radius

**Fixed:**
- Binary toggle behavior
- Text labels ("YES" / "NO")

---

### Step Tracker (`StepTracker.tsx`)

**Structure:**
```
[Icon] Step Label
  |
[Icon] Step Label
  |
[Icon] Step Label
```

**Status colors:**
- Pending: `bg-gray-200`, `text-gray-400`
- Active: `bg-blue-500`, `text-blue-600`
- Complete: `bg-emerald-500`, `text-emerald-600`
- Verifying: `bg-violet-500`, `text-violet-600`
- Error: `bg-red-500`, `text-red-600`

**Flexible:**
- All colors
- Icon SVGs
- Step labels
- Number of steps (dynamic)

**Fixed:**
- Vertical layout
- Connector line style

---

### Error / Success States

**Scattered across components** - not centralized.

**Common patterns:**

Success:
```tsx
className="bg-emerald-50 border border-emerald-200"
className="text-emerald-600" // or emerald-700
```

Error:
```tsx
className="bg-red-50 border border-red-200"
className="text-red-500" // or red-600, red-700
```

**Recommendation:** Create shared `Alert` component with `variant="success|error|warning|info"`

---

## 4. Spacing & Density

### Current State

**Standardized on Tailwind scale** - mostly consistent:

| Usage | Common Values |
|-------|--------------|
| Card padding | `p-4`, `p-5` |
| Section margins | `mb-4`, `mb-5`, `mb-6` |
| Button padding | `py-2.5`, `py-3`, `py-3.5` |
| Gap between items | `gap-2`, `gap-3` |

### Global Adjustments

**Easy to change:**
- Increase all card padding: Find/replace `p-4` → `p-5`
- Adjust vertical rhythm: Find/replace `mb-4` → `mb-6`

**Fragile areas (don't touch without testing):**

1. **NewsCarousel** - 3D transforms depend on exact heights
   ```tsx
   className="h-[460px] sm:h-[520px] md:h-[580px]"
   ```

2. **Bottom sheet modals** - max-height calculations
   ```tsx
   style={{ maxHeight: "85vh" }}
   ```

3. **Price ticker** - animation timing tied to width

---

## 5. Motion & Animation

### Animation System

**Pure CSS animations** in `globals.css`:

```css
@keyframes slide-up { ... }      /* Bottom sheets */
@keyframes fade-in { ... }       /* Overlays */
@keyframes fade-in-scale { ... } /* FAB appearance */
@keyframes ticker { ... }        /* Price ticker scroll */
@keyframes ping-slow { ... }     /* FAB pulse ring */
```

**No Framer Motion or React Spring** - keeps bundle small.

### Current Animations

| Element | Animation | Duration |
|---------|-----------|----------|
| Bottom sheets | slide-up | 300ms |
| Backdrop | fade-in | 200ms |
| FAB button | fade-in-scale | 300ms |
| FAB pulse | ping-slow | 2000ms |
| Price ticker | ticker | 20s (infinite) |
| Spinners | Tailwind `animate-spin` | Built-in |
| Pulses | Tailwind `animate-pulse` | Built-in |

### Removing/Reducing Motion

**Easy:**
- Remove animation class: `animate-slide-up` → (nothing)
- Reduce to instant: Set duration to `0s` in globals.css

**For accessibility (prefers-reduced-motion):**
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Performance

No concerns on mobile - all animations are CSS-based with `transform` and `opacity` (GPU accelerated).

---

## 6. Icons & Visuals

### Icon System

**Inline SVGs throughout** - no icon library.

**Common pattern:**
```tsx
<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="..." />
</svg>
```

**Icon sizes:** `w-3 h-3`, `w-4 h-4`, `w-5 h-5`, `w-6 h-6`

### Swapping Icons

**Easy** - just replace the `d` attribute path:

```tsx
// Current checkmark
d="M5 13l4 4L19 7"

// To swap: replace with new path from Heroicons, Lucide, etc.
```

### Hard-coded SVGs

All icons are hard-coded inline. No centralized icon components.

**Recommendation:** Create an `Icon` component or use a library like `lucide-react`:

```tsx
// Proposed
import { Check, X, ChevronDown } from 'lucide-react';
<Check className="w-5 h-5 text-emerald-500" />
```

---

## 7. Copy & Labels

### Current State

**All strings are hard-coded** in components. No i18n or centralized strings.

**Examples of changeable copy:**

```tsx
// WalletButton.tsx
"Connect Wallet"
"Select Wallet"
"No wallets detected"

// MarketCard.tsx
"YES"
"NO"

// PositionFlow.tsx
"Position Live"
"Confirm Position"
"Something went wrong"
```

### Freely Changeable

Most UI labels can be changed without breaking logic:
- Button text
- Section headers
- Empty states
- Error messages

### Logic-Tied Strings (Don't Change)

```tsx
// These are tied to data/logic:
side === "YES"  // Used for boolean logic
side === "NO"   // Used for boolean logic
type === "buy"  // Transaction type matching
type === "sell" // Transaction type matching
```

---

## 8. Technical Constraints for Design

### Hard to Implement

| Request | Why | Alternative |
|---------|-----|-------------|
| Complex micro-animations | Would need Framer Motion | Keep to CSS transitions |
| Drag-to-reorder positions | Needs gesture library | Use simple list |
| Real-time price charts | Needs charting library + WebSocket | Static or polling |
| Custom scrollbars | CSS-only is limited | Use native scrolling |

### Risky for Demo

| Request | Risk | Notes |
|---------|------|-------|
| Changing wallet flow | Could break Web3 connection | Test thoroughly |
| Modifying transaction logic | Could cause failed txs | Don't touch lifi.ts |
| Bottom sheet height changes | Keyboard/scroll issues on iOS | Test on device |

### Bug-Prone Areas

1. **NewsCarousel 3D transforms** - Any dimension change requires recalculating `distance` and angles
2. **iOS safe areas** - Bottom sheet positioning needs `pb-safe` consideration
3. **Price ticker animation** - Content width must be exactly 2x for seamless loop

### Surprisingly Easy to Change

| Change | Effort | Notes |
|--------|--------|-------|
| All colors | 1-2 hours | Find/replace with caution |
| Font family | 10 minutes | Change Google Font import |
| Border radius | 30 minutes | Find/replace `rounded-xl` etc |
| Button gradients | 30 minutes | ~10 occurrences |
| Card shadows | 30 minutes | `shadow-sm`, `shadow-md`, etc |

---

## 9. Quick Reference

### Safe to Change

```
Colors (with find/replace):
  - blue-500, blue-600 → your primary color
  - emerald-* → your YES/positive color
  - red-* → your NO/negative color
  - gray-* → your neutral palette

Typography:
  - Font family in layout.tsx
  - Font weights in layout.tsx
  - Text sizes via Tailwind classes

Spacing:
  - Card padding (p-4, p-5)
  - Section margins (mb-4, mb-5, mb-6)
  - Gap values (gap-2, gap-3)

Borders:
  - Border radius (rounded-lg, rounded-xl)
  - Border colors (border-gray-200, etc)

Shadows:
  - shadow-sm, shadow-md, shadow-lg, shadow-xl
```

### Avoid Changing

```
NewsCarousel:
  - Height values (h-[460px] etc)
  - Distance calculation in getCardStyle()
  - 3D transform values

Bottom Sheets:
  - z-index hierarchy (50, 60, 70, 90, 100, 110)
  - max-height calculations

Transaction Logic:
  - Anything in lib/lifi.ts
  - Contract ABIs
  - Transaction flow in market detail page

Animation Timing:
  - ticker animation duration (tied to content width)
```

### Brittle Components (Test Carefully)

1. **NewsCarousel** - 3D card deck with precise positioning
2. **PriceTicker** - Infinite scroll depends on content duplication
3. **PositionFlow** - Multi-step transaction with state machine
4. **FloatingPositions** - Drawer + FAB positioning for mobile

---

## 10. Recommended Next Steps

### For Design Team

1. **Decide on color palette** - Provide hex values for:
   - Primary brand color (currently blue-600 `#2563EB`)
   - YES/positive color (currently emerald-500 `#10B981`)
   - NO/negative color (currently red-500 `#EF4444`)
   - Neutral grays (currently Tailwind gray palette)

2. **Choose typography** - Confirm or change:
   - Body font (currently Source Sans 3)
   - Display font (currently Playfair Display)
   - Font weights needed

3. **Define spacing scale** - Current is standard Tailwind (4px base)

### For Engineering

1. **Create theme constants file** - Centralize colors
2. **Build shared Button component** - Standardize variants
3. **Add Alert component** - Unify success/error states
4. **Consider icon library** - Replace inline SVGs

---

## File Reference

| File | Contains |
|------|----------|
| `src/app/globals.css` | CSS variables, animations |
| `tailwind.config.ts` | Color mappings |
| `src/app/layout.tsx` | Font definitions |
| `src/components/MarketCard.tsx` | Category colors |
| `src/components/StepTracker.tsx` | Status colors |
| `src/components/BottomNav.tsx` | Navigation icons |
| `src/components/NewsCarousel.tsx` | Category badge colors |
