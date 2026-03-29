import { act, fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi, afterEach } from 'vitest'

import App, { IDLE_SETTLE_DELAY, shouldGainIdleSettle } from '../../src/App.jsx'

describe('App integration', () => {
  it('renders the core shell with breathe and ambience controls', () => {
    vi.spyOn(global.Math, 'random').mockReturnValue(0.5)

    render(<App />)

    expect(screen.getByRole('button', { name: /ambience on/i })).toBeTruthy()
    expect(screen.getByRole('slider', { name: /ambience volume/i })).toBeTruthy()
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

  it('starts ambience on the first pointer interaction without toggling it off and on', () => {
    vi.spyOn(global.Math, 'random').mockReturnValue(0.5)

    render(<App />)

    const playSpy = vi.spyOn(window.HTMLMediaElement.prototype, 'play')

    fireEvent.pointerDown(window, { pointerId: 1, clientX: 120, clientY: 120 })

    expect(playSpy).toHaveBeenCalled()

    Math.random.mockRestore()
  })

  it('updates the ambience volume slider value', () => {
    vi.spyOn(global.Math, 'random').mockReturnValue(0.5)

    render(<App />)

    const slider = screen.getByRole('slider', { name: /ambience volume/i })

    fireEvent.change(slider, { target: { value: '18' } })

    expect(slider.value).toBe('18')

    Math.random.mockRestore()
  })

  it('treats sustained non-interaction as settling', () => {
    const now = 100_000

    expect(shouldGainIdleSettle(now, now - IDLE_SETTLE_DELAY, now - IDLE_SETTLE_DELAY)).toBe(true)
    expect(shouldGainIdleSettle(now, now - IDLE_SETTLE_DELAY + 1, now - IDLE_SETTLE_DELAY)).toBe(false)
    expect(shouldGainIdleSettle(now, now - IDLE_SETTLE_DELAY, now - IDLE_SETTLE_DELAY + 1)).toBe(false)
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})
