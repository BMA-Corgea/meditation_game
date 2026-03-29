import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ModalLayer } from '../../src/components/ModalLayer.jsx'

describe('ModalLayer interactions', () => {
  it('lights adjacent squares when a board cell is clicked', async () => {
    const modal = {
      id: 'board-1',
      type: 'board',
      prompt: 'Inner board logic',
      omen: 'The arrows insist on meaning.',
      x: 10,
      y: 10,
      dismiss: Date.now() + 5000,
      cells: Array.from({ length: 9 }, (_, index) => ({ key: `cell-${index}`, token: `${index}`, emphasis: false })),
      arrows: [{ key: 'a', glyph: '→', label: 'commit' }],
    }

    render(<ModalLayer modals={[modal]} onOption={vi.fn()} onIgnore={vi.fn()} />)

    const cells = screen.getAllByRole('button').filter(button => button.className.includes('modal-board-cell'))
    await userEvent.click(cells[4])

    expect(cells[4].className).toContain('is-selected')
    expect(cells[1].className).toContain('is-adjacent')
    expect(cells[3].className).toContain('is-adjacent')
    expect(cells[5].className).toContain('is-adjacent')
    expect(cells[7].className).toContain('is-adjacent')
  })

  it('shows emoji reply options when an inbox message is clicked', async () => {
    const modal = {
      id: 'inbox-1',
      type: 'inbox',
      prompt: 'Incoming messages',
      omen: 'Unread energy continues to gather.',
      x: 12,
      y: 18,
      dismiss: Date.now() + 5000,
      items: [
        { key: 'msg-1', channel: 'text', from: 'Maya', subject: 'hey are you seeing this', stamp: '4m', unread: true },
      ],
    }

    render(<ModalLayer modals={[modal]} onOption={vi.fn()} onIgnore={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /maya/i }))

    const emojiButtons = screen.getAllByRole('button').filter(button => button.className.includes('modal-inbox-emoji'))
    expect(emojiButtons).toHaveLength(3)

    await userEvent.click(emojiButtons[0])
    expect(screen.getByText(/responded/i)).toBeTruthy()
  })

  it('keeps choice interruptions interactive through the option callback', async () => {
    const onOption = vi.fn()
    const modal = {
      id: 'choice-1',
      type: 'choice',
      prompt: 'What now?',
      omen: 'Projected impact: theatrical',
      x: 20,
      y: 20,
      dismiss: Date.now() + 5000,
      options: [
        {
          label: 'More urgency',
          deltas: [{ key: 'd1', label: 'Signal', delta: 2 }],
        },
      ],
    }

    render(<ModalLayer modals={[modal]} onOption={onOption} onIgnore={vi.fn()} />)

    await userEvent.click(screen.getByRole('button', { name: /more urgency/i }))
    expect(onOption).toHaveBeenCalledWith(modal, modal.options[0])
  })
})
