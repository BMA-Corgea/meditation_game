import test from 'node:test'
import assert from 'node:assert/strict'

import {
  BREATHING_QUOTES,
  CARD_POOL,
  WALKER_POOL,
  FAKE_STAT_LABELS,
  makeOptionOutcome,
} from '../src/gameContent.mjs'

function makeRng(sequence) {
  let index = 0
  return () => {
    const value = sequence[index] ?? sequence[sequence.length - 1] ?? 0.5
    index += 1
    return value
  }
}

test('card pool includes blue neutral and legendary mystical thoughts', () => {
  assert.ok(CARD_POOL.some(card => card.type === 'neutral' && card.style === 'blue'))
  assert.ok(CARD_POOL.some(card => card.type === 'mystic' && card.style === 'legendary'))
})

test('walkers include click-response replies', () => {
  assert.ok(WALKER_POOL.every(walker => Array.isArray(walker.replies) && walker.replies.length > 0))
})

test('walker spawn data can safely carry replies into live instances', () => {
  const source = WALKER_POOL[0]
  const spawned = {
    emoji: source.emoji,
    text: source.lines[0],
    replies: source.replies,
  }

  assert.deepEqual(spawned.replies, source.replies)
  assert.ok(spawned.replies.length > 0)
})

test('fake stat output uses only decorative labels and between two and three deltas', () => {
  const outcome = makeOptionOutcome('Later', makeRng([0.1, 0.9, 0.2, 0.8, 0.3, 0.7, 0.4, 0.6]))

  assert.equal(outcome.label, 'Later')
  assert.ok(outcome.deltas.length >= 2 && outcome.deltas.length <= 3)
  assert.ok(outcome.deltas.every(delta => FAKE_STAT_LABELS.includes(delta.label)))
})

test('makeOptionOutcome is safe when used from Array.map', () => {
  const outcomes = ['Fix it', 'Later', 'Tomorrow'].map(option => makeOptionOutcome(option))

  assert.equal(outcomes.length, 3)
  assert.ok(outcomes.every(outcome => typeof outcome.label === 'string'))
})

test('fake stat output never becomes all positive or all negative', () => {
  const allPositiveAttempt = makeOptionOutcome('Optimize it', () => 0.99)
  const allNegativeAttempt = makeOptionOutcome('Optimize it', () => 0.0)

  assert.ok(allPositiveAttempt.deltas.some(delta => delta.delta < 0))
  assert.ok(allNegativeAttempt.deltas.some(delta => delta.delta > 0))
})

test('breathing quote pool contains twelve attributed quotes split across Alan Watts and Eckhart Tolle', () => {
  assert.equal(BREATHING_QUOTES.length, 12)

  const alanWattsCount = BREATHING_QUOTES.filter(quote => quote.author === 'Alan Watts').length
  const eckhartTolleCount = BREATHING_QUOTES.filter(quote => quote.author === 'Eckhart Tolle').length

  assert.equal(alanWattsCount, 6)
  assert.equal(eckhartTolleCount, 6)
  assert.ok(BREATHING_QUOTES.every(quote => typeof quote.text === 'string' && typeof quote.source === 'string'))
})
