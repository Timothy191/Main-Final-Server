import { analytics } from './index'

describe('analytics', () => {
  it('exposes track without throwing', () => {
    expect(() => analytics.track({ eventName: 'test', properties: { ok: true } })).not.toThrow()
  })
})
