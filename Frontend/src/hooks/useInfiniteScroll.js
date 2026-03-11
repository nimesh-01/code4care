import { useRef, useCallback, useEffect } from 'react'

/**
 * Custom hook for infinite scroll using IntersectionObserver.
 * @param {Function} loadMore - Called when sentinel enters viewport
 * @param {boolean} hasMore - Whether there are more items to load
 * @param {boolean} loading - Whether a fetch is currently in progress
 * @returns {{ sentinelRef: Function }} - Callback ref to attach to the sentinel element
 */
export default function useInfiniteScroll(loadMore, hasMore, loading) {
  const observer = useRef(null)

  const sentinelRef = useCallback(
    (node) => {
      if (loading) return
      if (observer.current) observer.current.disconnect()
      if (!hasMore) return

      observer.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            loadMore()
          }
        },
        { rootMargin: '200px' }
      )

      if (node) observer.current.observe(node)
    },
    [loadMore, hasMore, loading]
  )

  useEffect(() => {
    return () => {
      if (observer.current) observer.current.disconnect()
    }
  }, [])

  return { sentinelRef }
}
