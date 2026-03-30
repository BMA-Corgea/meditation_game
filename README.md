# Meditation Game

A small React meditation toy about distraction, reaction, fixation, and the option to stop feeding any of them.

This is not a strategy game, deckbuilder, or progression system. The current build is a surreal attention loop: cards appear, ask for engagement, inflate a meaningless total, interrupt the screen, or fake the feeling of consequence. `Breathe` is always present as the one steady action.

## What The Game Is Now

The current version plays like this:

- A permanent `Breathe` card is always in your hand and must remain visible and playable.
- Other cards appear automatically and expire on their own after a short lifespan.
- Two opposing invisible pressures shape the pacing:
  - `settleLevel` rises through breathing and sustained non-interaction.
  - `fixationLevel` rises through repeated engagement and craving loops.
- Non-breathe cards are played by dragging them upward until the drag target switches from `drag higher` to `release to play`.
- `steady` and `jittery` cards stay in the row.
- `hovering`, `elusive`, and `centralizing` cards roam above it.
- `centralizing` cards drift toward the middle, render larger, glow more intensely, and fade more slowly.
- Some cards increase the `MEANINGLESS TOTAL`.
- Some cards distort the screen with shake, blur, flash, soften, or glow.
- As fixation rises, cards get larger, `Breathe` shrinks, more cards can accumulate, and a screen aura appears.
- Random interruptions appear as `pick 3` prompts, nonsense graphs, tiny 3x3 boards, emoji exchanges, and fake inbox/text clusters.
- A volume slider now sits beside the ambience toggle.
- `Pick 3` prompts still show fake stat deltas like `+3 Clarity` or `-2 Drift`.
- Those modal stats do not persist, do not affect systems, and do not matter.
- The non-choice interruptions are also clickable: graph bars can be focused, board tiles light adjacent tiles, emoji scenes can be selected, and message items open three-emoji quick replies.
- Walker characters occasionally enter, say one line, and leave. Clicking them makes them exit early and produce a small reply.
- Pressing `Breathe` clears the current noise for a moment: effects drop, modals vanish, walkers leave, most cards fade out, and the footer shifts from `notice the impulse` to `just this`.

The loop is meant to feel tempting, silly, mildly invasive, and familiar without becoming clinical or reward-driven.

## Design Guardrails

This project works only if it resists becoming a real optimization game.

Keep these intact:

- Presence should remain available at all times.
- `Breathe` must remain visible, reachable, and visually legible even when fixation is high.
- Distractions should feel urgent, absurd, emotional, decorative, or vaguely profound.
- Most interactions should stay immediate and low-stakes.
- The big number should remain funny and meaningless.
- Fake stats should remain fake.
- `Breathe` should feel like a return, not a scoring mechanic.
- `fixationLevel` should feel like attentional capture, not a hidden punishment meter.

Changes are probably wrong if they introduce:

- Persistent meaningful stats
- Builds or card strategy
- Meta progression or unlock economies
- Combat, enemies, health, mana, or turns
- Win conditions, fail states, or optimal play

## Tech Stack

- React 18
- Vite 4
- CSS modules by file convention only; no CSS-in-JS
- No backend
- No persistence
- Node's built-in test runner
- Vitest + Testing Library
- Playwright smoke tests

## Run Locally

Requirements:

- Node.js 18+

Install and start the dev server:

```bash
npm install
npm run dev
```

Build the production bundle:

```bash
npm run build
```

Run unit + integration tests:

```bash
npm test
```

Run the smoke harness:

```bash
npm run test:smoke
```

## Project Structure

The project has moved beyond the older single-file prototype. The current structure is:

- [`src/App.jsx`](/home/corgea/Desktop/Meditation Game/src/App.jsx): main game loop, timers, drag interactions, breathe behavior, effect dispatch
- [`src/gameContent.mjs`](/home/corgea/Desktop/Meditation Game/src/gameContent.mjs): content pools for cards, modals, walkers, and fake stat labels
- [`src/gameObjects.mjs`](/home/corgea/Desktop/Meditation Game/src/gameObjects.mjs): spawn helpers, constants, random object generation, number formatting
- [`src/components/CardHand.jsx`](/home/corgea/Desktop/Meditation Game/src/components/CardHand.jsx): card rendering and pointer interaction wiring
- [`src/components/ModalLayer.jsx`](/home/corgea/Desktop/Meditation Game/src/components/ModalLayer.jsx): floating interruption UI for choice prompts, graphs, boards, emoji exchanges, and inbox popups
- [`src/components/WalkerLayer.jsx`](/home/corgea/Desktop/Meditation Game/src/components/WalkerLayer.jsx): moving ambient interruptions
- [`src/components/BackgroundLayer.jsx`](/home/corgea/Desktop/Meditation Game/src/components/BackgroundLayer.jsx): starfield, scanlines, vignette, urgency and dreary overlays
- [`src/components/FloaterLayer.jsx`](/home/corgea/Desktop/Meditation Game/src/components/FloaterLayer.jsx): floating response text
- [`src/components/NumberHud.jsx`](/home/corgea/Desktop/Meditation Game/src/components/NumberHud.jsx): meaningless total UI
- [`src/components/FooterNote.jsx`](/home/corgea/Desktop/Meditation Game/src/components/FooterNote.jsx): footer copy that reflects calm state
- [`src/App.css`](/home/corgea/Desktop/Meditation Game/src/App.css): global effect classes and root presentation
- [`src/components/*.css`](/home/corgea/Desktop/Meditation Game/src/components): component-specific styling
- [`tests/gameContent.test.mjs`](/home/corgea/Desktop/Meditation Game/tests/gameContent.test.mjs): basic invariants around content and fake outcomes
- [`tests/gameObjects.test.mjs`](/home/corgea/Desktop/Meditation Game/tests/gameObjects.test.mjs): unit coverage for interruption generator shapes
- [`tests/integration/*.test.jsx`](/home/corgea/Desktop/Meditation Game/tests/integration): integration coverage for modal interactions and app shell rendering
- [`tests/smoke/app.smoke.spec.js`](/home/corgea/Desktop/Meditation Game/tests/smoke/app.smoke.spec.js): Playwright smoke harness for the running app

## Current Content Model

### Cards

Cards are generated from `CARD_POOL` in [`src/gameContent.mjs`](/home/corgea/Desktop/Meditation Game/src/gameContent.mjs).

Current card categories:

- `number`
- `intrusive`
- `absurd`
- `neutral`
- `mystic`

Runtime temperaments:

- `steady`
- `jittery`
- `hovering`
- `elusive`
- `centralizing`

Important fields:

```js
{
  type: 'number',
  style: 'gold',
  cost: 1,
  title: '+500',
  flavor: 'That felt good.',
  effect: 'number',
  amount: 500,
}
```

`cost` is decorative only.

Current effect values:

- `number`
- `double`
- `shake`
- `blur`
- `flash`
- `shake+flash`
- `shake+blur`
- `soften`
- `glow`
- `glow+flash`
- `glow+soften`

### Interruptions

Interruptions are generated in [`src/gameObjects.mjs`](/home/corgea/Desktop/Meditation Game/src/gameObjects.mjs). Current popup types:

- `choice`
- `graph`
- `board`
- `emoji`
- `inbox`
- `draw`

`choice` prompts come from `MODAL_POOL`. Each option string is converted into an object with randomly generated decorative deltas across labels like `Clarity`, `Static`, `Momentum`, and `Importance`.

Those values are pure theater.

### Walkers

Walkers come from `WALKER_POOL`. Each entry defines:

- an `emoji`
- several opening `lines`
- several click `replies`

Walkers spawn from the left or right, pause near the lower middle of the screen, and then leave unless clicked first.

## Tunable Runtime Values

Most pacing lives in [`src/App.jsx`](/home/corgea/Desktop/Meditation Game/src/App.jsx) and [`src/gameObjects.mjs`](/home/corgea/Desktop/Meditation Game/src/gameObjects.mjs).

Current values worth knowing:

- Idle settle threshold: `12000ms`
- Base card cadence starts near `2800ms` and accelerates with fixation
- Base max active non-breathe cards starts at `5` and increases with fixation
- Card lifespan starts around `9000ms` to `16000ms` and stretches upward with fixation
- Modal spawn interval: `12000ms` to `21000ms`
- Max active modals: `3`
- Modal lifetime: `11000ms`
- Walker spawn interval: `10000ms`
- Max active walkers: `3`
- Drag threshold to play a card: `-90`
- Walker arrive delay: `80ms`
- Walker transition duration: `1600ms`
- Calm duration after `Breathe`: `3200ms`

## Where To Change Things

If you want to tune the current experience:

- Add or rewrite card text in [`src/gameContent.mjs`](/home/corgea/Desktop/Meditation Game/src/gameContent.mjs)
- Add modal prompts or fake-stat vocabulary in [`src/gameContent.mjs`](/home/corgea/Desktop/Meditation Game/src/gameContent.mjs)
- Add walker personalities, lines, and replies in [`src/gameContent.mjs`](/home/corgea/Desktop/Meditation Game/src/gameContent.mjs)
- Adjust object generation and shared constants in [`src/gameObjects.mjs`](/home/corgea/Desktop/Meditation Game/src/gameObjects.mjs)
- Adjust state flow, pacing, and effect application in [`src/App.jsx`](/home/corgea/Desktop/Meditation Game/src/App.jsx)
- Adjust global screen intensity in [`src/App.css`](/home/corgea/Desktop/Meditation Game/src/App.css)
- Adjust layer-specific look and feel in the component CSS files under [`src/components`](/home/corgea/Desktop/Meditation Game/src/components)

## Testing

The automated coverage now has three layers:

- unit tests verify content pools, fake stat output rules, interruption generator shapes, and fixation-driven card generation
- integration tests verify app-shell rendering, ambience controls, audio-start behavior, and idle-settle logic
- the smoke harness boots the running app in Playwright and checks that the current shell still exposes `Breathe` and ambience controls

If you add new content-generation rules or interactive interruption behavior, extend the relevant unit, integration, or smoke coverage so the project does not quietly drift into meaningful systems or broken UI states.
