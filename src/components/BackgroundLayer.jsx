import './BackgroundLayer.css'

export function BackgroundLayer({ stars, scene, showUrgent, urgentCount, showDreary, intrusiveCount, mysticCount }) {
  return (
    <>
      <div className={`starfield starfield-${scene}`}>
        {stars.map(star => (
          <div
            key={star.id}
            className="star"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              '--sdur': `${star.dur}s`,
              '--sdel': `${star.delay}s`,
            }}
          />
        ))}
      </div>
      <div className="ambient" />
      <div className="vignette" />
      <div className="scanlines" />
      {showUrgent && <div className="overlay-urgent" style={{ '--uc': urgentCount }} />}
      {showDreary && <div className="overlay-dreary" style={{ '--ic': intrusiveCount }} />}
      {mysticCount > 0 && <div className="overlay-mystic" style={{ '--mc': mysticCount }} />}
    </>
  )
}
