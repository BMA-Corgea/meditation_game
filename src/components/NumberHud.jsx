import './NumberHud.css'

export function NumberHud({ label, bigNumber, numPop, quote }) {
  return (
    <>
      <div className="hud">
        <div className="hud-label">{label}</div>
        <div className="hud-value">{bigNumber}</div>
        {numPop && <div key={numPop.k} className="num-pop">{numPop.text}</div>}
      </div>
      {quote && (
        <div className="hud-quote">
          <div className="hud-quote-text">"{quote.text}"</div>
          <div className="hud-quote-attrib">{quote.author}</div>
        </div>
      )}
    </>
  )
}
