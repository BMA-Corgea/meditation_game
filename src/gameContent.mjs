import gameContent from './gameContent.json' assert { type: 'json' }

export const CARD_POOL = gameContent.cardPool
export const MODAL_POOL = gameContent.modalPool
export const WALKER_POOL = gameContent.walkerPool
export const FAKE_STAT_LABELS = gameContent.fakeStatLabels
export const MODAL_OMENS = gameContent.modalOmens
export const EMAIL_SUBJECTS = gameContent.emailSubjects
export const EMAIL_SENDERS = gameContent.emailSenders
export const TEXT_SENDERS = gameContent.textSenders
export const TEXT_SNIPPETS = gameContent.textSnippets
export const BREATHING_QUOTES = gameContent.breathingQuotes
export const FOOTER_NOTES = gameContent.footerNotes
export const CALM_FOOTER_NOTES = gameContent.calmFooterNotes
export const HUD_LABELS = gameContent.hudLabels

export function randomInt(min, max, rng = Math.random) {
  return Math.floor(rng() * (max - min + 1)) + min
}

export function makeOptionOutcome(label, rng = Math.random) {
  const shuffledStats = [...FAKE_STAT_LABELS].sort(() => rng() - 0.5)
  const changeCount = randomInt(2, 3, rng)
  const deltas = shuffledStats.slice(0, changeCount).map((stat, index) => ({
    key: `${label}-${stat}`,
    label: stat,
    delta: index === 0
      ? randomInt(2, 5, rng)
      : rng() > 0.5
        ? randomInt(1, 4, rng)
        : -randomInt(1, 4, rng),
  }))

  if (deltas.every(({ delta }) => delta > 0)) {
    deltas[deltas.length - 1] = {
      ...deltas[deltas.length - 1],
      delta: -randomInt(1, 3, rng),
    }
  }

  if (deltas.every(({ delta }) => delta < 0)) {
    deltas[0] = {
      ...deltas[0],
      delta: randomInt(2, 4, rng),
    }
  }

  return { label, deltas }
}
