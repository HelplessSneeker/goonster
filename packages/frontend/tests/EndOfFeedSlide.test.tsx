import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import EndOfFeedSlide from '../src/components/Feed/EndOfFeedSlide'

describe('EndOfFeedSlide', () => {
  it('Test 8 (FEED-06): renders "You\'ve seen everything" text', () => {
    const { getByText } = render(<EndOfFeedSlide />)
    expect(getByText("You've seen everything")).toBeTruthy()
  })

  it('Test 9: has bg-black background class', () => {
    const { container } = render(<EndOfFeedSlide />)
    const wrapper = container.firstChild as HTMLElement
    expect(wrapper.classList.contains('bg-black')).toBe(true)
  })
})
