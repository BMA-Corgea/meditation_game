import {
  CARD_POOL,
  EMAIL_SENDERS,
  EMAIL_SUBJECTS,
  MODAL_POOL,
  MODAL_OMENS,
  TEXT_SENDERS,
  TEXT_SNIPPETS,
  makeOptionOutcome,
} from './gameContent.mjs'

export const STARS = Array.from({ length: 90 }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 1.6 + 0.3,
  opacity: Math.random() * 0.5 + 0.05,
  dur: 2.5 + Math.random() * 5,
  delay: Math.random() * 7,
}))

let currentId = 1

export const DRAG_THRESHOLD = -90
export const WALKER_ARRIVE_DELAY = 80
export const WALKER_TRANSITION = 1600
const CARD_TEMPERAMENTS = ['steady', 'jittery', 'hovering', 'elusive']
const INTERRUPTION_TYPES = ['choice', 'graph', 'board', 'emoji', 'inbox']
const GRAPH_LABELS = ['Urgency', 'Signal', 'Meaning', 'Follow-through', 'Static', 'Potential']
const BOARD_TOKENS = ['◌', '◍', '✦', '✳', '△', '☖', '☗', '☼']
const EMOJI_CAST = ['🙂', '😵', '🫠', '😶‍🌫️', '🤖', '🫧', '🪨', '💌', '📎', '🪴', '🫀', '🧠']
const EMOJI_VERBS = ['observing', 'escalating', 'mirroring', 'avoiding', 'misreading', 'hovering near', 'reacting to']
const INBOX_CHANNELS = ['email', 'text']

function pick(items) {
  return items[Math.floor(Math.random() * items.length)]
}

function pickWeighted(items, weightFn, rng = Math.random) {
  const weighted = items.map(item => ({ item, weight: Math.max(0, weightFn(item)) }))
  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0)
  if (total <= 0) return items[Math.floor(rng() * items.length)]

  let cursor = rng() * total
  for (const entry of weighted) {
    cursor -= entry.weight
    if (cursor <= 0) return entry.item
  }

  return weighted[weighted.length - 1].item
}

function cardWeight(template, settleLevel) {
  const calmBias = Math.min(0.85, settleLevel * 0.22)

  if (template.style === 'dark' || template.style === 'urgent') {
    return Math.max(0.08, 1 - calmBias)
  }

  if (template.style === 'blue') {
    return 1 + calmBias * 0.9
  }

  if (template.style === 'gold') {
    return 1 + calmBias * 0.35
  }

  if (template.style === 'legendary') {
    return 1 + calmBias * 0.2
  }

  return 1
}

function makeGraphInterruption() {
  return {
    type: 'graph',
    prompt: pick(['Projected trendline', 'Attention forecast', 'Decorative trajectory']),
    omen: pick(['Read too much into this.', 'Trend direction: dramatic.', 'Correlation remains ornamental.']),
    points: Array.from({ length: 6 }, (_, index) => ({
      key: `point-${index}`,
      label: GRAPH_LABELS[index],
      value: 18 + Math.round(Math.random() * 70),
      tone: Math.random() > 0.58 ? 'warn' : Math.random() > 0.5 ? 'dim' : 'good',
    })),
  }
}

function makeBoardInterruption() {
  return {
    type: 'board',
    prompt: pick(['Micro-positioning', 'Inner board logic', 'Symbolic endgame']),
    omen: pick(['Every move implies a mood.', 'Position advantage: uncertain.', 'The arrows insist on meaning.']),
    cells: Array.from({ length: 9 }, (_, index) => ({
      key: `cell-${index}`,
      token: Math.random() > 0.32 ? pick(BOARD_TOKENS) : '',
      emphasis: Math.random() > 0.72,
    })),
    arrows: Array.from({ length: 3 }, (_, index) => ({
      key: `arrow-${index}`,
      glyph: pick(['→', '↗', '↘', '↔', '↓']),
      label: pick(['commit', 'retreat', 'reframe', 'protect', 'overthink']),
    })),
  }
}

function makeEmojiInterruption() {
  return {
    type: 'emoji',
    prompt: pick(['Current interactions', 'Social simulation', 'Observed exchange']),
    omen: pick(['Reaction chain remains active.', 'Someone is reading into it.', 'Tone forecast: unstable.']),
    scenes: Array.from({ length: 3 }, (_, index) => ({
      key: `scene-${index}`,
      left: pick(EMOJI_CAST),
      verb: pick(EMOJI_VERBS),
      right: pick(EMOJI_CAST),
    })),
  }
}

function makeInboxInterruption() {
  return {
    type: 'inbox',
    prompt: pick(['Incoming messages', 'Unread cluster', 'Contact weather']),
    omen: pick(['Response burden is decorative.', 'Nothing here needs wisdom.', 'Unread energy continues to gather.']),
    items: Array.from({ length: 4 }, (_, index) => {
      const channel = pick(INBOX_CHANNELS)
      return {
        key: `msg-${index}`,
        channel,
        from: channel === 'email' ? pick(EMAIL_SENDERS) : pick(TEXT_SENDERS),
        subject: channel === 'email' ? pick(EMAIL_SUBJECTS) : pick(TEXT_SNIPPETS),
        stamp: `${1 + Math.floor(Math.random() * 58)}m`,
        unread: Math.random() > 0.35,
      }
    }),
  }
}

function makeChoiceInterruption() {
  const template = pick(MODAL_POOL)
  return {
    ...template,
    type: 'choice',
    options: template.options.map(option => makeOptionOutcome(option)),
    omen: pick(MODAL_OMENS),
  }
}

export function uid() {
  currentId += 1
  return currentId
}

export function makeCard(settleLevel = 0, rng = Math.random) {
  const template = pickWeighted(CARD_POOL, item => cardWeight(item, settleLevel), rng)
  const temperament = CARD_TEMPERAMENTS[Math.floor(rng() * CARD_TEMPERAMENTS.length)]
  const lifespanBase = 9000 + rng() * 7000
  return {
    ...template,
    id: uid(),
    born: Date.now(),
    temperament,
    lifespan:
      temperament === 'elusive'
        ? lifespanBase * 0.82
        : temperament === 'steady'
          ? lifespanBase * 1.08
          : lifespanBase,
    fading: false,
    tilt: (rng() - 0.5) * 5,
    drift: (rng() - 0.5) * 10,
    pulse: 3 + rng() * 3.5,
    personaX: 0,
    personaY: 0,
    jitterX: 0,
    jitterY: 0,
    temperRotate: 0,
    jitterBoost: 0,
  }
}

export function makeModal() {
  const type = pick(INTERRUPTION_TYPES)
  const base =
    type === 'choice'
      ? makeChoiceInterruption()
      : type === 'graph'
        ? makeGraphInterruption()
        : type === 'board'
          ? makeBoardInterruption()
          : type === 'emoji'
            ? makeEmojiInterruption()
            : makeInboxInterruption()

  return {
    ...base,
    id: uid(),
    x: 5 + Math.random() * 52,
    y: 6 + Math.random() * 28,
    dismiss: Date.now() + 11000,
  }
}

export function fmt(n) {
  if (n >= 1e15) return `${(n / 1e15).toFixed(1)} Vast`
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)} Omens`
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)} Echoes`
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} Murmurs`
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)} K`
  return Math.floor(n).toLocaleString()
}
