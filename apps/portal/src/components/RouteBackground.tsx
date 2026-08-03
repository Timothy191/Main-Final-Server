'use client'

import { useEffect, useRef } from 'react'

/** Permanent ambient background — muted 120s H.264 wave under public/background/. */
const BACKGROUND_VIDEO_SRC = '/background/ps3-wave.1920x1080.mp4'
/** Poster shown before the first decoded frame (matches the wave clip). */
const BACKGROUND_POSTER_SRC = '/auth-bg-poster.jpg'
/** Approved ambient speed (65% of source). */
const PLAYBACK_RATE = 0.65
/** Re-assert play() if the browser pauses the ambient layer unexpectedly. */
const KEEP_ALIVE_MS = 2000

interface RouteBackgroundVideoProps {
  className: string
  videoRef: React.RefObject<HTMLVideoElement | null>
}

function RouteBackgroundVideo({ className, videoRef }: RouteBackgroundVideoProps) {
  return (
    <video
      ref={(node) => {
        if (node) {
          node.defaultMuted = true
          node.muted = true
        }
        if (videoRef) {
          ;(videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = node
        }
      }}
      className={className}
      src={BACKGROUND_VIDEO_SRC}
      poster={BACKGROUND_POSTER_SRC}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      disablePictureInPicture
      disableRemotePlayback
      tabIndex={-1}
      aria-hidden="true"
    />
  )
}

/**
 * Force a muted ambient video into the playing state.
 * Browsers require muted (+ playsInline on iOS) for autoplay; set both
 * properties before play() so attribute-only markup cannot race.
 */
export async function ensureAmbientVideoPlaying(video: HTMLVideoElement): Promise<boolean> {
  video.defaultMuted = true
  video.muted = true
  video.playsInline = true
  video.playbackRate = PLAYBACK_RATE

  if (!video.paused && !video.ended) {
    return true
  }

  try {
    await video.play()
    return true
  } catch {
    return false
  }
}

/**
 * RouteBackground — global ambient video background.
 *
 * Single muted looping MP4 with keep-alive: native `loop` + `autoPlay`,
 * plus pause/visibility/watchdog handlers so playback resumes whenever the
 * browser interrupts it. `prefers-reduced-motion: reduce` is the only
 * intentional stop (static fallback remains visible).
 */
export function RouteBackground() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const reducedMotionRef = useRef(false)
  const keepAliveIdRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const clearKeepAlive = () => {
      if (keepAliveIdRef.current !== null) {
        clearInterval(keepAliveIdRef.current)
        keepAliveIdRef.current = null
      }
    }

    const kickPlay = () => {
      if (reducedMotionRef.current) return
      void ensureAmbientVideoPlaying(video)
    }

    const startKeepAlive = () => {
      clearKeepAlive()
      keepAliveIdRef.current = setInterval(() => {
        if (reducedMotionRef.current) return
        if (document.visibilityState === 'hidden') return
        if (video.paused || video.ended) {
          void ensureAmbientVideoPlaying(video)
        } else if (video.playbackRate !== PLAYBACK_RATE) {
          video.playbackRate = PLAYBACK_RATE
        }
      }, KEEP_ALIVE_MS)
    }

    const stopPlayback = () => {
      clearKeepAlive()
      video.pause()
    }

    const startPlayback = () => {
      kickPlay()
      startKeepAlive()
    }

    const onPause = () => {
      // Native loop / tab switch / decoder stalls can fire pause — resume.
      if (reducedMotionRef.current) return
      if (document.visibilityState === 'hidden') return
      kickPlay()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        kickPlay()
      }
    }

    const onPageShow = () => {
      kickPlay()
    }

    const onCanPlay = () => {
      kickPlay()
    }

    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const applyMotionPreference = () => {
      reducedMotionRef.current = media.matches
      if (media.matches) {
        stopPlayback()
      } else {
        startPlayback()
      }
    }

    video.addEventListener('pause', onPause)
    video.addEventListener('ended', onPause)
    video.addEventListener('canplay', onCanPlay)
    video.addEventListener('loadeddata', onCanPlay)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onPageShow)
    window.addEventListener('focus', kickPlay)

    applyMotionPreference()
    media.addEventListener('change', applyMotionPreference)

    return () => {
      media.removeEventListener('change', applyMotionPreference)
      video.removeEventListener('pause', onPause)
      video.removeEventListener('ended', onPause)
      video.removeEventListener('canplay', onCanPlay)
      video.removeEventListener('loadeddata', onCanPlay)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onPageShow)
      window.removeEventListener('focus', kickPlay)
      clearKeepAlive()
    }
  }, [])

  return (
    <>
      <div className="route-bg-fallback" aria-hidden="true" />

      <div className="route-bg-orb route-bg-orb-a animate-wave-canvas-a" aria-hidden="true" />
      <div className="route-bg-orb route-bg-orb-b animate-wave-canvas-b" aria-hidden="true" />
      <div className="route-bg-orb route-bg-orb-c animate-wave-canvas-c" aria-hidden="true" />

      <div className="route-bg-video-container" aria-hidden="true">
        <RouteBackgroundVideo videoRef={videoRef} className="route-bg-video" />
      </div>

      <div className="route-bg-tint" aria-hidden="true" />
      <div className="route-bg-grain" aria-hidden="true" />
      <div className="route-bg-shimmer" aria-hidden="true" />
    </>
  )
}
