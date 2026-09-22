# ReelFlights — Design System

Concise reference for the visual system. Keep it short; extend only when a real need arises.

## Brand direction

Travel discovery + editorial confidence + premium simplicity. Closer to a travel
publication or destination guide than a SaaS dashboard. Photography does real
design work — it's never a decorative thumbnail.

## Typography

- **Display**: [Fraunces](https://fonts.google.com/specimen/Fraunces) (italic for the hero headline, regular/medium elsewhere). A serif with editorial weight, deliberately not Inter/system-default.
- **Body**: [Work Sans](https://fonts.google.com/specimen/Work+Sans). Clean and quiet, doesn't compete with Fraunces.
- Headline scale is large and responsive (`--text-hero`: 3.25rem mobile → 5.5rem desktop). Body copy stays modest — hierarchy comes from scale contrast between the two, not from many intermediate sizes.

## Color tokens

| Token | Value | Use |
|---|---|---|
| `--color-paper` | `#f6f2ea` | Page background |
| `--color-surface` | `#fffdf9` | Cards, inputs, dialog |
| `--color-ink` | `#1c1a15` | Primary text |
| `--color-ink-muted` | `#625c4d` | Secondary text |
| `--color-line` | `#ddd4bf` | Borders, dividers, skeleton fills |
| `--color-rust` | `#b8420f` | Price, primary accent |
| `--color-rust-dark` | `#8f3309` | Accent hover/active |

One accent color, used consistently for price and emphasis — not spread across badges or icons. All text/background pairs verified ≥ 4.5:1 contrast.

## Spacing & layout

Standard Tailwind spacing scale, no custom scale on top of it. Generous
whitespace over dense packing — the destination grid uses wide gaps (`gap-x-5
gap-y-10/12`) rather than tight card margins.

## Border radius & shadows

Deliberately restrained: no rounded corners on cards or images, sharp
rectangular inputs and buttons. The only "shadow" in the system is the
combobox listbox's subtle drop shadow, used because it's a floating
element that needs to read as elevated. No card shadows, no glassmorphism.

## Buttons & inputs

- Primary CTA ("View flight →"): outlined rectangle, inverts to solid ink on hover. No pill shape, no gradient.
- Inputs: 1px `--color-line` border, `--color-surface` fill, no rounded corners, minimum 44px height (touch target).
- No icon-in-a-tile decorations above headings or controls.

## Cards (destination cards)

Image is the card — not an image inside a bordered/shadowed container.
City name overlays the image on a gradient scrim; price, route, and dates sit
below in plain text. No nested "card within a card," no pills for
direct/stops (plain text with a middot separator instead).

**Known limitation**: destination photos are placeholder images
(`picsum.photos`, seeded deterministically per destination) so every
environment has visuals without depending on a licensed photo library.
Replace with properly licensed destination photography before production —
see the provider-licensing checklist in `README.md`.

## Responsive breakpoints

Mobile-first. Destination grid: 1 column (< 640px) → 2 (≥ 640px) → 3 (≥
1024px) → 4 (≥ 1280px). Verified at 320/375/390/430px, tablet, and desktop
widths.

## Motion

Subtle and functional only: a slight image scale on card hover
(`duration-500`), nothing else. All transitions and animations respect
`prefers-reduced-motion: reduce` (disabled globally in `globals.css`, plus
explicit `motion-reduce:` overrides on the hover-scale and skeleton pulse).

## Accessibility

- Skip link to `#main`.
- Every input has a real `<label>`.
- Airport search is a proper ARIA combobox (`role=combobox` + `listbox` + `aria-activedescendant`, full keyboard support).
- Flight detail uses the native `<dialog>` element for built-in focus trapping and Escape-to-close.
- Visible 2px focus ring (`--color-rust`) on every interactive element, never suppressed.
- Loading state uses `aria-busy` + `aria-live="polite"`; error state uses `role="alert"`.
- All touch targets ≥ 44×44px.

## Anti-patterns intentionally avoided

No purple/blue AI gradients, no glassmorphism, no icon-tile-above-heading
sections, no pill badges, no card-in-card layouts, no generic
three-column feature grid, no decorative blobs, no Inter-everywhere
typography, no excessive rounded corners, no animation without purpose.

## Design review pass

Ran `impeccable detect` against the built homepage before calling the
frontend done. It flagged two patterns:

1. **Italic serif hero (Fraunces italic)** — a real hit: italic-serif
   display type has become a default "tasteful AI" hero move. Fixed by
   setting the hero to roman weight instead of italic.
2. **Warm cream/beige page background** — flagged as a common "safe" AI
   default. Kept deliberately: the palette is documented above with
   contrast ratios checked against WCAG AA, and a warm paper tone is a
   considered fit for an editorial travel-publication register, not a
   reflexive choice. Per the tool-priority order in the product brief, the
   established design system takes precedence over this heuristic once
   it's been consciously reviewed.
