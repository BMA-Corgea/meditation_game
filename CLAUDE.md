# CLAUDE.md

## Project Summary

This project is a small React/Vite meditation toy that stages distraction rather than challenge. The player sits inside a loop of tempting cards, fake decisions, ambient interruptions, and a large meaningless total. The constant alternative is `Breathe`, which briefly clears the screen without turning calm into a score system.

The tone is surreal, lightly funny, and familiar in a psychological way. The design should keep inviting the player to notice urgency, not optimize it.

## Current Player Experience

- A persistent `Breathe` card sits in the hand at all times.
- Other cards rotate in automatically, fade out on their own, and can be played by dragging them upward until the drag zone says `release to play`.
- Number cards increase the `MEANINGLESS TOTAL`, sometimes by a fixed amount and sometimes by doubling it.
- Intrusive and absurd cards trigger visual effects such as shake, blur, flash, glow, or soften.
- Floating text appears after many interactions to echo card flavor, fake-stat outcomes, or walker replies.
- Interruptions appear periodically as a mix of `pick 3` prompts, nonsense graphs, tiny 3x3 boards, emoji exchanges, and fake inbox/text clusters.
- `Pick 3` prompts still show random positive and negative fake stat changes, but those values do not persist and do not affect gameplay.
- The other interruption types are also interactive: boards light adjacent tiles, messages expose emoji quick replies, and the visual popups can be focused by clicking their elements.
- Small walker entities drift onto the screen, speak briefly, and leave. Clicking them makes them exit early and spawn a reply floater.
- Clicking `Breathe` clears active effects, removes modals, dismisses walkers, fades out most cards, and puts the app into a short calm state before normal clutter resumes.

## Tech Stack

- React 18
- Vite 4
- No backend
- No router
- No persistence
- Node test runner for lightweight content tests

Scripts in `package.json`:

- `npm run dev` starts the Vite dev server.
- `npm run build` creates the production bundle.
- `npm test` runs the unit + integration suite.
- `npm run test:smoke` runs the Playwright smoke harness.

## Current Architecture

The app is no longer a single-file prototype. Runtime logic is centered in [`src/App.jsx`](/home/corgea/Desktop/Meditation Game/src/App.jsx), with data and rendering split into smaller modules.

Key files:

| File | Purpose |
|------|---------|
| [`src/App.jsx`](/home/corgea/Desktop/Meditation Game/src/App.jsx) | Main state, timers, effect application, drag handling, breathe behavior |
| [`src/gameContent.mjs`](/home/corgea/Desktop/Meditation Game/src/gameContent.mjs) | Card, modal, walker, and fake-stat content pools |
| [`src/gameObjects.mjs`](/home/corgea/Desktop/Meditation Game/src/gameObjects.mjs) | Spawn helpers, shared constants, number formatting, star generation |
| [`src/components/CardHand.jsx`](/home/corgea/Desktop/Meditation Game/src/components/CardHand.jsx) | Card rendering, breathe card injection, pointer wiring |
| [`src/components/ModalLayer.jsx`](/home/corgea/Desktop/Meditation Game/src/components/ModalLayer.jsx) | Floating interruption layer for choices, graphs, boards, emoji scenes, and inbox clutter |
| [`src/components/WalkerLayer.jsx`](/home/corgea/Desktop/Meditation Game/src/components/WalkerLayer.jsx) | Ambient walker interruptions |
| [`src/components/BackgroundLayer.jsx`](/home/corgea/Desktop/Meditation Game/src/components/BackgroundLayer.jsx) | Starfield and urgency/dreary overlays |
| [`src/components/NumberHud.jsx`](/home/corgea/Desktop/Meditation Game/src/components/NumberHud.jsx) | Meaningless total display and pop text |
| [`src/App.css`](/home/corgea/Desktop/Meditation Game/src/App.css) | Root-level screen effect classes and global app styling |
| [`src/components/*.css`](/home/corgea/Desktop/Meditation Game/src/components) | Per-layer component styling |
| [`tests/gameContent.test.mjs`](/home/corgea/Desktop/Meditation Game/tests/gameContent.test.mjs) | Unit coverage for content-shape invariants and fake-stat generation |
| [`tests/gameObjects.test.mjs`](/home/corgea/Desktop/Meditation Game/tests/gameObjects.test.mjs) | Unit coverage for interruption generator shapes |
| [`tests/integration/*.test.jsx`](/home/corgea/Desktop/Meditation Game/tests/integration) | Integration coverage for interactive interruption behavior and app render |
| [`tests/smoke/app.smoke.spec.js`](/home/corgea/Desktop/Meditation Game/tests/smoke/app.smoke.spec.js) | Playwright smoke harness for the live app shell |

## Content Model

### Cards

Cards come from `CARD_POOL` in [`src/gameContent.mjs`](/home/corgea/Desktop/Meditation Game/src/gameContent.mjs). Current categories include:

- `number`
- `intrusive`
- `absurd`
- `neutral`
- `mystic`

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

`cost` is decorative. It does not consume a resource.

Supported effect strings currently include:

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

Interruptions are generated in `makeModal()` and currently come in five types:

- `choice`
- `graph`
- `board`
- `emoji`
- `inbox`

`choice` prompts come from `MODAL_POOL`. `makeModal()` converts each string option into an object with random decorative stat deltas generated by `makeOptionOutcome()`.

Those deltas are display-only. They should stay fake.

### Walkers

Walkers come from `WALKER_POOL`. Each walker has:

```js
{
  emoji: '🐢',
  lines: ['excuse me', 'do you have a moment'],
  replies: ['understood', 'retreating politely'],
}
```

`lines` are used when the walker appears. `replies` are used when the player clicks the walker.

## Timing And Runtime Behavior

Important live values:

- Non-breathe cards are replenished every `2800ms` until there are 5 active cards.
- Cards live for `9000ms` to `16000ms` and start fading during the last second.
- Interruptions spawn every `12000ms` to `21000ms`, up to 3 at a time.
- Interruptions auto-dismiss after `11000ms`.
- Walkers attempt to spawn every `10000ms`, up to 3 at a time.
- Walker arrival delay is `80ms`.
- Walker transition time is `1600ms`.
- Calm state from `Breathe` lasts `3200ms`.
- Cards are played by dragging upward past `DRAG_THRESHOLD`, currently `-90`.

Core shared constants live in [`src/gameObjects.mjs`](/home/corgea/Desktop/Meditation Game/src/gameObjects.mjs).

## Editing Guidance

When making changes, preserve these truths:

- `Breathe` must remain always available.
- The fake stats in modals must remain fake.
- The big number can change, but it should remain meaningless.
- The experience should feel alive and interruptive, but not strategic.
- The player should never need to learn a build, economy, combat loop, or progression system.

Good changes:

- New card text with stronger tone or better pacing
- More decorative effect combinations
- More walker personalities and replies
- Better visual atmosphere
- Slightly better interaction clarity around dragging and breathing

Bad changes:

- Persistent stats with gameplay consequences
- Win/loss states
- Unlock systems or meta-progression
- Resource management, enemies, turns, or combat
- Making `Breathe` feel like a farmable reward button

## Testing Notes

The project now has three test layers:

- unit tests with Node's test runner for content and generator invariants
- integration tests with Vitest + Testing Library for UI interactions
- a Playwright smoke harness for the running app

If you add new content structures or generator rules, extend the relevant test layer instead of leaving the behavior unprotected.
