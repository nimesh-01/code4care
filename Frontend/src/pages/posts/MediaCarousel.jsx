import { useState, useRef, useEffect, useCallback } from 'react'
import { FaChevronLeft, FaChevronRight, FaVolumeUp, FaVolumeMute, FaPlay } from 'react-icons/fa'

const MediaCarousel = ({ media = [], imageUrl }) => {
  // Build media list — support legacy posts with only imageUrl
  const items = media.length > 0
    ? media
    : imageUrl ? [{ url: imageUrl, type: 'image' }] : []

  const [current, setCurrent] = useState(0)
  const [muted, setMuted] = useState(true)
  const [paused, setPaused] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState(0)
  const videoRefs = useRef({})
  const containerRef = useRef(null)
  const startX = useRef(null)
  const isDragging = useRef(false)

  const total = items.length
  const item = items[current]
  const isVideo = item?.type === 'video'

  // Pause videos that aren't on screen, play current video
  useEffect(() => {
    Object.entries(videoRefs.current).forEach(([idx, vid]) => {
      if (!vid) return
      if (parseInt(idx) === current) {
        vid.play().catch(() => {})
        setPaused(false)
      } else {
        vid.pause()
        vid.currentTime = 0
      }
    })
  }, [current])

  const goTo = useCallback((idx) => {
    if (idx < 0 || idx >= total) return
    setCurrent(idx)
  }, [total])

  const prev = () => goTo(current - 1)
  const next = () => goTo(current + 1)

  // Unified drag/swipe for touch + mouse
  const getClientX = (e) => {
    if (e.touches) return e.touches[0].clientX
    return e.clientX
  }

  const onDragStart = (e) => {
    if (total <= 1) return
    startX.current = getClientX(e)
    isDragging.current = true
    setDragging(true)
  }

  const onDragMove = (e) => {
    if (!isDragging.current || startX.current === null) return
    const diff = getClientX(e) - startX.current
    // Resist at edges
    if ((current === 0 && diff > 0) || (current === total - 1 && diff < 0)) {
      setDragOffset(diff * 0.3)
    } else {
      setDragOffset(diff)
    }
  }

  const onDragEnd = () => {
    if (!isDragging.current) return
    isDragging.current = false
    setDragging(false)
    const threshold = containerRef.current ? containerRef.current.offsetWidth * 0.15 : 60
    if (dragOffset < -threshold) next()
    else if (dragOffset > threshold) prev()
    setDragOffset(0)
    startX.current = null
  }

  const togglePlayPause = () => {
    if (isDragging.current) return
    const vid = videoRefs.current[current]
    if (!vid) return
    if (vid.paused) { vid.play(); setPaused(false) }
    else { vid.pause(); setPaused(true) }
  }

  if (items.length === 0) return null

  // Calculate slide offset for the strip
  // translateX % is relative to the element's own width (total * 100% of container)
  // so to move one slide we need 100/total %
  const getStripTransform = () => {
    const slidePercent = 100 / total
    const base = -(current * slidePercent)
    if (dragging && containerRef.current) {
      const pxPercent = (dragOffset / (containerRef.current.offsetWidth * total)) * 100
      return `translateX(${base + pxPercent}%)`
    }
    return `translateX(${base}%)`
  }

  return (
    <div
      ref={containerRef}
      className="relative select-none group bg-black"
      onMouseDown={onDragStart}
      onMouseMove={onDragMove}
      onMouseUp={onDragEnd}
      onMouseLeave={() => { if (isDragging.current) onDragEnd() }}
      onTouchStart={onDragStart}
      onTouchMove={onDragMove}
      onTouchEnd={onDragEnd}
    >
      {/* Fixed aspect-ratio container — prevents layout shift */}
      <div className="relative w-full aspect-square overflow-hidden">
        {/* Sliding strip */}
        <div
          className={`absolute inset-0 flex ${dragging ? '' : 'transition-transform duration-300 ease-out'}`}
          style={{ width: `${total * 100}%`, transform: getStripTransform() }}
        >
          {items.map((m, i) => (
            <div
              key={i}
              className="relative flex items-center justify-center bg-black"
              style={{ width: `${100 / total}%` }}
            >
              {m.type === 'video' ? (
                <>
                  <video
                    ref={el => { videoRefs.current[i] = el }}
                    src={m.url}
                    muted={muted}
                    loop
                    playsInline
                    autoPlay={i === current}
                    className="w-full h-full object-contain pointer-events-none"
                    onClick={togglePlayPause}
                  />
                  {/* Play overlay */}
                  {i === current && paused && (
                    <button
                      onClick={togglePlayPause}
                      className="absolute inset-0 flex items-center justify-center bg-black/20 z-10"
                    >
                      <FaPlay className="text-white text-4xl opacity-80" />
                    </button>
                  )}
                  {/* Mute button */}
                  {i === current && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setMuted(!muted) }}
                      className="absolute bottom-3 right-3 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition z-20"
                    >
                      {muted ? <FaVolumeMute size={14} /> : <FaVolumeUp size={14} />}
                    </button>
                  )}
                </>
              ) : (
                <img
                  src={m.url}
                  alt="Post"
                  className="w-full h-full object-contain"
                  loading="lazy"
                  draggable={false}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows (desktop hover) */}
      {total > 1 && (
        <>
          {current > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); prev() }}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-black/60 text-gray-800 dark:text-white w-8 h-8 flex items-center justify-center rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black/80 z-20"
            >
              <FaChevronLeft size={12} />
            </button>
          )}
          {current < total - 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); next() }}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-black/60 text-gray-800 dark:text-white w-8 h-8 flex items-center justify-center rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white dark:hover:bg-black/80 z-20"
            >
              <FaChevronRight size={12} />
            </button>
          )}

          {/* Dot indicators */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); goTo(i) }}
                className={`rounded-full transition-all ${
                  i === current
                    ? 'bg-white w-2 h-2'
                    : 'bg-white/50 w-1.5 h-1.5 hover:bg-white/75'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default MediaCarousel
