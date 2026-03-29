import test from 'node:test'
import assert from 'node:assert/strict'

import { makeCard, makeModal } from '../src/gameObjects.mjs'

function withMockedRandom(value, fn) {
  const original = Math.random
  Math.random = () => value
  try {
    return fn()
  } finally {
    Math.random = original
  }
}

function makeSeededRng(seed) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

test('choice interruptions include three options with fake stat deltas', () => {
  const modal = withMockedRandom(0, () => makeModal())

  assert.equal(modal.type, 'choice')
  assert.equal(modal.options.length, 3)
  assert.ok(modal.options.every(option => Array.isArray(option.deltas) && option.deltas.length >= 2))
})

test('graph interruptions include protocol options', () => {
  const modal = withMockedRandom(0.21, () => makeModal())

  assert.equal(modal.type, 'graph')
  assert.equal(modal.options.length, 6)
  assert.ok(modal.options.every(option => typeof option === 'string'))
})

test('board interruptions include nine cells and arrow labels', () => {
  const modal = withMockedRandom(0.41, () => makeModal())

  assert.equal(modal.type, 'board')
  assert.equal(modal.cells.length, 9)
  assert.equal(modal.arrows.length, 3)
})

test('emoji interruptions include scene rows', () => {
  const modal = withMockedRandom(0.61, () => makeModal())

  assert.equal(modal.type, 'emoji')
  assert.equal(modal.scenes.length, 3)
  assert.ok(modal.scenes.every(scene => typeof scene.verb === 'string'))
})

test('inbox interruptions include mixed message rows', () => {
  const modal = withMockedRandom(0.81, () => makeModal())

  assert.equal(modal.type, 'inbox')
  assert.equal(modal.items.length, 4)
  assert.ok(modal.items.every(item => typeof item.from === 'string' && typeof item.subject === 'string'))
})

test('draw interruptions include prompt and omen only', () => {
  const modal = withMockedRandom(0.9, () => makeModal())

  assert.equal(modal.type, 'draw')
  assert.ok(typeof modal.prompt === 'string')
  assert.ok(typeof modal.omen === 'string')
})

test('higher settle levels reduce red and purple card incidence', () => {
  const agitatedRng = makeSeededRng(7)
  const settledRng = makeSeededRng(7)

  const agitated = Array.from({ length: 240 }, () => makeCard(0, agitatedRng))
  const settled = Array.from({ length: 240 }, () => makeCard(4, settledRng))

  const agitatedIntrusive = agitated.filter(card => card.style === 'dark' || card.style === 'urgent').length
  const settledIntrusive = settled.filter(card => card.style === 'dark' || card.style === 'urgent').length

  assert.ok(settledIntrusive < agitatedIntrusive)
})
