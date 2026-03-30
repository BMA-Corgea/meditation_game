import './CardHand.css'

const TEMPERAMENT_BADGES = {
  steady: { glyph: 'calm', label: 'steady' },
  jittery: { glyph: 'buzz', label: 'jittery' },
  hovering: { glyph: 'drift', label: 'hovering' },
  elusive: { glyph: 'slip', label: 'elusive' },
  centralizing: { glyph: 'pull', label: 'centralizing' },
  breathe: { glyph: 'inhale', label: 'breathe' },
}

function CardItem({
  card,
  dragState,
  floating = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onPointerLeave,
}) {
  const dragging = dragState?.cardId === card.id
  const dy = dragging ? dragState.y - dragState.oy : 0
  const dx = dragging ? dragState.x - dragState.ox : 0
  const ready = dragging && dy < -90
  const badge = TEMPERAMENT_BADGES[card.type === 'breathe' ? 'breathe' : card.temperament] ?? TEMPERAMENT_BADGES.steady

  return (
    <div
      className={[
        floating ? 'card-slot' : 'card-row-slot',
        dragging ? 'card-slot-dragging' : '',
      ].filter(Boolean).join(' ')}
      style={floating ? {
        '--card-x': `${card.anchorX ?? 50}%`,
        '--card-y': `${card.anchorY ?? 74}%`,
        zIndex: dragging ? 240 : card.temperament === 'centralizing' ? 120 : 160,
        transition: card.temperament === 'elusive' ? 'none' : undefined,
      } : card.type === 'breathe' ? { zIndex: 320 } : undefined}
    >
      <div
        className={[
          'card',
          `card-${card.style}`,
          card.temperament ? `card-${card.temperament}` : '',
          card.fading ? 'card-fading' : '',
          card.played ? 'card-played' : '',
          dragging ? 'card-dragging' : '',
          ready ? 'card-ready' : '',
        ].filter(Boolean).join(' ')}
        style={{
          '--tilt': `${card.tilt}deg`,
          '--drift': `${card.drift ?? 0}px`,
          '--pulse': `${card.pulse ?? 4}s`,
          '--persona-x': `${card.personaX ?? 0}px`,
          '--persona-y': `${card.personaY ?? 0}px`,
          '--jitter-x': `${card.jitterX ?? 0}px`,
          '--jitter-y': `${card.jitterY ?? 0}px`,
          '--temper-rotate': `${card.temperRotate ?? 0}deg`,
          '--jitter-boost': `${card.jitterBoost ?? 0}px`,
          width: `${card.renderWidth ?? (card.type === 'breathe' ? 154 : 148)}px`,
          height: `${card.renderHeight ?? (card.type === 'breathe' ? 200 : 192)}px`,
          ...(dragging ? {
            transform: `translate(${dx}px, ${dy}px) scale(1.1) rotate(0deg)`,
            zIndex: 80,
            transition: 'box-shadow 0.12s, filter 0.12s',
            cursor: 'grabbing',
          } : {}),
        }}
        onPointerDown={event => onPointerDown(event, card)}
        onPointerMove={event => onPointerMove(event, card)}
        onPointerEnter={event => onPointerMove(event, card)}
        onPointerUp={event => onPointerUp(event, card)}
        onPointerCancel={onPointerCancel}
        onPointerLeave={() => onPointerLeave(card)}
      >
        <div className={`card-cost${card.type === 'breathe' ? ' cost-zero' : ''}`}>
          <span className="card-cost-glyph">{badge.glyph}</span>
          <span className="card-cost-label">{badge.label}</span>
        </div>
        <div className="card-art" />
        <div className="card-body">
          <div className="card-title">{card.title}</div>
          {card.flavor && <div className="card-flavor">{card.flavor}</div>}
        </div>
        {!dragging && <div className="drag-hint">↑</div>}
      </div>
    </div>
  )
}

export function CardHand(props) {
  const globalCardScale = 1 + props.fixationLevel * 0.08
  const breatheScale = Math.max(0.58, 1 - props.fixationLevel * 0.08)

  const breatheCard = {
    id: 'breathe',
    title: 'Breathe',
    flavor: 'Return without winning.',
    style: 'breathe',
    type: 'breathe',
    tilt: 0,
    drift: 0,
    pulse: 4.2,
    cost: 0,
    anchorX: 50,
    anchorY: 82,
    renderWidth: 154 * breatheScale,
    renderHeight: 200 * breatheScale,
  }
  const rowCards = [breatheCard, ...props.cards.filter(card => (
    card.temperament === 'steady' || card.temperament === 'jittery'
  )).map(card => ({
    ...card,
    renderWidth: 148 * globalCardScale,
    renderHeight: 192 * globalCardScale,
  }))]
  const floatingCards = props.cards.filter(card => (
    card.temperament === 'hovering' || card.temperament === 'elusive' || card.temperament === 'centralizing'
  )).map(card => ({
    ...card,
    renderWidth: 148 * globalCardScale * (card.temperament === 'centralizing' ? 1.75 : 1),
    renderHeight: 192 * globalCardScale * (card.temperament === 'centralizing' ? 1.75 : 1),
  }))
  const handClass = [
    'hand',
    props.urgentCount > 0 ? 'hand-has-urgent' : '',
    props.intrusiveCount > 0 ? 'hand-has-intrusive' : '',
    props.mysticCount > 0 ? 'hand-has-mystic' : '',
  ].filter(Boolean).join(' ')

  return (
    <div className={handClass}>
      <div className="hand-overlay">
        {floatingCards.map(card => (
          <CardItem key={card.id} card={card} floating {...props} />
        ))}
      </div>
      <div className="hand-cards" style={{ gap: `${0.85 * globalCardScale}rem` }}>
        {rowCards.map(card => (
          <CardItem key={card.id} card={card} {...props} />
        ))}
      </div>
    </div>
  )
}
