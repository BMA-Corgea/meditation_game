import './DragZone.css'

export function DragZone({ visible, ready }) {
  if (!visible) return null

  return (
    <div className={`drag-zone${ready ? ' drag-zone-ready' : ''}`}>
      <span>{ready ? 'release to play' : 'drag higher'}</span>
    </div>
  )
}
