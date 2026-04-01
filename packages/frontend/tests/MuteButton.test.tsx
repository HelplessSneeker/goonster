import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import MuteButton from '../src/components/VideoPlayer/MuteButton'

describe('MuteButton', () => {
  it('PLAY-03: renders mute button with aria-label "Unmute" when muted', () => {
    render(<MuteButton isMuted={true} onToggle={vi.fn()} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Unmute')
  })

  it('PLAY-03: renders mute button with aria-label "Mute" when unmuted', () => {
    render(<MuteButton isMuted={false} onToggle={vi.fn()} />)
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Mute')
  })

  it('PLAY-03: clicking button calls onToggle', () => {
    const onToggle = vi.fn()
    render(<MuteButton isMuted={true} onToggle={onToggle} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('MOBL-03: button has min-w-[44px] and min-h-[44px] for 44px touch target', () => {
    render(<MuteButton isMuted={true} onToggle={vi.fn()} />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('min-w-[44px]')
    expect(button.className).toContain('min-h-[44px]')
  })

  it('button has pointer-events-auto class', () => {
    render(<MuteButton isMuted={true} onToggle={vi.fn()} />)
    const button = screen.getByRole('button')
    expect(button.className).toContain('pointer-events-auto')
  })
})
