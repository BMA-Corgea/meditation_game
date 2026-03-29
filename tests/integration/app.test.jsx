import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'

import App from '../../src/App.jsx'

describe('App integration', () => {
  it('renders the core shell with breathe and ambience controls', () => {
    vi.spyOn(global.Math, 'random').mockReturnValue(0.5)

    render(<App />)

    expect(screen.getByRole('button', { name: /ambience on/i })).toBeTruthy()
    expect(screen.getByText('Breathe')).toBeTruthy()

    Math.random.mockRestore()
  })

  it('shows a delayed breathing quote after playing breathe', () => {
    vi.useFakeTimers()
    vi.spyOn(global.Math, 'random').mockReturnValue(0)

    render(<App />)

    const breatheCard = screen.getByText('Breathe').closest('.card')

    fireEvent.pointerDown(breatheCard, { pointerId: 1, clientX: 100, clientY: 100 })
    fireEvent.pointerMove(breatheCard, { pointerId: 1, clientX: 100, clientY: 0 })
    fireEvent.pointerUp(breatheCard, { pointerId: 1, clientX: 100, clientY: 0 })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByText(/muddy water is best cleared by leaving it alone\./i)).toBeTruthy()
    expect(screen.getByText(/alan watts/i)).toBeTruthy()

    Math.random.mockRestore()
    vi.useRealTimers()
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})
