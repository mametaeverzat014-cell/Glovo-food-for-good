import { Controller, Get, Query, ServiceUnavailableException } from '@nestjs/common';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

/**
 * Address search backed by OpenStreetMap's Nominatim geocoder. Proxied through
 * the API so we can send a proper User-Agent and bias results to Kazakhstan.
 */
@Controller('geocoding')
export class GeocodingController {
  @Get('search')
  async search(@Query('q') q?: string) {
    if (!q || q.trim().length < 3) {
      return [];
    }

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', q);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '6');
    url.searchParams.set('addressdetails', '0');
    url.searchParams.set('countrycodes', 'kz'); // FoodSave operates in Kazakhstan

    let data: NominatimResult[];
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'FoodSave/1.0 (https://foodsave.kz)',
          'Accept-Language': 'ru,en',
        },
      });
      if (!res.ok) {
        throw new Error(`Nominatim responded ${res.status}`);
      }
      data = (await res.json()) as NominatimResult[];
    } catch {
      throw new ServiceUnavailableException('Address lookup is temporarily unavailable');
    }

    return data.map((d) => ({
      label: d.display_name,
      lat: Number(d.lat),
      lng: Number(d.lon),
    }));
  }
}
