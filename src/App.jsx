import { useState, useEffect, useRef, useCallback } from 'react'
import './App.css'
import ambienceTrack from '../Ambiance Music.mp3'
import {
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

export default function App() {
  const [cards, setCards] = useState(() => [makeCard(0), makeCard(0), makeCard(0)])
  const [bigNumber, setBigNumber] = useState(0)
  const [effects, setEffects] = useState([])
  const [modals, setModals] = useState([])
  const [calm, setCalm] = useState(false)
  const [calmBreath, setCalmBreath] = useState(false)
  const [floaters, setFloaters] = useState([])
  const [numPop, setNumPop] = useState(null)
  const [walkers, setWalkers] = useState([])
  const [dragState, setDragState] = useState(null)
  const [footerText, setFooterText] = useState(FOOTER_NOTES[0])
  const [hudLabel, setHudLabel] = useState(HUD_LABELS[0])
  const [scene, setScene] = useState('night')
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [audioStarted, setAudioStarted] = useState(false)
  const [settleLevel, setSettleLevel] = useState(0)

  const calmRef = useRef(false)
  const settleRef = useRef(0)
  const dragRef = useRef(null)
  const floatId = useRef(0)
  const walkerProcessed = useRef(new Set())
  const walkerTimers = useRef(new Map())
  const audioRef = useRef(null)

  useEffect(() => {
    calmRef.current = calm
  }, [calm])

  useEffect(() => {
    settleRef.current = settleLevel
  }, [settleLevel])

  useEffect(() => {
    const audio = new Audio(ambienceTrack)
    audio.loop = true
    audio.volume = 0.42
    audioRef.current = audio

    return () => {
      audio.pause()
      audioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!audioEnabled) {
      audioRef.current?.pause()
      return
    }

    if (audioStarted) {
      audioRef.current?.play().catch(() => {})
    }
  }, [audioEnabled, audioStarted])

  useEffect(() => {
    const beginAudio = () => {
      if (!audioEnabled || audioStarted || !audioRef.current) return
      setAudioStarted(true)
      audioRef.current.play().catch(() => {})
    }

    window.addEventListener('pointerdown', beginAudio, { passive: true })
    window.addEventListener('keydown', beginAudio)

    return () => {
      window.removeEventListener('pointerdown', beginAudio)
      window.removeEventListener('keydown', beginAudio)
    }
  }, [audioEnabled, audioStarted])

  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => {
      const next = !prev
      if (!next) {
        audioRef.current?.pause()
      } else {
        setAudioStarted(true)
        audioRef.current?.play().catch(() => {})
      }
      return next
    })
  }, [])

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
    setEffects([])
    setModals([])
    setFloaters([])
    setBigNumber(0)
    setNumPop(null)
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

    setTimeout(() => {
      setCalmBreath(false)
      setCalm(false)
    }, 3200)
  }, [addFloater])

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSettleLevel(prev => Math.max(0, prev - 1))
    }, 18000)

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
            if (age > card.lifespan - 1000 && !card.fading) return { ...card, fading: true }
            return card
          })
          .filter(Boolean)
      )
    }, 250)

    return () => clearInterval(intervalId)
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
    }

    dragRef.current = nextDragState
    setDragState(nextDragState)
  }, [addEffect, addFloater])

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
      setCards(prev => prev.filter(item => item.id !== card.id))
    }
  }, [addFloater, applyEffect, clearDragState, completeBreathe, rotateScene])

  const handleOption = useCallback((modal, option) => {
    const total = option.deltas.reduce((sum, delta) => sum + delta.delta, 0)
    addFloater(option.deltas.map(({ label, delta }) => `${delta > 0 ? '+' : ''}${delta} ${label.toLowerCase()}`).join('  '))
    addFloater(modal.omen.toLowerCase())
    addEffect(total >= 0 ? 'soften' : 'flash', total >= 0 ? 600 : 350)
    if (Math.abs(total) >= 4) {
      rotateScene()
    }
    setModals(prev => prev.filter(item => item.id !== modal.id))
  }, [addEffect, addFloater, rotateScene])

  const handleWalkerClick = useCallback((walker) => {
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
  }, [addEffect, addFloater])

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
      <button
        type="button"
        className={`audio-toggle${audioEnabled ? ' is-on' : ''}`}
        onClick={toggleAudio}
      >
        {audioEnabled ? 'ambience on' : 'ambience off'}
      </button>
      <BackgroundLayer
        stars={STARS}
        scene={scene}
        showUrgent={showUrgent}
        urgentCount={urgentCount}
        showDreary={showDreary}
        intrusiveCount={intrusiveCount}
        mysticCount={mysticCount}
      />
      <NumberHud label={hudLabel} bigNumber={fmt(bigNumber)} numPop={numPop} />
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
