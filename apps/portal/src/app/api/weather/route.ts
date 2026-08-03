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
 *                 temperature:
 *                   type: number
 *                 conditions:
 *                   type: string
 *                 humidity:
 *                   type: number
 *                 windSpeed:
 *                   type: number
 *                 windDirection:
 *                   type: string
 *                 visibility:
 *                   type: number
 *                 timestamp:
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
    const weather = await fetchWeather()
    return NextResponse.json(weather, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    })
  } catch (error) {
    await logError(error instanceof Error ? error : new Error('Weather fetch failed'), {
      context: 'weather_api',
    })
    return NextResponse.json(null)
  }
}
