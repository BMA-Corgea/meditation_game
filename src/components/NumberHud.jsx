import './NumberHud.css'

export function NumberHud({ label, bigNumber, numPop }) {
  return (
    <div className="hud">
      <div className="hud-label">{label}</div>
      <div className="hud-value">{bigNumber}</div>
      {numPop && <div key={numPop.k} className="num-pop">{numPop.text}</div>}
    </div>
  )
}
