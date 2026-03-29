import './WalkerLayer.css'

export function WalkerLayer({ walkers, onWalkerClick }) {
  return walkers.map(walker => {
    const walkerLeft = walker.phase === 'present' ? `${walker.targetX}%` : walker.fromLeft ? '-14%' : '114%'

    return (
      <div
        key={walker.id}
        className={`walker walker-${walker.phase} walker-${walker.behavior ?? 'gentle'}`}
        style={{ left: walkerLeft, top: `${walker.y}%` }}
        onClick={() => onWalkerClick(walker)}
      >
        <div className="walker-bubble">{walker.text}</div>
        <div className="walker-emoji">{walker.emoji}</div>
      </div>
    )
  })
}
