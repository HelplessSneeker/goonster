import { useRef } from 'react'
import type { Swiper as SwiperType } from 'swiper'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Mousewheel } from 'swiper/modules'
import 'swiper/css'
import { useFeedStore } from '../../store/feedStore'
import { useFeed } from '../../hooks/useFeed'
import FeedSlide from './FeedSlide'
import EndOfFeedSlide from './EndOfFeedSlide'

export default function FeedContainer() {
  const swiperRef = useRef<SwiperType>(undefined)
  const { setActiveIndex, activeIndex } = useFeedStore()
  const { allVideos, fetchNextPage, hasNextPage, isPending, isError } = useFeed()

  const handleSlideChange = (swiper: SwiperType) => {
    const newIndex = swiper.activeIndex
    setActiveIndex(newIndex)

    // End-of-feed lock (D-09, FEED-06)
    if (newIndex >= allVideos.length) {
      swiper.allowSlideNext = false
    } else {
      swiper.allowSlideNext = true
    }

    // Fetch more pages when approaching end (3 videos before end)
    if (hasNextPage && newIndex >= allVideos.length - 3) {
      fetchNextPage()
    }
  }

  if (isPending) {
    return (
      <div className="fullscreen-container bg-black flex items-center justify-center">
        <span className="text-white text-base">Loading...</span>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="fullscreen-container bg-black flex items-center justify-center">
        <span className="text-white text-sm font-semibold">
          Could not load video. Check your connection and try again.
        </span>
      </div>
    )
  }

  if (allVideos.length === 0) {
    return (
      <div className="fullscreen-container bg-black flex items-center justify-center flex-col gap-2">
        <span className="text-white text-base">No videos available</span>
        <span className="text-white/60 text-sm">
          Check back later or verify the backend is running.
        </span>
      </div>
    )
  }

  return (
    <div className="fullscreen-container bg-black">
      <Swiper
        modules={[Mousewheel]}
        direction="vertical"
        slidesPerView={1}
        speed={250}
        resistance={false}
        mousewheel={{ forceToAxis: true }}
        onSwiper={(s) => { swiperRef.current = s }}
        onSlideChange={handleSlideChange}
        className="h-full w-full"
      >
        {allVideos.map((video, index) => (
          <SwiperSlide key={video.id}>
            <FeedSlide video={video} isActive={index === activeIndex} />
          </SwiperSlide>
        ))}
        <SwiperSlide key="end-of-feed">
          <EndOfFeedSlide />
        </SwiperSlide>
      </Swiper>
    </div>
  )
}
