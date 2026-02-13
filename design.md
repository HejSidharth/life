# Life Dashboard Design Style

## Intent
Build a playful, mascot-first dashboard system that feels game-like while keeping health data readable and action-oriented.

## Foundations
- Global font: `Sora` for all text roles.
- Border-first surfaces only. No drop shadows.
- Rounded geometry across all surfaces and controls.
- Mobile-first composition tuned for `390x844` and `430x932`.

## Mascot Assets
- Canonical assets live in `public/mascots/`.
- Source filenames from Downloads are normalized to stable app names:
- `fox-wave.png`
- `fox-workout.png`
- `fox-hydration.png`
- `fox-food.png`

## Page-to-Mascot Mapping
- `/dashboard` -> `fox-wave`
- `/settings` -> `fox-wave`
- `/exercise` -> `fox-workout`
- `/hydration` -> `fox-hydration`
- `/food` -> `fox-food`

## Scene Anatomy
- Hero uses the shared `MascotSceneHero` component.
- Hero structure:
- Top meta (title, subtitle, optional year/date pill)
- Center mascot with subtle bob animation
- Optional footer slot for status controls (hearts, streak, quick button)
- Background layers:
- Sky gradient
- Ground slab
- Two hill ovals
- Two cloud ovals

## Shared Component Contracts
- `MascotImage` variant API:
- `variant: "wave" | "food" | "hydration" | "workout"`
- `size: "sm" | "md" | "lg" | "xl"`
- `animate?: boolean`
- `MascotSceneHero` API:
- `sceneKey: "dashboard" | "food" | "hydration" | "exercise" | "settings"`
- `title: string`
- `subtitle?: string`
- `dateLabel?: string`
- `footer?: ReactNode`

## Surface Rules
- Primary cards: `bg-card border border-border rounded-[1.5rem+]`.
- Secondary cards: `bg-secondary border border-border`.
- Action emphasis through color contrast and scale, not elevation.
- Progress bars are thick, rounded, and color-coded.

## Motion Rules
- Entrance: spring fade/slide (short distance).
- Interaction: slight scale on press.
- Mascot animation: slow vertical bob only.

## Constraints
- Preserve all business logic and Convex interactions.
- Keep auth pages, home page, and guided flow dialogs out of this design pass.
- Keep dock behavior unchanged; only visual alignment adjustments allowed.

## Reuse Rules
- Every new dashboard page should start with `MascotSceneHero`.
- One hero mascot per page, no repeated mascot blocks below the fold.
- If a page needs multiple stats, stack bordered cards with consistent radius and spacing.
