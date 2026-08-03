/**
 * @jest-environment jsdom
 *
 * Tests for ReviewSchema — validates that the JSON-LD structured data
 * output is syntactically valid, semantically correct, and remains in
 * sync with the shared DEPARTMENT_REVIEWS data source.
 *
 * These tests serve as a CI gate: if the review data changes, the
 * structured data must remain valid schema.org markup. This prevents
 * accidental breakage of Rich Results eligibility.
 */
import { render } from '@testing-library/react'
import { ReviewSchema } from './ReviewSchema'
import { DEPARTMENT_REVIEWS } from '@/data/reviews'

/**
 * Parse the JSON-LD script tag rendered by ReviewSchema.
 * We extract the textContent of the script and JSON.parse it.
 */
function extractJsonLd(): Record<string, unknown> {
  const container = document.createElement('div')
  const { container: rendered } = render(<ReviewSchema />, { container })
  const script = rendered.querySelector('script[type="application/ld+json"]')
  expect(script).not.toBeNull()
  const raw = script?.textContent ?? ''
  return JSON.parse(raw) as Record<string, unknown>
}

describe('ReviewSchema JSON-LD', () => {
  it('renders a script tag with valid JSON-LD', () => {
    const jsonLd = extractJsonLd()
    expect(jsonLd).toBeDefined()
    expect(typeof jsonLd).toBe('object')
  })

  it('has the correct @context, @type, and @id', () => {
    const jsonLd = extractJsonLd()
    expect(jsonLd['@context']).toBe('https://schema.org')
    expect(jsonLd['@type']).toBe('SoftwareApplication')
    expect(jsonLd['@id']).toBe('#product')
  })

  it('has a product name, description, and software fields', () => {
    const jsonLd = extractJsonLd()
    expect(jsonLd.name).toBe('Arch-Systems Central Operations Portal')
    expect(typeof jsonLd.description).toBe('string')
    expect((jsonLd.description as string).length).toBeGreaterThan(0)
    expect(jsonLd.applicationCategory).toBe('BusinessApplication')
    expect(typeof jsonLd.operatingSystem).toBe('string')
    expect((jsonLd.operatingSystem as string).length).toBeGreaterThan(0)
  })

  it('contains the same number of reviews as DEPARTMENT_REVIEWS', () => {
    const jsonLd = extractJsonLd()
    const reviews = jsonLd.review as Array<Record<string, unknown>>
    expect(reviews).toHaveLength(DEPARTMENT_REVIEWS.length)
  })

  it('each review has a valid schema.org Review structure with @id', () => {
    const jsonLd = extractJsonLd()
    const reviews = jsonLd.review as Array<Record<string, unknown>>

    for (const [i, review] of reviews.entries()) {
      expect(review['@type']).toBe('Review')
      expect(review['@id']).toBe(`#review-${i + 1}`)
      expect(review.author).toBeDefined()
      const author = review.author as Record<string, unknown>
      expect(author['@type']).toBe('Organization')
      expect(typeof author['@id']).toBe('string')
      expect(typeof author.name).toBe('string')
      expect(typeof review.reviewBody).toBe('string')
      expect((review.reviewBody as string).length).toBeGreaterThan(0)
    }
  })

  it('review author names match DEPARTMENT_REVIEWS names', () => {
    const jsonLd = extractJsonLd()
    const reviews = jsonLd.review as Array<Record<string, unknown>>

    reviews.forEach((review, index) => {
      const authorName = (review.author as Record<string, unknown>).name
      expect(authorName).toBe(DEPARTMENT_REVIEWS[index]!.name)
    })
  })

  it('review bodies match DEPARTMENT_REVIEWS bodies', () => {
    const jsonLd = extractJsonLd()
    const reviews = jsonLd.review as Array<Record<string, unknown>>

    reviews.forEach((review, index) => {
      expect(review.reviewBody).toBe(DEPARTMENT_REVIEWS[index]!.body)
    })
  })

  it('reviewRating is absent to avoid fabricated rating penalties', () => {
    const jsonLd = extractJsonLd()
    const reviews = jsonLd.review as Array<Record<string, unknown>>

    for (const review of reviews) {
      expect(review.reviewRating).toBeUndefined()
    }
  })

  it('outputs valid JSON that round-trips without data loss', () => {
    const jsonLd = extractJsonLd()
    const roundTripped = JSON.parse(JSON.stringify(jsonLd))
    expect(roundTripped).toEqual(jsonLd)
  })
})
