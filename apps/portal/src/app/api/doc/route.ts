import { NextResponse } from 'next/server'
import { createSwaggerSpec } from 'next-swagger-doc'
import { createServerSupabaseClient } from '@repo/supabase/server'

/**
 * @swagger
 * /api/doc:
 *   get:
 *     summary: OpenAPI specification
 *     description: Returns the OpenAPI 3.0 specification for all API routes. Requires authentication with admin or engineering role.
 *     tags:
 *       - Documentation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OpenAPI specification in JSON format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       403:
 *         description: Forbidden - user lacks required role
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

// AGENT-TRACE: API documentation endpoint for OpenAPI spec generation
// This route automatically generates OpenAPI specification from JSDoc annotations in API routes
// Only accessible to authenticated users with admin or engineering roles via Supabase auth

async function assertAuthorizedUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Unauthorized', status: 401 } as const
  }

  const { data: employee } = await supabase
    .from('employees')
    .select('id, role')
    .eq('auth_id', user.id)
    .single()

  // Allow admin and engineering roles to access API docs
  const allowedRoles = new Set(['admin', 'engineering'])
  if (!employee || !allowedRoles.has(employee.role)) {
    return { error: 'Forbidden', status: 403 } as const
  }

  return { employee, user }
}

export async function GET() {
  // Check authorization
  const auth = await assertAuthorizedUser()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const spec = createSwaggerSpec({
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Arch-Systems Portal API',
        version: '1.0.0',
        description:
          'API for industrial operations portal - control room, drilling, engineering, safety, and production management',
      },
      servers: [
        {
          url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Supabase JWT authentication token',
          },
        },
      },
      security: [
        {
          bearerAuth: [],
        },
      ],
    },
    apiFolder: 'app/api',
  })

  return NextResponse.json(spec, {
    headers: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  })
}
