/* eslint-env jest */
/**
 * Tests for @repo/contract/validation — withValidation
 *
 * NOTE: Run these tests manually via:
 *   npx jest packages/contract/validation/__tests__/index.test.ts --config apps/portal/jest.config.js
 *
 * The contract package has no jest config of its own; these tests are designed
 * to be run with the portal's jest configuration (which has @types/jest).
 */

import { z } from 'zod'
import { withValidation } from '../index'

const testSchema = z.object({
  name: z.string().min(1),
  value: z.number().int().positive(),
})

type TestData = z.infer<typeof testSchema>

describe('withValidation', () => {
  let handler: jest.Mock<Promise<Response>, [Request, TestData]>

  beforeEach(() => {
    handler = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  })

  // -------------------------------------------------------------------
  // Success cases
  // -------------------------------------------------------------------

  it('calls the handler with parsed data when body is valid', async () => {
    const wrapped = withValidation(testSchema, handler)
    const req = new Request('http://test.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test-tag', value: 42 }),
    })

    const res = await wrapped(req)

    expect(res.status).toBe(200)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith(req, { name: 'test-tag', value: 42 })
  })

  it('passes extra context as the second argument without affecting data', async () => {
    const wrapped = withValidation(testSchema, handler)
    const req = new Request('http://test.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test-tag', value: 42 }),
    })
    const context = { params: Promise.resolve({ id: '123' }) }

    const res = await wrapped(req, context)

    expect(res.status).toBe(200)
    // Handler receives validated data, not the raw context
    expect(handler).toHaveBeenCalledWith(req, { name: 'test-tag', value: 42 })
  })

  // -------------------------------------------------------------------
  // Validation failure cases (parameterized)
  // -------------------------------------------------------------------

  it.each([
    { desc: 'name is missing', body: { value: 42 }, expectPaths: ['name'] },
    { desc: 'value is missing', body: { name: 'test' }, expectPaths: ['value'] },
    {
      desc: 'value has wrong type',
      body: { name: 'test', value: 'not-a-number' },
      expectPaths: ['value'],
    },
    {
      desc: 'name is an empty string',
      body: { name: '', value: 42 },
      expectPaths: ['name'],
    },
  ])('returns 400 when $desc', async ({ body, expectPaths }) => {
    const wrapped = withValidation(testSchema, handler)
    const req = new Request('http://test.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    const res = await wrapped(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(res.headers.get('Content-Type')).toContain('application/json')
    expect(data.error).toBe('Request body validation failed')
    expect(Array.isArray(data.details)).toBe(true)
    for (const path of expectPaths) {
      expect(data.details.some((d: { path: string[] }) => d.path.includes(path))).toBe(true)
    }
    expect(handler).not.toHaveBeenCalled()
  })

  // -------------------------------------------------------------------
  // Edge cases
  // -------------------------------------------------------------------

  it('returns 400 for malformed JSON body', async () => {
    const wrapped = withValidation(testSchema, handler)
    const req = new Request('http://test.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json-at-all',
    })

    const res = await wrapped(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(res.headers.get('Content-Type')).toContain('application/json')
    expect(data.error).toBe('Request body validation failed')
    expect(handler).not.toHaveBeenCalled()
  })

  it('returns 400 for empty body', async () => {
    const wrapped = withValidation(testSchema, handler)
    const req = new Request('http://test.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '',
    })

    const res = await wrapped(req)
    const data = await res.json()

    expect(res.status).toBe(400)
    expect(res.headers.get('Content-Type')).toContain('application/json')
    expect(data.error).toBe('Request body validation failed')
    expect(handler).not.toHaveBeenCalled()
  })

  it('strips extra fields not in the schema', async () => {
    const wrapped = withValidation(testSchema, handler)
    const req = new Request('http://test.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'test-tag',
        value: 99,
        extraField: 'should-be-ignored',
      }),
    })

    const res = await wrapped(req)

    expect(res.status).toBe(200)
    // Zod object() strips unknown keys by default
    expect(handler).toHaveBeenCalledWith(req, { name: 'test-tag', value: 99 })
  })

  it('does not consume the original request body', async () => {
    const wrapped = withValidation(testSchema, handler)
    const req = new Request('http://test.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'test-tag', value: 42 }),
    })

    const res = await wrapped(req)

    expect(res.status).toBe(200)
    // Original body should still be readable after withValidation
    const body = await req.clone().json()
    expect(body.name).toBe('test-tag')
    expect(body.value).toBe(42)
  })
})
