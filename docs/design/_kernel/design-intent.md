# Design intent

Color, typography, spacing, and motion stated as intent. Concrete values are for Claude Design to choose — these constraints define what those values must satisfy.

## Color intent

- **Warm and unclinical.** Never sterile-white. Never the saturated red/green that reads as "alert / status".
- **High contrast in cooking view.** Glance-readable at arm's length, possibly with wet hands, possibly in dim or bright kitchen lighting.
- **Subdued, not muted.** Saturation low enough to never compete with food photography (where it appears) or with the user's actual food in front of them.
- **Status conveyed by structure, not color alone.** A11y baseline. Color is reinforcement; layout and language are the primary signals.

## Typography intent

- **Type scale optimized for kitchen-distance reading.** Body text larger than typical web defaults; phone propped on counter ≈ 60-80cm from face.
- **One font family, two at most.** A single readable sans for everything is acceptable; if a second family is used, reserve it for recipe titles and phase labels.
- **Numerals stand out.** Quantities, times, and timers read at a glance. Tabular figures where they appear in counters.
- **No decorative text in the cooking view.** Cooking view is purely functional.

## Spacing intent

- **Generous touch targets.** Kitchen use: occasional misses with a knuckle or a fingertip. Minimum 44px equivalent for any tappable element, including chips, pills, and icon buttons — not just primary CTAs. Cooking-view targets are larger still.
- **Breathing room over density.** Catalog and overview can be dense; cooking and suggestion screens must not be.
- **One-handed phone use respected.** Critical actions (next step, dismiss, start timer) reachable with thumb.

## Motion intent

- **Subdued by default.** Motion communicates state change, never delight.
- **Respect `prefers-reduced-motion: reduce` everywhere.** No exceptions for "subtle" animations.
- **Timers are a special case.** A countdown is *information*, not *animation*. The visual treatment of the countdown counts as motion under this rule but must remain enabled (with simplified transitions) under reduced-motion.

## Mode intent

- **Light mode is the default.** Most kitchens are bright.
- **Dark mode supported, not pushed.** Some users cook with dim lighting. The dark mode is "calm reading", not "cinematic".

## What this file is not

This file does not pin specific color hex values, font families, or px values. Claude Design extracts concrete values during organization onboarding (see `codebase-pointers.md`) and refines them per project. If a per-surface brief needs to override a default for a specific reason, that override goes in the brief, not here.
