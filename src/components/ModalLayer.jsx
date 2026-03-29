import { useState } from 'react'
import './ModalLayer.css'

function GraphInterruption({ modal }) {
  const [activeKey, setActiveKey] = useState(modal.points[0]?.key ?? null)

  return (
    <div className="modal-visual modal-visual-graph">
      <div className="modal-graph-chart">
        {modal.points.map(point => (
          <button
            type="button"
            key={point.key}
            className={`modal-graph-col${activeKey === point.key ? ' is-active' : ''}`}
            onClick={() => setActiveKey(point.key)}
          >
            <div className={`modal-graph-bar is-${point.tone}`} style={{ height: `${point.value}%` }} />
            <div className="modal-graph-label">{point.label}</div>
          </button>
        ))}
      </div>
      <div className="modal-graph-note">
        {modal.points.find(point => point.key === activeKey)?.label ?? 'Signal'} trend remains visually convincing.
      </div>
    </div>
  )
}

function BoardInterruption({ modal }) {
  const [selectedIndex, setSelectedIndex] = useState(null)
  const adjacent = new Set()

  if (selectedIndex !== null) {
    const row = Math.floor(selectedIndex / 3)
    const col = selectedIndex % 3
    ;[
      [row - 1, col],
      [row + 1, col],
      [row, col - 1],
      [row, col + 1],
    ].forEach(([r, c]) => {
      if (r >= 0 && r < 3 && c >= 0 && c < 3) adjacent.add(r * 3 + c)
    })
  }

  return (
    <div className="modal-visual modal-visual-board">
      <div className="modal-board-grid">
        {modal.cells.map((cell, index) => (
          <button
            type="button"
            key={cell.key}
            className={[
              'modal-board-cell',
              cell.emphasis ? 'is-hot' : '',
              selectedIndex === index ? 'is-selected' : '',
              adjacent.has(index) ? 'is-adjacent' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => setSelectedIndex(index)}
          >
            {cell.token}
          </button>
        ))}
      </div>
      <div className="modal-board-arrows">
        {modal.arrows.map(arrow => (
          <span key={arrow.key} className="modal-board-arrow">{arrow.glyph} {arrow.label}</span>
        ))}
      </div>
    </div>
  )
}

function EmojiInterruption({ modal }) {
  const [activeKey, setActiveKey] = useState(modal.scenes[0]?.key ?? null)

  return (
    <div className="modal-visual modal-visual-emoji">
      <div className="modal-emoji-list">
        {modal.scenes.map(scene => (
          <button
            type="button"
            key={scene.key}
            className={`modal-emoji-scene${activeKey === scene.key ? ' is-active' : ''}`}
            onClick={() => setActiveKey(scene.key)}
          >
            <span className="modal-emoji">{scene.left}</span>
            <span className="modal-emoji-verb">{scene.verb}</span>
            <span className="modal-emoji">{scene.right}</span>
          </button>
        ))}
      </div>
      <div className="modal-emoji-note">
        {modal.scenes.find(scene => scene.key === activeKey)?.verb ?? 'observing'} remains unresolved.
      </div>
    </div>
  )
}

function InboxInterruption({ modal }) {
  const [activeKey, setActiveKey] = useState(null)
  const [responses, setResponses] = useState({})

  const emojiOptions = ['👍', '👀', '😵', '🫠', '🔥', '🙏', '😬', '🫧', '💀']

  const chooseOptions = () => {
    const pool = [...emojiOptions].sort(() => Math.random() - 0.5)
    return pool.slice(0, 3)
  }

  const handleMessageClick = (itemKey) => {
    setActiveKey(itemKey)
    setResponses(prev => (
      prev[itemKey]
        ? prev
        : { ...prev, [itemKey]: { options: chooseOptions(), chosen: null } }
    ))
  }

  const handleEmojiPick = (itemKey, emoji) => {
    setResponses(prev => ({
      ...prev,
      [itemKey]: { ...prev[itemKey], chosen: emoji },
    }))
  }

  return (
    <div className="modal-visual modal-visual-inbox">
      <div className="modal-inbox-list">
        {modal.items.map(item => (
          <button
            type="button"
            key={item.key}
            className={`modal-inbox-item${item.unread ? ' is-unread' : ''}${activeKey === item.key ? ' is-active' : ''}`}
            onClick={() => handleMessageClick(item.key)}
          >
            <div className="modal-inbox-top">
              <span className="modal-inbox-from">{item.from}</span>
              <span className="modal-inbox-stamp">{item.stamp}</span>
            </div>
            <div className="modal-inbox-subject">{item.subject}</div>
            {activeKey === item.key && responses[item.key] && (
              <div className="modal-inbox-reply">
                <div className="modal-inbox-reply-label">
                  {responses[item.key].chosen ? `responded ${responses[item.key].chosen}` : 'quick react'}
                </div>
                <div className="modal-inbox-emoji-row">
                  {responses[item.key].options.map(emoji => (
                    <button
                      type="button"
                      key={emoji}
                      className={`modal-inbox-emoji${responses[item.key].chosen === emoji ? ' is-picked' : ''}`}
                      onClick={(event) => {
                        event.stopPropagation()
                        handleEmojiPick(item.key, emoji)
                      }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function ModalBody({ modal }) {
  if (modal.type === 'graph') {
    return (
      <GraphInterruption modal={modal} />
    )
  }

  if (modal.type === 'board') {
    return (
      <BoardInterruption modal={modal} />
    )
  }

  if (modal.type === 'emoji') {
    return (
      <EmojiInterruption modal={modal} />
    )
  }

  if (modal.type === 'inbox') {
    return (
      <InboxInterruption modal={modal} />
    )
  }

  return null
}

export function ModalLayer({ modals, onOption, onIgnore }) {
  return modals.map(modal => (
    <div
      key={modal.id}
      className={`modal modal-type-${modal.type}`}
      style={{ left: `${modal.x}%`, top: `${modal.y}%` }}
    >
      <p className="modal-prompt">{modal.prompt}</p>
      <div className="modal-omen">{modal.omen}</div>
      <ModalBody modal={modal} />
      {modal.type === 'choice' && (
        <div className="modal-opts">
          {modal.options.map(option => (
            <button key={option.label} className="modal-btn" onClick={() => onOption(modal, option)}>
              <span className="modal-btn-label">{option.label}</span>
              <span className="modal-btn-stats">
                {option.deltas.map(delta => (
                  <span key={delta.key} className={`modal-stat ${delta.delta > 0 ? 'is-up' : 'is-down'}`}>
                    {delta.delta > 0 ? '+' : ''}{delta.delta} {delta.label}
                  </span>
                ))}
              </span>
            </button>
          ))}
        </div>
      )}
      <div className="modal-ignore" onClick={() => onIgnore(modal.id)}>ignore</div>
    </div>
  ))
}
