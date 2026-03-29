import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import ambienceTrack from './assets/media/Ambiance_Music.mp3'
import {
  BREATHING_QUOTES,
  WALKER_POOL,
  FOOTER_NOTES,
  CALM_FOOTER_NOTES,
  HUD_LABELS,
} from './gameContent.mjs'
import {
  DRAG_THRESHOLD,
  STARS,
  WALKER_ARRIVE_DELAY,
  WALKER_TRANSITION,
  fmt,
  makeCard,
  makeModal,
  uid,
} from './gameObjects.mjs'
import { BackgroundLayer } from './components/BackgroundLayer.jsx'
import { NumberHud } from './components/NumberHud.jsx'
import { WalkerLayer } from './components/WalkerLayer.jsx'
import { FloaterLayer } from './components/FloaterLayer.jsx'
import { DragZone } from './components/DragZone.jsx'
import { ModalLayer } from './components/ModalLayer.jsx'
import { CardHand } from './components/CardHand.jsx'
import { FooterNote } from './components/FooterNote.jsx'

const SCENES = ['night', 'dawn', 'rain', 'gold', 'office']
const clamp = (value, min, max) => Math.min(max, Math.max(min, value))
const SETTLE_MAX = 4
export const IDLE_SETTLE_DELAY = 12000
const CARD_X_MIN = 8
const CARD_X_MAX = 92
const CARD_Y_MIN = 20
const CARD_Y_MAX = 82

function shouldAllowStimulus(settleLevel, resistance, rng = Math.random) {
  const suppression = Math.min(0.82, settleLevel * resistance)
  return rng() >= suppression
}

function nextDifferent(items, current) {
  if (items.length <= 1) return current
  let next = current
  while (next === current) {
    next = items[Math.floor(Math.random() * items.length)]
  }
  return next
}

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)]
}

export function shouldGainIdleSettle(now, lastEngagedAt, lastIdleSettleAt, delay = IDLE_SETTLE_DELAY) {
  return now - lastEngagedAt >= delay && now - lastIdleSettleAt >= delay
}

export default function App() {
  const [cards, setCards] = useState(() => [makeCard(0), makeCard(0), makeCard(0)])
  const [bigNumber, setBigNumber] = useState(0)
  const [effects, setEffects] = useState([])
  const [modals, setModals] = useState([])
  const [calm, setCalm] = useState(false)
  const [calmBreath, setCalmBreath] = useState(false)
  const [floaters, setFloaters] = useState([])
  const [numPop, setNumPop] = useState(null)
  const [breathQuote, setBreathQuote] = useState(null)
  const [walkers, setWalkers] = useState([])
  const [dragState, setDragState] = useState(null)
  const [footerText, setFooterText] = useState(FOOTER_NOTES[0])
  const [hudLabel, setHudLabel] = useState(HUD_LABELS[0])
  const [scene, setScene] = useState('night')
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [audioStarted, setAudioStarted] = useState(false)
  const [audioVolume, setAudioVolume] = useState(42)
  const [settleLevel, setSettleLevel] = useState(0)

  const calmRef = useRef(false)
  const settleRef = useRef(0)
  const dragRef = useRef(null)
  const floatId = useRef(0)
  const walkerProcessed = useRef(new Set())
  const walkerTimers = useRef(new Map())
  const audioRef = useRef(null)
  const quoteTimerRef = useRef(null)
  const quoteClearTimerRef = useRef(null)
  const lastBreathQuoteIndexRef = useRef(-1)
  const lastEngagedAtRef = useRef(Date.now())
  const lastIdleSettleAtRef = useRef(Date.now())

  useEffect(() => {
    calmRef.current = calm
  }, [calm])

  useEffect(() => {
    settleRef.current = settleLevel
  }, [settleLevel])

  useEffect(() => () => {
    if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current)
    if (quoteClearTimerRef.current) clearTimeout(quoteClearTimerRef.current)
  }, [])

  useEffect(() => {
    const audio = new Audio(ambienceTrack)
    audio.loop = true
    audio.preload = 'auto'
    audio.volume = audioVolume / 100
    audioRef.current = audio

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = audioVolume / 100
  }, [audioVolume])

  const startAudio = useCallback(() => {
    if (!audioEnabled || !audioRef.current) return

    audioRef.current.play()
      .then(() => {
        setAudioStarted(true)
      })
      .catch(() => {})
  }, [audioEnabled])

  useEffect(() => {
    if (!audioEnabled) {
      audioRef.current?.pause()
      return
    }

    if (audioStarted) {
      startAudio()
    }
  }, [audioEnabled, audioStarted, startAudio])

  useEffect(() => {
    const beginAudio = () => {
      if (audioStarted) return
      startAudio()
    }

    window.addEventListener('pointerdown', beginAudio, { passive: true })
    window.addEventListener('touchstart', beginAudio, { passive: true })
    window.addEventListener('click', beginAudio, { passive: true })
    window.addEventListener('keydown', beginAudio)

    return () => {
      window.removeEventListener('pointerdown', beginAudio)
      window.removeEventListener('touchstart', beginAudio)
      window.removeEventListener('click', beginAudio)
      window.removeEventListener('keydown', beginAudio)
    }
  }, [audioStarted, startAudio])

  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => {
      const next = !prev
      if (!next) {
        audioRef.current?.pause()
      } else if (audioRef.current) {
        audioRef.current.play()
          .then(() => {
            setAudioStarted(true)
          })
          .catch(() => {})
      }
      return next
    })
  }, [])

  const handleVolumeChange = useCallback((event) => {
    setAudioVolume(Number(event.target.value))
    startAudio()
  }, [startAudio])

  const handleVolumePointerDown = useCallback(() => {
    startAudio()
  }, [startAudio])

  const addEffect = useCallback((name, dur) => {
    if (calmRef.current && name !== 'hush') return
    setEffects(prev => (prev.includes(name) ? prev : [...prev, name]))
    setTimeout(() => {
      setEffects(prev => prev.filter(effect => effect !== name))
    }, dur)
  }, [])

  const addFloater = useCallback((text) => {
    const id = floatId.current++
    setFloaters(prev => [...prev, { id, text, x: 10 + Math.random() * 80, y: 10 + Math.random() * 55 }])
    setTimeout(() => {
      setFloaters(prev => prev.filter(floater => floater.id !== id))
    }, 1900)
  }, [])

  const rotateScene = useCallback(() => {
    setScene(prev => nextDifferent(SCENES, prev))
  }, [])

  const registerEngagement = useCallback(() => {
    const now = Date.now()
    lastEngagedAtRef.current = now
    lastIdleSettleAtRef.current = now
  }, [])

  const applyEffect = useCallback((effect, amount) => {
    switch (effect) {
      case 'number': {
        const delta = amount ?? 500
        setBigNumber(prev => prev + delta)
        if (delta > 0) {
          setNumPop({ text: `+${fmt(delta)}`, k: Date.now() })
          setTimeout(() => setNumPop(null), 1100)
        }
        break
      }
      case 'double':
        setBigNumber(prev => {
          const next = prev === 0 ? 1000 : prev * 2
          setNumPop({ text: '×2!', k: Date.now() })
          setTimeout(() => setNumPop(null), 1100)
          return next
        })
        break
      case 'shake':
        addEffect('shake', 650)
        break
      case 'blur':
        addEffect('blur', 1100)
        break
      case 'flash':
        addEffect('flash', 450)
        break
      case 'shake+flash':
        addEffect('shake', 650)
        addEffect('flash', 450)
        break
      case 'shake+blur':
        addEffect('shake', 650)
        addEffect('blur', 1100)
        break
      case 'soften':
        addEffect('soften', 900)
        break
      case 'glow':
        addEffect('glow', 1200)
        break
      case 'glow+flash':
        addEffect('glow', 1200)
        addEffect('flash', 450)
        break
      case 'glow+soften':
        addEffect('glow', 1200)
        addEffect('soften', 900)
        break
      default:
        break
    }
  }, [addEffect])

  const completeBreathe = useCallback(() => {
    registerEngagement()
    if (quoteTimerRef.current) clearTimeout(quoteTimerRef.current)
    if (quoteClearTimerRef.current) clearTimeout(quoteClearTimerRef.current)
    setEffects([])
    setModals([])
    setFloaters([])
    setBigNumber(0)
    setNumPop(null)
    setBreathQuote(null)
    setCalmBreath(true)
    setCalm(true)
    setSettleLevel(prev => Math.min(SETTLE_MAX, prev + 1))
    setWalkers([])
    setCards([])
    setScene('gold')
    addFloater('inhale  release')
    walkerProcessed.current.clear()
    walkerTimers.current.forEach(timers => timers.forEach(clearTimeout))
    walkerTimers.current.clear()

    quoteTimerRef.current = setTimeout(() => {
      let nextIndex = Math.floor(Math.random() * BREATHING_QUOTES.length)
      if (BREATHING_QUOTES.length > 1) {
        while (nextIndex === lastBreathQuoteIndexRef.current) {
          nextIndex = Math.floor(Math.random() * BREATHING_QUOTES.length)
        }
      }
      lastBreathQuoteIndexRef.current = nextIndex
      setBreathQuote(BREATHING_QUOTES[nextIndex])
    }, 2000)

    quoteClearTimerRef.current = setTimeout(() => {
      setBreathQuote(null)
    }, 12000)

    setTimeout(() => {
      setCalmBreath(false)
      setCalm(false)
    }, 3200)
  }, [addFloater, registerEngagement])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSettleLevel(prev => Math.max(0, prev - 1))
    }, 18000)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now()
      if (!shouldGainIdleSettle(now, lastEngagedAtRef.current, lastIdleSettleAtRef.current)) return

      lastIdleSettleAtRef.current = now
      setSettleLevel(prev => Math.min(SETTLE_MAX, prev + 1))
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now()
      setCards(prev =>
        prev
          .map(card => {
            const age = now - card.born
            if (age > card.lifespan) return null
            if (age > card.lifespan - 1550 && !card.fading) return { ...card, fading: true, personaX: 0, personaY: 0, temperRotate: 0, jitterX: 0, jitterY: 0, jitterBoost: 0 }
            return card
          })
          .filter(Boolean)
      )
    }, 250)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (!cards.some(card => !card.deployed)) return

    const frameId = window.requestAnimationFrame(() => {
      setCards(prev => prev.map(card => (
        card.deployed
          ? card
          : card.temperament === 'elusive'
            ? {
                ...card,
                deployed: true,
              }
            : {
                ...card,
                anchorX: clamp(card.homeX, CARD_X_MIN, CARD_X_MAX),
                anchorY: clamp(card.homeY, CARD_Y_MIN, CARD_Y_MAX),
                deployed: true,
              }
      )))
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [cards])

  useEffect(() => {
    let frameId = 0

    const tick = () => {
      setCards(prev => {
        const movingIds = new Set(
          prev
            .filter(card => (
              card.temperament === 'elusive' &&
              !card.fading &&
              dragRef.current?.cardId !== card.id
            ))
            .map(card => card.id)
        )

        if (movingIds.size === 0) return prev

        const viewportWidth = Math.max(window.innerWidth || 1, 1)
        const viewportHeight = Math.max(window.innerHeight || 1, 1)
        const next = prev.map(card => movingIds.has(card.id) ? { ...card } : card)
        const elusiveCards = next.filter(card => movingIds.has(card.id))

        elusiveCards.forEach(card => {
          card.velocityX = (card.velocityX ?? 0) + (card.homeX - card.anchorX) * 0.0003
          card.velocityY = (card.velocityY ?? 0) + (card.homeY - card.anchorY) * 0.0003
        })

        for (let i = 0; i < elusiveCards.length; i += 1) {
          for (let j = i + 1; j < elusiveCards.length; j += 1) {
            const a = elusiveCards[i]
            const b = elusiveCards[j]
            const dxPx = ((b.anchorX - a.anchorX) / 100) * viewportWidth
            const dyPx = ((b.anchorY - a.anchorY) / 100) * viewportHeight
            const distance = Math.hypot(dxPx, dyPx) || 1
            const minDistance = 138

            if (distance >= minDistance) continue

            const overlap = minDistance - distance
            const nx = dxPx / distance
            const ny = dyPx / distance
            const shoveX = (overlap * nx * 0.11) / viewportWidth * 100
            const shoveY = (overlap * ny * 0.11) / viewportHeight * 100

            a.velocityX -= shoveX
            a.velocityY -= shoveY
            b.velocityX += shoveX
            b.velocityY += shoveY
          }
        }

        let changed = false
        elusiveCards.forEach(card => {
          const nextVelocityX = (card.velocityX ?? 0) * 0.86
          const nextVelocityY = (card.velocityY ?? 0) * 0.86
          const nextAnchorX = clamp(card.anchorX + nextVelocityX, CARD_X_MIN, CARD_X_MAX)
          const nextAnchorY = clamp(card.anchorY + nextVelocityY, CARD_Y_MIN, CARD_Y_MAX)

          if (
            Math.abs(nextAnchorX - card.anchorX) > 0.01 ||
            Math.abs(nextAnchorY - card.anchorY) > 0.01 ||
            Math.abs(nextVelocityX - (card.velocityX ?? 0)) > 0.01 ||
            Math.abs(nextVelocityY - (card.velocityY ?? 0)) > 0.01
          ) {
            changed = true
          }

          card.anchorX = nextAnchorX
          card.anchorY = nextAnchorY
          card.velocityX = nextVelocityX
          card.velocityY = nextVelocityY
        })

        return changed ? next : prev
      })

      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frameId)
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (calmRef.current) return
      if (!shouldAllowStimulus(settleRef.current, 0.16)) return
      setCards(prev => (prev.length >= 5 ? prev : [...prev, makeCard(settleRef.current)]))
    }, 2800)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    let timeoutId

    const schedule = () => {
      timeoutId = setTimeout(() => {
        if (!calmRef.current && shouldAllowStimulus(settleRef.current, 0.22)) {
          setModals(prev => (prev.length >= 3 ? prev : [...prev, makeModal()]))
        }
        schedule()
      }, 12000 + Math.random() * 9000)
    }

    schedule()
    return () => clearTimeout(timeoutId)
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now()
      setModals(prev => prev.filter(modal => modal.dismiss > now))
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (calmRef.current) return
      if (!shouldAllowStimulus(settleRef.current, 0.18)) return

      setWalkers(prev => {
        if (prev.length >= 3) return prev

        const entity = WALKER_POOL[Math.floor(Math.random() * WALKER_POOL.length)]
        const behavior = entity.behavior ?? 'gentle'
        const talkDuration =
          behavior === 'patient'
            ? 4600 + Math.random() * 2600
            : behavior === 'flicker'
              ? 2200 + Math.random() * 1800
              : 3200 + Math.random() * 2800

        return [
          ...prev,
          {
            id: uid(),
            emoji: entity.emoji,
            text: entity.lines[Math.floor(Math.random() * entity.lines.length)],
            lines: entity.lines,
            replies: entity.replies,
            behavior,
            clicks: 0,
            fromLeft: Math.random() > 0.5,
            targetX: 10 + Math.random() * 68,
            y: 46 + Math.random() * 16,
            phase: 'entering',
            talkDuration,
          },
        ]
      })
    }, 10000)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    walkers.forEach(walker => {
      if (walker.phase !== 'entering') return
      if (walkerProcessed.current.has(walker.id)) return
      walkerProcessed.current.add(walker.id)

      const timers = []

      timers.push(setTimeout(() => {
        setWalkers(prev => prev.map(item => (item.id === walker.id ? { ...item, phase: 'present' } : item)))
      }, WALKER_ARRIVE_DELAY))

      if (walker.behavior === 'flicker') {
        timers.push(setTimeout(() => {
          setWalkers(prev => prev.map(item => {
            if (item.id !== walker.id || item.phase !== 'present') return item
            return { ...item, text: randomFrom(item.lines) }
          }))
        }, WALKER_ARRIVE_DELAY + 900))
      }

      timers.push(setTimeout(() => {
        setWalkers(prev => prev.map(item => (item.id === walker.id ? { ...item, phase: 'exiting' } : item)))
      }, WALKER_ARRIVE_DELAY + WALKER_TRANSITION + walker.talkDuration))

      timers.push(setTimeout(() => {
        setWalkers(prev => prev.filter(item => item.id !== walker.id))
        walkerProcessed.current.delete(walker.id)
        walkerTimers.current.delete(walker.id)
      }, WALKER_ARRIVE_DELAY + WALKER_TRANSITION + walker.talkDuration + WALKER_TRANSITION + 500))

      walkerTimers.current.set(walker.id, timers)
    })
  }, [walkers])

  useEffect(() => () => {
    walkerTimers.current.forEach(timers => timers.forEach(clearTimeout))
    walkerTimers.current.clear()
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setFooterText(prev => {
        const pool = calmRef.current ? CALM_FOOTER_NOTES : FOOTER_NOTES
        return nextDifferent(pool, prev)
      })
    }, 5200)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    setFooterText(randomFrom(calm ? CALM_FOOTER_NOTES : FOOTER_NOTES))
  }, [calm])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setHudLabel(prev => nextDifferent(HUD_LABELS, prev))
    }, 7600)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const intervalId = setInterval(() => {
      rotateScene()
    }, 18000)

    return () => clearInterval(intervalId)
  }, [rotateScene])

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (calmRef.current) return
      if (!shouldAllowStimulus(settleRef.current, 0.12)) return
      if (Math.random() < 0.42) {
        addEffect('hush', 2200)
        addFloater(randomFrom(['beautiful nothing', 'the room loosens', 'nothing required', 'briefly enough']))
        setScene('dawn')
      }
    }, 26000)

    return () => clearInterval(intervalId)
  }, [addEffect, addFloater])

  const handlePointerDown = useCallback((event, card) => {
    if (card.type === 'breathe' && calmRef.current) return
    startAudio()
    registerEngagement()

    if (card.temperament === 'elusive' && Date.now() - card.born < 1300) {
      addFloater('too eager')
      addEffect('soften', 500)
      setCards(prev => prev.filter(item => item.id !== card.id))
      return
    }

    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()

    const nextDragState = {
      cardId: card.id,
      ox: event.clientX,
      oy: event.clientY,
      x: event.clientX,
      y: event.clientY,
      anchorX: card.anchorX ?? 50,
      anchorY: card.anchorY ?? 74,
    }

    dragRef.current = nextDragState
    setDragState(nextDragState)
  }, [addEffect, addFloater, registerEngagement, startAudio])

  const clearDragState = useCallback(() => {
    dragRef.current = null
    setDragState(null)
  }, [])

  const resetCardPersonality = useCallback((cardId) => {
    setCards(prev => prev.map(card => (
      card.id === cardId
        ? { ...card, personaX: 0, personaY: 0, jitterX: 0, jitterY: 0, temperRotate: 0, jitterBoost: 0 }
        : card
    )))
  }, [])

  const handlePointerMove = useCallback((event, card) => {
    const currentDrag = dragRef.current
    if (currentDrag?.cardId === card.id) {
      const nextDragState = { ...currentDrag, x: event.clientX, y: event.clientY }
      dragRef.current = nextDragState
      setDragState(nextDragState)
      return
    }

    if (card.type === 'breathe') return

    const rect = event.currentTarget.getBoundingClientRect()
    const localX = event.clientX - rect.left
    const localY = event.clientY - rect.top
    const centerX = rect.width / 2
    const centerY = rect.height / 2
    const dx = localX - centerX
    const dy = localY - centerY
    const distance = Math.hypot(dx, dy) || 1
    const nx = dx / distance
    const ny = dy / distance

    setCards(prev => prev.map(item => {
      if (item.id !== card.id) return item

      if (item.temperament === 'elusive') {
        const pressure = clamp((150 - distance) / 150, 0, 1)
        const kick = 16 + pressure * 26
        return {
          ...item,
          personaX: clamp(-nx * kick + (Math.random() - 0.5) * 8, -36, 36),
          personaY: clamp(-ny * kick + (Math.random() - 0.5) * 8, -28, 22),
          temperRotate: clamp(-nx * 8, -10, 10),
          jitterX: 0,
          jitterY: 0,
          jitterBoost: pressure * 3,
        }
      }

      if (item.temperament === 'jittery') {
        return {
          ...item,
          personaX: clamp(-dx * 0.05, -8, 8),
          personaY: clamp(-dy * 0.05, -6, 6),
          jitterX: (Math.random() - 0.5) * 8,
          jitterY: (Math.random() - 0.5) * 8,
          temperRotate: clamp((Math.random() - 0.5) * 7, -7, 7),
          jitterBoost: 6,
        }
      }

      if (item.temperament === 'hovering') {
        return {
          ...item,
          personaX: clamp(dx * 0.14, -12, 12),
          personaY: clamp(dy * 0.1 - 6, -16, 8),
          jitterX: 0,
          jitterY: 0,
          temperRotate: clamp(dx * 0.04, -4, 4),
          jitterBoost: 0,
        }
      }

      return {
        ...item,
        personaX: clamp(dx * 0.05, -4, 4),
        personaY: clamp(dy * 0.04, -4, 4),
        jitterX: 0,
        jitterY: 0,
        temperRotate: clamp(dx * 0.02, -2, 2),
        jitterBoost: 0,
      }
    }))
  }, [])

  const handleCardPointerLeave = useCallback((card) => {
    if (dragRef.current?.cardId === card.id) return
    resetCardPersonality(card.id)
  }, [resetCardPersonality])

  const handlePointerUp = useCallback((event, card) => {
    const currentDrag = dragRef.current
    if (!currentDrag || currentDrag.cardId !== card.id) return

    clearDragState()

    if (currentDrag.y - currentDrag.oy < DRAG_THRESHOLD) {
      if (card.type === 'breathe') {
        completeBreathe()
        return
      }

      applyEffect(card.effect, card.amount)
      if (card.flavor) addFloater(card.flavor)
      if (card.style === 'legendary' || card.temperament === 'hovering') {
        rotateScene()
      }
      setCards(prev => prev.map(item => item.id === card.id ? { ...item, played: true, fading: false, personaX: 0, personaY: 0, temperRotate: 0, jitterX: 0, jitterY: 0, jitterBoost: 0 } : item))
      setTimeout(() => {
        setCards(prev => prev.filter(item => item.id !== card.id))
      }, 540)
      return
    }

    if (card.type === 'breathe' || card.temperament === 'steady' || card.temperament === 'jittery') {
      return
    }

    const viewportWidth = Math.max(window.innerWidth || 1, 1)
    const viewportHeight = Math.max(window.innerHeight || 1, 1)
    const dxPct = ((currentDrag.x - currentDrag.ox) / viewportWidth) * 100
    const dyPct = ((currentDrag.y - currentDrag.oy) / viewportHeight) * 100

    setCards(prev => prev.map(item => (
      item.id === card.id
        ? {
            ...item,
            anchorX: clamp(currentDrag.anchorX + dxPct, CARD_X_MIN, CARD_X_MAX),
            anchorY: clamp(currentDrag.anchorY + dyPct, CARD_Y_MIN, CARD_Y_MAX),
            homeX: clamp(currentDrag.anchorX + dxPct, CARD_X_MIN, CARD_X_MAX),
            homeY: clamp(currentDrag.anchorY + dyPct, CARD_Y_MIN, CARD_Y_MAX),
            deployed: true,
            velocityX: 0,
            velocityY: 0,
          }
        : item
    )))
  }, [addFloater, applyEffect, clearDragState, completeBreathe, rotateScene])

  const handleOption = useCallback((modal, option) => {
    startAudio()
    registerEngagement()
    const total = option.deltas.reduce((sum, delta) => sum + delta.delta, 0)
    addFloater(option.deltas.map(({ label, delta }) => `${delta > 0 ? '+' : ''}${delta} ${label.toLowerCase()}`).join('  '))
    addFloater(modal.omen.toLowerCase())
    addEffect(total >= 0 ? 'soften' : 'flash', total >= 0 ? 600 : 350)
    if (Math.abs(total) >= 4) {
      rotateScene()
    }
    setModals(prev => prev.filter(item => item.id !== modal.id))
  }, [addEffect, addFloater, registerEngagement, rotateScene, startAudio])

  const handleWalkerClick = useCallback((walker) => {
    startAudio()
    registerEngagement()
    if (walker.phase === 'exiting') return

    const timers = walkerTimers.current.get(walker.id) ?? []
    const replies = Array.isArray(walker.replies) && walker.replies.length > 0 ? walker.replies : ['drifting off']
    const reply = replies[Math.floor(Math.random() * replies.length)]

    if (walker.behavior === 'patient' && walker.clicks === 0) {
      addFloater(`${walker.emoji} taking its time`)
      addEffect('soften', 550)
      setWalkers(prev => prev.map(item => (
        item.id === walker.id
          ? { ...item, clicks: 1, text: randomFrom(['still arriving', 'one moment', 'not finished appearing']) }
          : item
      )))
      return
    }

    if (walker.behavior === 'watchful' && walker.clicks === 0) {
      addFloater(`${walker.emoji} noted`)
      addEffect('flash', 300)
      setWalkers(prev => prev.map(item => (
        item.id === walker.id
          ? { ...item, clicks: 1, text: randomFrom(item.lines) }
          : item
      )))
      return
    }

    timers.forEach(clearTimeout)
    walkerTimers.current.delete(walker.id)

    addFloater(`${walker.emoji} ${reply}`)
    addEffect(walker.behavior === 'flicker' ? 'flash' : 'soften', walker.behavior === 'flicker' ? 320 : 700)
    setWalkers(prev => prev.map(item => (item.id === walker.id ? { ...item, phase: 'exiting' } : item)))

    setTimeout(() => {
      setWalkers(prev => prev.filter(item => item.id !== walker.id))
      walkerProcessed.current.delete(walker.id)
    }, walker.behavior === 'skittish' ? 420 : 650)
  }, [addEffect, addFloater, registerEngagement, startAudio])

  const activeCards = cards.filter(card => !card.fading)
  const urgentCount = activeCards.filter(card => card.style === 'urgent').length
  const intrusiveCount = activeCards.filter(card => card.style === 'dark').length
  const mysticCount = activeCards.filter(card => card.style === 'legendary').length
  const showUrgent = urgentCount > 0 && !calm
  const showDreary = intrusiveCount > 0 && !calm

  const isDraggingAny = dragState !== null
  const globalDy = dragState ? dragState.y - dragState.oy : 0
  const isGlobalReady = isDraggingAny && globalDy < DRAG_THRESHOLD

  const rootClass = [
    'app',
    `scene-${scene}`,
    ...effects,
    calmBreath ? 'calm-breath' : '',
    calm ? 'calm-active' : '',
    showDreary ? 'dreary' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={rootClass}>
      <div className="audio-controls">
        <button
          type="button"
          className={`audio-toggle${audioEnabled ? ' is-on' : ''}`}
          onPointerDown={startAudio}
          onClick={toggleAudio}
        >
          {audioEnabled ? 'ambience on' : 'ambience off'}
        </button>
        <label className="audio-volume">
          <span className="audio-volume-label">volume</span>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={audioVolume}
            onPointerDown={handleVolumePointerDown}
            onChange={handleVolumeChange}
            aria-label="Ambience volume"
          />
        </label>
      </div>
      <BackgroundLayer
        stars={STARS}
        scene={scene}
        showUrgent={showUrgent}
        urgentCount={urgentCount}
        showDreary={showDreary}
        intrusiveCount={intrusiveCount}
        mysticCount={mysticCount}
      />
      <NumberHud label={hudLabel} bigNumber={fmt(bigNumber)} numPop={numPop} quote={breathQuote} />
      <WalkerLayer walkers={walkers} onWalkerClick={handleWalkerClick} />
      <FloaterLayer floaters={floaters} />
      <DragZone visible={isDraggingAny} ready={isGlobalReady} />
      <ModalLayer
        modals={modals}
        onOption={handleOption}
        onIgnore={modalId => setModals(prev => prev.filter(modal => modal.id !== modalId))}
      />
      <CardHand
        cards={cards}
        dragState={dragState}
        urgentCount={urgentCount}
        intrusiveCount={intrusiveCount}
        mysticCount={mysticCount}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={clearDragState}
        onPointerLeave={handleCardPointerLeave}
      />
      <FooterNote text={footerText} />
    </div>
  )
}
