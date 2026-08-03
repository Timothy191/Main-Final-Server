import { OFFICIAL_PALETTE, paletteVar } from './palette'

describe('OFFICIAL_PALETTE', () => {
  it('defines every required brand role', () => {
    expect(OFFICIAL_PALETTE.brand.primary).toBe('#1c1c1e')
    expect(OFFICIAL_PALETTE.semantic.warning).toBe('#f59e0b')
    expect(OFFICIAL_PALETTE.semantic.danger).toBe('#d22118')
    expect(OFFICIAL_PALETTE.glass.backdrop).toContain('saturate')
  })

  it('paletteVar returns a CSS custom property reference', () => {
    expect(paletteVar('brand-primary')).toBe('var(--palette-brand-primary)')
  })
})
