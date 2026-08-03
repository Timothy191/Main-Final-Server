import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { createMiddlewareClient } from '@repo/supabase/middleware'
import { cacheGet, cacheSet, cacheEvictL1ByPrefix } from '@repo/redis/cache'

export function isValidRedirect(path: string): boolean {
  if (!path) return false

  try {
    path = decodeURIComponent(path)
  } catch {
    return false
  }

  if (
    path.startsWith('//') ||
    path.startsWith('/\\') ||
    path.startsWith('data:') ||
    path.startsWith('javascript:') ||
    path.startsWith('vbscript:')
  ) {
    return false
  }

  if (!path.startsWith('/')) return false

  const allowedPatterns = [
    /^\/$/,
    /^\/login(?:\/.*)?$/,
    /^\/reset-password(?:\/.*)?$/,
    /^\/update-password(?:\/.*)?$/,
    /^\/drilling(?:\/.*)?$/,
    /^\/production(?:\/.*)?$/,
    /^\/access-control(?:\/.*)?$/,
    /^\/access-card-actions(?:\/.*)?$/,
    /^\/engineering(?:\/.*)?$/,
    /^\/control-room(?:\/.*)?$/,
    /^\/safety(?:\/.*)?$/,
    /^\/training(?:\/.*)?$/,
    /^\/satellite-monitoring(?:\/.*)?$/,
    /^\/hub(?:\/.*)?$/,
    /^\/executive(?:\/.*)?$/,
    /^\/admin(?:\/.*)?$/,
  ]

  return allowedPatterns.some((pattern) => pattern.test(path))
}

// AGENT-TRACE: Keep in sync with src/lib/dept-access.ts DEPARTMENT_ROUTE_SLUGS
const DEPARTMENT_ROUTES = [
  'drilling',
  'production',
  'access-control',
  'access-card-actions',
  'engineering',
  'control-room',
  'safety',
  'training',
  'satellite-monitoring',
]

// AGENT-TRACE: Keep in sync with src/lib/dept-access.ts RESTRICTED_DEPT_ROLES (+ tools)
const RESTRICTED_ROUTES: Record<string, string[]> = {
  'access-control': ['access_control', 'admin'],
  'control-room': ['control_room_operator', 'admin'],
  tools: ['admin', 'supervisor'],
  admin: ['admin'],
}

export function normalizeRole(role: unknown): string {
  return typeof role === 'string' && role.length > 0 ? role : 'operator'
}

export function isTokenExpiredError(error: unknown): boolean {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return false
  }
  const msg = String((error as { message: unknown }).message)
  return msg.includes('Invalid Refresh Token') || msg.includes('Refresh Token Not Found')
}

function redirectWithError(request: NextRequest, error: string, clientResponse?: NextResponse) {
  const url = new URL('/hub', request.url)
  url.searchParams.set('error', error)
  const res = NextResponse.redirect(url)
  if (clientResponse && clientResponse.cookies) {
    clientResponse.cookies.getAll().forEach((cookie) => {
      res.cookies.set(cookie.name, cookie.value, {
        path: cookie.path,
        domain: cookie.domain,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        sameSite: cookie.sameSite,
        expires: cookie.expires,
        maxAge: cookie.maxAge,
      })
    })
  }
  return res
}

function copyCookies(source: NextResponse, target: NextResponse) {
  if (!source.cookies) return
  source.cookies.getAll().forEach((cookie) => {
    target.cookies.set(cookie.name, cookie.value, {
      path: cookie.path,
      domain: cookie.domain,
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite,
      expires: cookie.expires,
      maxAge: cookie.maxAge,
    })
  })
}

async function resolveDeptUuid(
  supabase: Awaited<ReturnType<typeof createMiddlewareClient>>['supabase'],
  slug: string
): Promise<string | null> {
  const cacheKey = `dept:uuid:${slug}`
  const cached = await cacheGet<string>(cacheKey)
  if (cached) return cached

  const { data } = await supabase.from('departments').select('id').eq('name', slug).single()
  if (data?.id) {
    await cacheSet(cacheKey, data.id, 3600)
  }
  return data?.id || null
}

const PUBLIC_FILE_EXTENSIONS =
  /\.(jpg|jpeg|png|gif|svg|ico|woff|woff2|ttf|otf|eot|mp4|webm|mp3|wav)$/i

const PUBLIC_ROOT_FILES = new Set([
  '/manifest.json',
  '/manifest.webmanifest',
  '/robots.txt',
  '/sitemap.xml',
  '/browserconfig.xml',
  '/sw.js',
  '/workbox-*.js',
])

function isPublicRootFile(pathname: string): boolean {
  return PUBLIC_ROOT_FILES.has(pathname) || /^\/workbox-.+\.js$/.test(pathname)
}

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_FILE_EXTENSIONS.test(pathname)) return true
  if (isPublicRootFile(pathname)) return true
  return false
}

type MiddlewareClient = Awaited<ReturnType<typeof createMiddlewareClient>>

async function getSessionUser(
  client: MiddlewareClient
): Promise<{ user: { id: string } | null; shouldSignOut: boolean }> {
  try {
    const result = await client.supabase.auth.getUser()
    const shouldSignOut = result.error !== null && isTokenExpiredError(result.error)
    return { user: result.data.user ?? null, shouldSignOut }
  } catch (error) {
    return { user: null, shouldSignOut: isTokenExpiredError(error) }
  }
}

async function signOutAndRedirectToRoot(
  _request: NextRequest,
  client: MiddlewareClient
): Promise<NextResponse> {
  await client.supabase.auth.signOut()
  return client.response
}

function hasSessionCookie(request: NextRequest): boolean {
  return (
    request.cookies.has('sb-access-token') ||
    [...request.cookies.getAll()].some(
      (c) => c.name.startsWith('sb-') && c.name.endsWith('-auth-token')
    )
  )
}

interface EmployeeAuth {
  role: string
  department_id: string
  accessible_departments: string[]
}

async function resolveEmployee(
  supabase: MiddlewareClient['supabase'],
  userId: string
): Promise<EmployeeAuth | null> {
  const cacheKey = `arch:auth:employee:${userId}`
  const cached = await cacheGet<EmployeeAuth | null>(cacheKey)
  if (cached) return cached

  const { data } = await supabase
    .from('employees')
    .select('role, department_id, accessible_departments')
    .eq('auth_id', userId)
    .single()
  if (data) {
    await cacheSet(cacheKey, data as EmployeeAuth, 3600)
  }
  return (data as EmployeeAuth) ?? null
}

function isRestrictedRouteAllowed(
  pathname: string,
  secondSegment: string | undefined,
  role: string
): boolean {
  for (const [route, allowedRoles] of Object.entries(RESTRICTED_ROUTES)) {
    if (pathname.startsWith(`/${route}`) && !allowedRoles.includes(role)) {
      return false
    }
  }

  if (
    secondSegment === 'tools' &&
    RESTRICTED_ROUTES.tools &&
    !RESTRICTED_ROUTES.tools.includes(role)
  ) {
    return false
  }

  return true
}

async function isDepartmentAllowed(
  supabase: MiddlewareClient['supabase'],
  topSegment: string,
  employee: EmployeeAuth
): Promise<'ok' | 'unknown' | 'unauthorized'> {
  if (!DEPARTMENT_ROUTES.includes(topSegment)) return 'ok'

  const isAdmin = employee.role === 'admin'
  const deptUuid = await resolveDeptUuid(supabase, topSegment)
  if (!deptUuid) return 'unknown'

  const hasAccess =
    isAdmin ||
    employee.department_id === deptUuid ||
    employee.accessible_departments.includes(deptUuid)
  return hasAccess ? 'ok' : 'unauthorized'
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Next.js 16 proxy runs on every request, so explicitly skip the paths the
  // old matcher excluded: static assets, Next internals, API routes, and root
  // files that should never be intercepted.
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/reset-password') || pathname.startsWith('/update-password')) {
    return NextResponse.next()
  }

  // OAuth PKCE callback must run before a session exists
  if (pathname.startsWith('/auth/callback')) {
    return NextResponse.next()
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/login')) {
    if (!hasSessionCookie(request)) {
      return NextResponse.next()
    }

    const client = await createMiddlewareClient(request)
    const { user, shouldSignOut } = await getSessionUser(client)

    if (shouldSignOut) {
      return signOutAndRedirectToRoot(request, client)
    }

    if (user) {
      return NextResponse.redirect(new URL('/hub', request.url))
    }

    return client.response
  }

  const client = await createMiddlewareClient(request)
  const { user, shouldSignOut } = await getSessionUser(client)

  if (shouldSignOut) {
    await client.supabase.auth.signOut()
    if (user?.id) {
      cacheEvictL1ByPrefix(`arch:auth:employee:${user.id}`)
    }
  }

  if (!user) {
    const redirectUrl = new URL('/login', request.url)
    if (isValidRedirect(pathname)) {
      redirectUrl.searchParams.set('redirect', pathname)
    }
    const redirectResponse = NextResponse.redirect(redirectUrl)
    copyCookies(client.response, redirectResponse)
    return redirectResponse
  }

  const employee = await resolveEmployee(client.supabase, user.id)
  const userRole = normalizeRole(employee?.role)

  const pathSegments = pathname.split('/').filter(Boolean)
  const topSegment = pathSegments[0]
  const secondSegment = pathSegments[1]

  if (!isRestrictedRouteAllowed(pathname, secondSegment, userRole)) {
    return redirectWithError(request, 'unauthorized_department', client.response)
  }

  if (topSegment) {
    const deptStatus = await isDepartmentAllowed(
      client.supabase,
      topSegment,
      employee ?? {
        role: userRole,
        department_id: '',
        accessible_departments: [],
      }
    )
    if (deptStatus === 'unknown') {
      return redirectWithError(request, 'unknown_department', client.response)
    }
    if (deptStatus === 'unauthorized') {
      return redirectWithError(request, 'unauthorized_department', client.response)
    }
  }

  return client.response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
