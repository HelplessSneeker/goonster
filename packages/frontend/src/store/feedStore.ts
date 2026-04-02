import { create } from 'zustand'

interface FeedStore {
  activeIndex: number
  isMuted: boolean
  setActiveIndex: (index: number) => void
  toggleMute: () => void
}

export const useFeedStore = create<FeedStore>((set) => ({
  activeIndex: 0,
  isMuted: true,   // starts muted (PLAY-02)
  setActiveIndex: (index) => set({ activeIndex: index }),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
}))
