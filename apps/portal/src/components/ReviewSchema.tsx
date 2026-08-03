/**
 * Review JSON-LD structured data for the hub page.
 *
 * Renders a <script type="application/ld+json"> block with individual Review
 * items for each DepartmentReviews testimonial.
 *
 * Uses @type: SoftwareApplication (a subtype of Product in schema.org) so
 * both software-specific properties (applicationCategory, operatingSystem)
 * and the review property are valid. Uses relative fragment identifiers
 * (@id) so identifiers resolve against the page URL across environments.
 *
 * These are qualitative testimonials (not numerically scored), so reviewRating
 * is omitted to avoid fabricating rating data — Google penalises self-serving
 * or fabricated ratings per structured data guidelines.
 *
 * Uses the shared DEPARTMENT_REVIEWS constant as the single source of truth
 * so the marquee display and structured data are always in sync.
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data/review-snippet
 * @see https://schema.org/SoftwareApplication
 */

import { DEPARTMENT_REVIEWS } from '@/data/reviews'

export function ReviewSchema() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    '@id': '#product',
    name: 'Arch-Systems Central Operations Portal',
    description:
      'Multi-departmental industrial operations portal with real-time monitoring, production tracking, and operational feedback management.',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web browser (all modern)',
    review: DEPARTMENT_REVIEWS.map((review, index) => ({
      '@type': 'Review',
      '@id': `#review-${index + 1}`,
      author: {
        '@type': 'Organization',
        '@id': `#department-${review.username.replace('@', '')}`,
        name: review.name,
      },
      reviewBody: review.body,
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
