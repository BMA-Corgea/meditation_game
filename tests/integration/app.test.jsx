import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import App from '../../src/App.jsx'

describe('App integration', () => {
  it('renders the core shell with breathe and ambience controls', () => {
    vi.spyOn(global.Math, 'random').mockReturnValue(0.5)

    render(<App />)

    expect(screen.getByRole('button', { name: /ambience on/i })).toBeTruthy()
    expect(screen.getByText('Breathe')).toBeTruthy()

    Math.random.mockRestore()
  })
})
