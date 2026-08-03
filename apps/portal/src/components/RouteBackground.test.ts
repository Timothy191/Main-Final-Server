import { ensureAmbientVideoPlaying } from './RouteBackground'

describe('ensureAmbientVideoPlaying', () => {
  function makeVideo(overrides: Partial<HTMLVideoElement> = {}): HTMLVideoElement {
    const play = jest.fn().mockResolvedValue(undefined)
    return {
      defaultMuted: false,
      muted: false,
      playsInline: false,
      playbackRate: 1,
      paused: true,
      ended: false,
      play,
      ...overrides,
    } as unknown as HTMLVideoElement
  }

  it('sets muted/playsInline and calls play when paused', async () => {
    const video = makeVideo()
    const ok = await ensureAmbientVideoPlaying(video)
    expect(ok).toBe(true)
    expect(video.muted).toBe(true)
    expect(video.defaultMuted).toBe(true)
    expect(video.playsInline).toBe(true)
    expect(video.playbackRate).toBe(0.65)
    expect(video.play).toHaveBeenCalledTimes(1)
  })

  it('skips play when already playing', async () => {
    const video = makeVideo({ paused: false, ended: false })
    const ok = await ensureAmbientVideoPlaying(video)
    expect(ok).toBe(true)
    expect(video.play).not.toHaveBeenCalled()
  })

  it('returns false when play() rejects', async () => {
    const video = makeVideo()
    ;(video.play as jest.Mock).mockRejectedValue(new Error('blocked'))
    const ok = await ensureAmbientVideoPlaying(video)
    expect(ok).toBe(false)
  })
})
