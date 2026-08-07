import { headers } from 'next/headers'
import { fetchWeather } from '@/lib/weather-api'
import { logError } from '@/lib/errors/error-logger'
import { NextResponse } from 'next/server'

/**
 * @swagger
 * /api/weather:
 *   get:
 *     summary: Current weather conditions
 *     description: Returns current weather data for the mining site location. Data is not cached to ensure freshness.
 *     tags:
 *       - Weather
 *     responses:
 *       200:
 *         description: Weather data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 temp:
 *                   type: number
 *                 condition:
 *                   type: string
 *                 wind:
 *                   type: number
 *                 humidity:
 *                   type: number
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       500:
 *         description: Error fetching weather data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               nullable: true
 */

export async function GET() {
  try {
    await headers() // Force dynamic execution
    const weather = await fetchWeather()
    return NextResponse.json(weather)
  } catch (error) {
    await logError(error instanceof Error ? error : new Error('Weather fetch failed'), {
      context: 'weather_api',
    })
    return NextResponse.json(null)
  }
}
