import { Controller, Get, Query } from '@nestjs/common';

export interface GeoSuggestion {
  label: string;
  lat: number;
  lng: number;
}

interface PhotonFeature {
  geometry: { coordinates: [number, number] };
  properties: {
    name?: string;
    street?: string;
    housenumber?: string;
    district?: string;
    city?: string;
    county?: string;
    state?: string;
    countrycode?: string;
    country?: string;
    osm_value?: string;
  };
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

// Bias suggestions toward FoodSave's launch cities (Astana centre).
const BIAS = { lat: 51.1605, lon: 71.4704 };

/**
 * Address autocomplete. Primary source is Photon (Komoot) which is built for
 * type-ahead search and has good ranking; results are restricted to Kazakhstan.
 * Falls back to Nominatim when Photon returns nothing.
 */
@Controller('geocoding')
export class GeocodingController {
  @Get('search')
  async search(@Query('q') q?: string): Promise<GeoSuggestion[]> {
    const query = q?.trim();
    if (!query || query.length < 3) {
      return [];
    }

    const photon = await this.fromPhoton(query);
    if (photon.length > 0) {
      return photon;
    }
    return this.fromNominatim(query);
  }

  private async fromPhoton(query: string): Promise<GeoSuggestion[]> {
    const url = new URL('https://photon.komoot.io/api/');
    url.searchParams.set('q', query);
    url.searchParams.set('limit', '10');
    url.searchParams.set('lat', String(BIAS.lat));
    url.searchParams.set('lon', String(BIAS.lon));

    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'FoodSave/1.0' } });
      if (!res.ok) return [];
      const json = (await res.json()) as { features?: PhotonFeature[] };
      const seen = new Set<string>();
      const out: GeoSuggestion[] = [];

      for (const f of json.features ?? []) {
        const p = f.properties;
        if (p.countrycode !== 'KZ') continue; // FoodSave operates in Kazakhstan
        const label = this.buildLabel(p);
        if (!label || seen.has(label)) continue;
        seen.add(label);
        out.push({ label, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0] });
        if (out.length >= 6) break;
      }
      return out;
    } catch {
      return [];
    }
  }

  private buildLabel(p: PhotonFeature['properties']): string {
    const streetLine = [p.street ?? p.name, p.housenumber].filter(Boolean).join(' ');
    const parts = [
      streetLine || p.name,
      p.district,
      p.city ?? p.county,
      p.state,
    ].filter((part, i, arr): part is string => Boolean(part) && arr.indexOf(part) === i);
    return parts.join(', ');
  }

  private async fromNominatim(query: string): Promise<GeoSuggestion[]> {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '6');
    url.searchParams.set('countrycodes', 'kz');

    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'FoodSave/1.0 (https://foodsave.kz)',
          'Accept-Language': 'ru,en',
        },
      });
      if (!res.ok) return [];
      const data = (await res.json()) as NominatimResult[];
      return data.map((d) => ({
        label: d.display_name,
        lat: Number(d.lat),
        lng: Number(d.lon),
      }));
    } catch {
      return [];
    }
  }
}
