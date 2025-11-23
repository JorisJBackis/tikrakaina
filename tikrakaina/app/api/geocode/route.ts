import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
  }

  try {
    const searchQuery = `${query}, Vilnius, Lithuania`
    const url = `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(searchQuery)}&` +
      `format=json&` +
      `addressdetails=1&` +
      `limit=5`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TikraKaina/1.0 (https://tikrakaina.lt)',
        'Accept': 'application/json'
      }
    })

    const data = await response.json()

    return NextResponse.json(data)
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 })
  }
}
