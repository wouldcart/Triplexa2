import type { Json } from '@/integrations/supabase/types';

export type NominatimSearchResult = {
  place_id: number;
  osm_type?: string;
  osm_id?: number;
  boundingbox?: string[];
  lat: string;
  lon: string;
  display_name: string;
  class?: string;
  type?: string;
  importance?: number;
  address?: Record<string, string>;
};

export type NominatimReverseResult = {
  place_id: number;
  licence?: string;
  osm_type?: string;
  osm_id?: number;
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
};

const BASE = 'https://nominatim.openstreetmap.org';

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/json',
      // Friendly UA per Nominatim policy; replace string if you have app/site
      'User-Agent': 'TripOex/1.0 (Nominatim integration)'
    }
  });
  if (!res.ok) {
    throw new Error(`Nominatim request failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export const nominatimService = {
  async search(query: string, options?: { countrycodes?: string; limit?: number }): Promise<NominatimSearchResult[]> {
    const params = new URLSearchParams({
      q: query,
      format: 'jsonv2',
      addressdetails: '1',
      limit: String(options?.limit ?? 5)
    });
    if (options?.countrycodes) params.set('countrycodes', options.countrycodes);
    const url = `${BASE}/search?${params.toString()}`;
    return getJson<NominatimSearchResult[]>(url);
  },

  async reverse(lat: number | string, lon: number | string): Promise<NominatimReverseResult> {
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lon),
      format: 'jsonv2',
      addressdetails: '1'
    });
    const url = `${BASE}/reverse?${params.toString()}`;
    return getJson<NominatimReverseResult>(url);
  }
};

export default nominatimService;