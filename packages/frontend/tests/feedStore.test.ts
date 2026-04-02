import { describe, it, expect, beforeEach } from 'vitest'
import { useFeedStore } from '../src/store/feedStore'

describe('feedStore', () => {
  beforeEach(() => {
    // Reset store to initial state between tests
    useFeedStore.setState({ activeIndex: 0, isMuted: true })
  })

  it('has initial state activeIndex=0 and isMuted=true', () => {
    const state = useFeedStore.getState()
    expect(state.activeIndex).toBe(0)
    expect(state.isMuted).toBe(true)
  })

  it('setActiveIndex updates activeIndex', () => {
    useFeedStore.getState().setActiveIndex(3)
    expect(useFeedStore.getState().activeIndex).toBe(3)
  })

  it('toggleMute flips isMuted from true to false', () => {
    useFeedStore.getState().toggleMute()
    expect(useFeedStore.getState().isMuted).toBe(false)
  })

  it('toggleMute twice returns isMuted to true (D-05 mute persistence)', () => {
    useFeedStore.getState().toggleMute()
    useFeedStore.getState().toggleMute()
    expect(useFeedStore.getState().isMuted).toBe(true)
  })
})
