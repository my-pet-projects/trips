import { haversineDistance } from "~/lib/geo";

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export type NearbyPoiSource = "wikipedia" | "osm" | "nominatim";

export type NearbyPoi = {
  name: string;
  normalizedName: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  source: NearbyPoiSource;
  kind?: string;
};

type RawPoi = {
  name: string;
  latitude: number;
  longitude: number;
  source: NearbyPoiSource;
  kind?: string;
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36";

export function normalizePoiName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

const COUNTRY_LANGUAGES: Record<string, string[]> = {
  AT: ["de"],
  BE: ["nl", "fr"],
  CA: ["fr", "en"],
  CH: ["de", "fr", "it"],
  CY: ["el", "tr"],
  GB: ["en"],
  GR: ["el"],
  IE: ["en", "ga"],
  LU: ["fr", "de"],
  US: ["en"],
};

export function preferredLanguagesForCountry(countryCode?: string): string[] {
  if (!countryCode || countryCode.length !== 2) return [];
  const cc = countryCode.toUpperCase();
  return COUNTRY_LANGUAGES[cc] ?? [cc.toLowerCase()];
}

function pickLocalizedName(
  tags: Record<string, string> | undefined,
  languages: string[],
): string | null {
  if (!tags) return null;

  for (const lang of languages) {
    const localized = tags[`name:${lang}`]?.trim();
    if (localized) return localized;
  }

  const locName = tags.loc_name?.trim();
  if (locName) return locName;

  return tags.name?.trim() ?? null;
}

function pickNominatimName(
  data: {
    name?: string;
    localname?: string;
    namedetails?: Record<string, string>;
  },
  languages: string[],
): string | null {
  const localName = data.localname?.trim();
  if (localName) return localName;

  for (const lang of languages) {
    const localized = data.namedetails?.[`name:${lang}`]?.trim();
    if (localized) return localized;
  }

  return data.name?.trim() ?? null;
}

function toDistanceMeters(
  originLat: number,
  originLng: number,
  latitude: number,
  longitude: number,
): number {
  return Math.round(
    haversineDistance(originLat, originLng, latitude, longitude) * 1000,
  );
}

type SourceResult<T> = {
  data: T;
  error?: string;
};

async function fetchWikipediaPois(
  latitude: number,
  longitude: number,
  radiusMeters: number,
  languages: string[],
): Promise<SourceResult<RawPoi[]>> {
  const failures: string[] = [];
  let hadOkResponse = false;

  // Try country languages first, then English; Set avoids fetching "en" twice.
  for (const lang of [...new Set([...languages, "en"])]) {
    try {
      const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
      url.searchParams.set("action", "query");
      url.searchParams.set("list", "geosearch");
      url.searchParams.set("gscoord", `${latitude}|${longitude}`);
      url.searchParams.set("gsradius", String(Math.min(radiusMeters, 10_000)));
      url.searchParams.set("gslimit", "10");
      url.searchParams.set("format", "json");

      const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT },
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        failures.push(`${lang}: HTTP ${response.status}`);
        continue;
      }

      hadOkResponse = true;

      const data = (await response.json()) as {
        query?: {
          geosearch?: Array<{ title: string; lat: number; lon: number }>;
        };
      };

      const results = (data.query?.geosearch ?? []).map((item) => ({
        name: item.title.replace(/_/g, " "),
        latitude: item.lat,
        longitude: item.lon,
        source: "wikipedia" as const,
        kind: "landmark",
      }));

      if (results.length > 0) {
        return { data: results };
      }
    } catch (error) {
      failures.push(`${lang}: ${errorMessage(error)}`);
    }
  }

  return {
    data: [],
    error:
      !hadOkResponse && failures.length > 0
        ? `Wikipedia (${failures.join(", ")})`
        : undefined,
  };
}

const NOMINATIM_POI_CLASSES = new Set([
  "amenity",
  "tourism",
  "historic",
  "building",
  "shop",
  "leisure",
  "man_made",
]);

async function fetchNominatimPoi(
  latitude: number,
  longitude: number,
  languages: string[],
): Promise<SourceResult<RawPoi | null>> {
  try {
    const url = new URL("https://nominatim.openstreetmap.org/reverse");
    url.searchParams.set("lat", String(latitude));
    url.searchParams.set("lon", String(longitude));
    url.searchParams.set("format", "json");
    url.searchParams.set("zoom", "18");
    url.searchParams.set("namedetails", "1");
    if (languages.length > 0) {
      url.searchParams.set("accept-language", `${languages.join(",")},local`);
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        ...(languages.length > 0
          ? { "Accept-Language": `${languages.join(",")},local,en` }
          : {}),
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      return {
        data: null,
        error: `Nominatim: HTTP ${response.status}`,
      };
    }

    const data = (await response.json()) as {
      name?: string;
      localname?: string;
      namedetails?: Record<string, string>;
      lat?: string;
      lon?: string;
      class?: string;
      type?: string;
    };

    const name = pickNominatimName(data, languages);
    const lat = data.lat != null ? Number(data.lat) : NaN;
    const lon = data.lon != null ? Number(data.lon) : NaN;
    if (!name || !Number.isFinite(lat) || !Number.isFinite(lon)) {
      return { data: null };
    }
    if (!data.class || !NOMINATIM_POI_CLASSES.has(data.class)) {
      return { data: null };
    }

    return {
      data: {
        name,
        latitude: lat,
        longitude: lon,
        source: "nominatim",
        kind: data.type,
      },
    };
  } catch (error) {
    return { data: null, error: `Nominatim: ${errorMessage(error)}` };
  }
}

async function fetchOsmPois(
  latitude: number,
  longitude: number,
  radiusMeters: number,
  languages: string[],
): Promise<SourceResult<RawPoi[]>> {
  const query = `[out:json][timeout:15];(
    node(around:${radiusMeters},${latitude},${longitude})["name"]["tourism"];
    node(around:${radiusMeters},${latitude},${longitude})["name"]["historic"];
    node(around:${radiusMeters},${latitude},${longitude})["name"]["amenity"="museum"];
    node(around:${radiusMeters},${latitude},${longitude})["name"]["amenity"="place_of_worship"];
    way(around:${radiusMeters},${latitude},${longitude})["name"]["tourism"];
    way(around:${radiusMeters},${latitude},${longitude})["name"]["historic"];
    way(around:${radiusMeters},${latitude},${longitude})["name"]["amenity"="place_of_worship"];
    way(around:${radiusMeters},${latitude},${longitude})["name"]["amenity"="museum"];
  );out center 25;`;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": USER_AGENT,
      },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      return {
        data: [],
        error: `Overpass: HTTP ${response.status}`,
      };
    }

    const data = (await response.json()) as {
      elements?: Array<{
        lat?: number;
        lon?: number;
        center?: { lat: number; lon: number };
        tags?: Record<string, string>;
      }>;
    };

    const items: RawPoi[] = [];

    for (const element of data.elements ?? []) {
      const name = pickLocalizedName(element.tags, languages);
      const lat = element.lat ?? element.center?.lat;
      const lon = element.lon ?? element.center?.lon;
      if (!name || lat == null || lon == null) continue;

      items.push({
        name,
        latitude: lat,
        longitude: lon,
        source: "osm",
        kind:
          element.tags?.tourism ??
          element.tags?.historic ??
          element.tags?.amenity,
      });
    }

    return { data: items };
  } catch (error) {
    return { data: [], error: `Overpass: ${errorMessage(error)}` };
  }
}

function mergeNearbyPois(
  originLat: number,
  originLng: number,
  items: RawPoi[],
  limit: number,
): NearbyPoi[] {
  const byName = new Map<string, NearbyPoi>();

  for (const item of items) {
    const distanceMeters = toDistanceMeters(
      originLat,
      originLng,
      item.latitude,
      item.longitude,
    );
    const poi: NearbyPoi = {
      name: item.name,
      normalizedName: normalizePoiName(item.name),
      latitude: item.latitude,
      longitude: item.longitude,
      distanceMeters,
      source: item.source,
      kind: item.kind,
    };

    const key = poi.normalizedName;
    const existing = byName.get(key);
    if (!existing) {
      byName.set(key, poi);
      continue;
    }

    const preferSource =
      (poi.source === "nominatim" && existing.source !== "nominatim") ||
      (poi.source === "wikipedia" &&
        existing.source !== "nominatim" &&
        existing.source !== "wikipedia");
    const base =
      preferSource || poi.distanceMeters < existing.distanceMeters
        ? poi
        : existing;

    byName.set(key, {
      ...base,
      distanceMeters: Math.min(poi.distanceMeters, existing.distanceMeters),
    });
  }

  return [...byName.values()]
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);
}

export async function getNearbyPois(
  latitude: number,
  longitude: number,
  radiusMeters = 250,
  limit = 8,
  countryCode?: string,
): Promise<NearbyPoi[]> {
  const languages = preferredLanguagesForCountry(countryCode);

  const [wikipedia, osm, nominatim] = await Promise.all([
    fetchWikipediaPois(latitude, longitude, radiusMeters, languages),
    fetchOsmPois(latitude, longitude, radiusMeters, languages),
    fetchNominatimPoi(latitude, longitude, languages),
  ]);

  const sourceErrors = [wikipedia.error, osm.error, nominatim.error].filter(
    (message): message is string => message != null,
  );

  const items = [
    ...wikipedia.data,
    ...osm.data,
    ...(nominatim.data ? [nominatim.data] : []),
  ];
  const pois = mergeNearbyPois(latitude, longitude, items, limit);

  if (pois.length === 0 && sourceErrors.length > 0) {
    throw new Error(sourceErrors.join("; "));
  }

  return pois;
}
