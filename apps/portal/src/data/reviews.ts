/**
 * Shared review/testimonial data — single source of truth for both the
 * visual DepartmentReviews marquee and the JSON-LD structured data
 * (ReviewSchema).
 *
 * Each entry represents qualitative operational feedback from a department
 * or role. These are illustrative testimonials, not numerically scored
 * reviews, so they are rendered without reviewRating in the schema output
 * (see ReviewSchema for details).
 */
export interface ReviewData {
  name: string
  username: string
  body: string
  img: string
}

export const DEPARTMENT_REVIEWS: ReviewData[] = [
  {
    name: 'Drilling Dept',
    username: '@drilling',
    body: 'Rig 4 telemetry tracking is extremely fast now. Makes scheduling down-hole operations trivial.',
    img: 'https://avatar.vercel.sh/drilling',
  },
  {
    name: 'Safety Control',
    username: '@safety',
    body: 'The real-time incident reports have helped us maintain our LTI-free record. Seamless compliance.',
    img: 'https://avatar.vercel.sh/safety',
  },
  {
    name: 'Production Unit',
    username: '@production',
    body: 'Tonnage logs are highly accurate. It makes shift handovers much cleaner.',
    img: 'https://avatar.vercel.sh/production',
  },
  {
    name: 'Control Room Shift',
    username: '@controlroom',
    body: "SCADA panel integrations are incredibly responsive. Best portal we've used.",
    img: 'https://avatar.vercel.sh/controlroom',
  },
  {
    name: 'Training LMS',
    username: '@training',
    body: 'Competency training dashboard has reduced certification overhead by 40%.',
    img: 'https://avatar.vercel.sh/training',
  },
  {
    name: 'Satellite Operations',
    username: '@satellite',
    body: 'Hyperspectral imagery rendering is super clean. Soil stability alerts are spot on.',
    img: 'https://avatar.vercel.sh/satellite',
  },
  {
    name: 'Engineering Lead',
    username: '@engineering',
    body: 'Tire management calculations are highly precise. Prevented multiple haul truck flats.',
    img: 'https://avatar.vercel.sh/engineering',
  },
  {
    name: 'Access Control Crew',
    username: '@accesscontrol',
    body: 'Visitor logs are super easy to check. Temp badges compile in seconds.',
    img: 'https://avatar.vercel.sh/accesscontrol',
  },
  {
    name: 'Operations Director',
    username: '@director',
    body: 'Excellent visibility into plant metrics and shift logs. Real-time monitoring works perfectly.',
    img: 'https://avatar.vercel.sh/director',
  },
  {
    name: 'Site Supervisor',
    username: '@supervisor',
    body: 'Highly reliable system. The offline banner and resilient auth keep operators in focus.',
    img: 'https://avatar.vercel.sh/supervisor',
  },
]
