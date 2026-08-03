import { ExternalServiceError } from '@/lib/errors/error-classes'

export interface WeatherData {
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDirection: number
  weatherCode: number
  description: string
  icon: string
  timestamp: string
  location: { lat: number; lon: number; name: string }
  daily: Array<{
    date: string
    icon: string
    maxTemp: number
    minTemp: number
  }>
}

export function getWindDirection(deg: number): string {
  const directions = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ]
  const val = Math.floor(deg / 22.5 + 0.5)
  return directions[val % 16]!
}

export function getWeatherAlert(weather: WeatherData) {
  if (weather.weatherCode >= 95) {
    return {
      level: 'critical' as const,
      message: '⚠️ Thunderstorm - Cease outdoor operations immediately',
    }
  }
  if (weather.windSpeed > 40) {
    return {
      level: 'warning' as const,
      message: '⚠️ High winds - Exercise caution',
    }
  }
  return {
    level: 'none' as const,
    message: '',
  }
}

export async function fetchWeather(
  lat: number = -26.35914,
  lon: number = 28.79267,
  name: string = 'Delmas, Mpumalanga'
): Promise<WeatherData> {
  try {
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`,
      { next: { revalidate: 600, tags: ['weather'] } }
    )
    if (!res.ok)
      throw new ExternalServiceError('Weather API request failed', {
        context: { provider: 'open-meteo', status: res.status },
      })
    const data = await res.json()
    const current = data.current

    const getCodeDetails = (code: number) => {
      if (code === 0) return { desc: 'Clear sky', icon: '☀️' }
      if (code <= 3) return { desc: 'Partly cloudy', icon: '⛅' }
      if (code <= 48) return { desc: 'Foggy', icon: '🌫️' }
      if (code <= 57) return { desc: 'Drizzle', icon: '🌧️' }
      if (code <= 67) return { desc: 'Rain', icon: '🌧️' }
      if (code <= 77) return { desc: 'Snow', icon: '❄️' }
      if (code <= 82) return { desc: 'Rain showers', icon: '🌦️' }
      if (code <= 86) return { desc: 'Snow showers', icon: '❄️' }
      return { desc: 'Thunderstorm', icon: '⛈️' }
    }

    const details = getCodeDetails(current.weather_code)

    return {
      temperature: Math.round(current.temperature_2m),
      feelsLike: Math.round(current.apparent_temperature),
      humidity: current.relative_humidity_2m,
      windSpeed: Math.round(current.wind_speed_10m),
      windDirection: current.wind_direction_10m,
      weatherCode: current.weather_code,
      description: details.desc,
      icon: details.icon,
      timestamp: new Date().toISOString(),
      location: { lat, lon, name },
      daily: data.daily.time.slice(0, 5).map((date: string, i: number) => {
        const dailyDetails = getCodeDetails(data.daily.weather_code[i])
        return {
          date,
          icon: dailyDetails.icon,
          maxTemp: Math.round(data.daily.temperature_2m_max[i]),
          minTemp: Math.round(data.daily.temperature_2m_min[i]),
        }
      }),
    }
  } catch (e) {
    return {
      temperature: 20,
      feelsLike: 18,
      humidity: 60,
      windSpeed: 15,
      windDirection: 120,
      weatherCode: 0,
      description: 'Clear sky',
      icon: '☀️',
      timestamp: new Date().toISOString(),
      location: { lat, lon, name },
      daily: Array.from({ length: 5 }).map((_, i) => {
        const d = new Date()
        d.setDate(d.getDate() + i)
        return {
          date: d.toISOString().split('T')[0] ?? '',
          icon: '☀️',
          maxTemp: 22,
          minTemp: 12,
        }
      }),
    }
  }
}
