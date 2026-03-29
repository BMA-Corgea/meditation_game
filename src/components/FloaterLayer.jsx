import './FloaterLayer.css'

export function FloaterLayer({ floaters }) {
  return floaters.map(floater => (
    <div key={floater.id} className="floater" style={{ left: `${floater.x}%`, top: `${floater.y}%` }}>
      {floater.text}
    </div>
  ))
}
