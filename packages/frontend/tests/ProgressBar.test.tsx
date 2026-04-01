import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import ProgressBar from '../src/components/VideoPlayer/ProgressBar'

describe('ProgressBar', () => {
  it('PLAY-06: fill width reflects progress percentage at 50%', () => {
    const { container } = render(<ProgressBar progress={0.5} />)
    const track = container.firstChild as HTMLElement
    const fill = track.firstChild as HTMLElement
    expect(fill.style.width).toBe('50%')
  })

  it('PLAY-06: fill width is 0% when progress is 0', () => {
    const { container } = render(<ProgressBar progress={0} />)
    const track = container.firstChild as HTMLElement
    const fill = track.firstChild as HTMLElement
    expect(fill.style.width).toBe('0%')
  })

  it('track has bg-white/30 class', () => {
    const { container } = render(<ProgressBar progress={0.5} />)
    const track = container.firstChild as HTMLElement
    expect(track.className).toContain('bg-white/30')
  })

  it('fill has bg-white class', () => {
    const { container } = render(<ProgressBar progress={0.5} />)
    const track = container.firstChild as HTMLElement
    const fill = track.firstChild as HTMLElement
    expect(fill.className).toContain('bg-white')
  })

  it('track has h-[2px] class', () => {
    const { container } = render(<ProgressBar progress={0.5} />)
    const track = container.firstChild as HTMLElement
    expect(track.className).toContain('h-[2px]')
  })
})
