import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { ensureWorkspaceContextForUser } from "@/lib/workspaces";
import { getCurrentUser } from "@/lib/auth";
import { fetchMetaGeoLocationSearch, MetaGeoLocationSearchResult } from "@/lib/meta";
import { getWorkspaceMetaAccessToken } from "@/lib/meta-integration";
import { CampaignLocationScope, MetaLocationClassification, MetaLocationTargeting } from "@/types";

type GeocoderSearchResult = {
  place_id?: number;
  osm_id?: number;
  osm_type?: string;
  display_name?: string;
  lat?: string;
  lon?: string;
  type?: string;
  address?: Record<string, string | undefined>;
};

type LocationSuggestion = {
  id: string;
  label: string;
  scope: CampaignLocationScope;
  source?: "meta" | "geocoder" | "manual";
  lat?: number;
  lon?: number;
  countryCode?: string;
  radiusAllowed?: boolean;
  distanceUnit?: "mile" | "kilometer";
  metaLocation: MetaLocationTargeting;
};

type CachedSearchEntry = {
  expiresAt: number;
  suggestions: LocationSuggestion[];
};

const searchCache = new Map<string, CachedSearchEntry>();
const searchCacheTtlMs = 2 * 60 * 1000;

function mapScope(result: MetaGeoLocationSearchResult): CampaignLocationScope {
  const classification = classifyMetaLocationType(result);

  if (classification === "country") return "country";
  if (classification === "region") return "state";
  if (classification === "city") return "city";
  if (classification === "zip") return "zip";
  if (classification === "neighborhood") return "neighborhood";
  return "address";
}

function classifyMetaLocationType(result: MetaGeoLocationSearchResult): MetaLocationClassification {
  const type = String(result.type || "").toLowerCase();

  if (["country", "countries"].includes(type)) return "country";
  if (["region", "regions", "state", "states", "province", "provinces"].includes(type)) return "region";
  if (["city", "cities", "town", "towns", "municipality", "municipalities", "locality", "localities"].includes(type)) return "city";
  if (["zip", "zips", "postal_code", "postal_codes", "postcode", "postcodes"].includes(type)) return "zip";
  if (["neighborhood", "neighborhoods", "suburb", "suburbs", "borough", "boroughs", "district", "districts"].includes(type)) return "neighborhood";
  if (["address", "addresses", "street_address", "street_addresses", "place", "places"].includes(type)) return "address";
  return "unknown";
}

function parseCoordinate(value: string | number | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function looksLikeAddressQuery(query: string) {
  return (
    /\d/.test(query) ||
    /(?:street|st|avenue|ave|road|rd|lane|ln|drive|dr|boulevard|blvd|court|ct|way|suite|ste|apt|apartment|unit|highway|hwy)\b/i.test(
      query,
    )
  );
}

function isRadiusAllowed(result: MetaGeoLocationSearchResult, scope: CampaignLocationScope) {
  const classification = classifyMetaLocationType(result);

  if (scope === "country" || scope === "state" || classification === "country" || classification === "region") {
    return false;
  }

  return classification === "city" || classification === "zip" || classification === "neighborhood" || classification === "address";
}

function classifyGeocoderType(type?: string): MetaLocationClassification {
  const value = String(type || "").toLowerCase();
  if (["country"].includes(value)) return "country";
  if (["state", "region", "administrative"].includes(value)) return "region";
  if (["city", "town", "village", "municipality", "locality", "hamlet", "suburb", "neighbourhood", "neighborhood"].includes(value)) {
    return ["suburb", "neighbourhood", "neighborhood"].includes(value) ? "neighborhood" : "city";
  }
  if (["postcode", "postal_code", "zip"].includes(value)) return "zip";
  if (["house", "road", "residential", "building", "apartments", "service", "yes", "address"].includes(value)) return "address";
  return "address";
}

function buildCacheKey(query: string) {
  return query.trim().toLowerCase();
}

function normalizeGeocoderLabel(result: GeocoderSearchResult, fallbackQuery: string) {
  return result.display_name || result.address?.road || result.address?.house_number || fallbackQuery;
}

async function fetchGeocoderAddressSearch(query: string) {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");
  url.searchParams.set("dedupe", "1");
  url.searchParams.set("q", query);

  const response = await fetch(url.toString(), {
    cache: "no-store",
    headers: {
      Accept: "application/json",
      "User-Agent": "SideKick-Studios/location-search",
      Referer: "https://sidekickstudioss.com",
    },
  });

  if (!response.ok) {
    return [];
  }

  const payload = (await response.json().catch(() => null)) as GeocoderSearchResult[] | null;
  return Array.isArray(payload) ? payload : [];
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ suggestions: [], error: "Sign in to search Meta locations." }, { status: 401 });
  }

  const workspaceContext = await ensureWorkspaceContextForUser(user).catch(() => null);
  const workspaceId = workspaceContext?.activeWorkspace.id || null;
  if (!workspaceId) {
    return NextResponse.json({ suggestions: [], error: "Select a workspace to search Meta locations." }, { status: 400 });
  }

  const admin = createSupabaseAdminClient();
  if (!admin) {
    return NextResponse.json({ suggestions: [], error: "Supabase admin access is not available." }, { status: 500 });
  }

  const tokenContext = await getWorkspaceMetaAccessToken({
    admin,
    workspaceId,
  }).catch(() => null);
  if (!tokenContext?.accessToken) {
    return NextResponse.json(
      { suggestions: [], error: "Connect Meta before searching locations." },
      { status: 400 },
    );
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const cacheKey = buildCacheKey(query);
  const cached = searchCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return NextResponse.json({ suggestions: cached.suggestions });
  }

  try {
    const addressQuery = looksLikeAddressQuery(query);
    const [broadPayload, addressPayload, geocoderPayload] = await Promise.all([
      fetchMetaGeoLocationSearch({
        accessToken: tokenContext.accessToken,
        query,
        locationTypes: ["country", "region", "city", "zip", "neighborhood"],
        limit: 12,
      }).catch(() => []),
      addressQuery
        ? fetchMetaGeoLocationSearch({
            accessToken: tokenContext.accessToken,
            query,
            locationTypes: ["address"],
            searchParam: "q",
            placeFallback: true,
            limit: 12,
          }).catch(() => [])
        : Promise.resolve([]),
      addressQuery ? fetchGeocoderAddressSearch(query).catch(() => []) : Promise.resolve([]),
    ]);

    const payload = [...broadPayload, ...addressPayload];
    const deduped = new Map<string, MetaGeoLocationSearchResult>();
    payload.forEach((item) => {
      const key = `${item.type || "unknown"}:${item.key || item.name || query}`;
      if (!deduped.has(key)) {
        deduped.set(key, item);
      }
    });

    const finalPayload = Array.from(deduped.values());

    const suggestions: LocationSuggestion[] = [];

    finalPayload.forEach((item) => {
      const scope = mapScope(item);
      const classification = classifyMetaLocationType(item);
      const lat = parseCoordinate(item.latitude);
      const lon = parseCoordinate(item.longitude);
      suggestions.push({
        id: item.key ? `${scope}:${item.key}` : `${scope}:${item.name || query}`,
        label: item.name || query,
        scope,
        source: "meta",
        lat,
        lon,
        countryCode: item.country_code?.toUpperCase(),
        radiusAllowed: isRadiusAllowed(item, scope),
        distanceUnit: "mile" as const,
        metaLocation: {
          key: item.key,
          type: item.type,
          classification,
          name: item.name,
          addressString: classification === "address" ? item.name : undefined,
          countryCode: item.country_code?.toUpperCase(),
          countryName: item.country_name,
          region: item.region,
          regionId: item.region_id ? String(item.region_id) : undefined,
          primaryCity: item.primary_city,
          primaryCityId: item.primary_city_id ? String(item.primary_city_id) : undefined,
          latitude: lat,
          longitude: lon,
          supportsCity: item.supports_city,
          supportsRegion: item.supports_region,
          raw: item as unknown as Record<string, unknown>,
        },
      });
    });

    geocoderPayload.forEach((item) => {
      const classification = classifyGeocoderType(item.type);
      const scope = classification === "country" ? "country" : classification === "region" ? "state" : classification === "zip" ? "zip" : classification === "neighborhood" ? "neighborhood" : classification === "city" ? "city" : "address";
      const lat = parseCoordinate(item.lat);
      const lon = parseCoordinate(item.lon);
      const label = normalizeGeocoderLabel(item, query);
      const id = `geocoder:${item.osm_type || "place"}:${item.osm_id || item.place_id || label}`;
      suggestions.push({
        id,
        label,
        scope,
        source: "geocoder",
        lat,
        lon,
        countryCode: item.address?.country?.toUpperCase(),
        radiusAllowed: scope === "city" || scope === "zip" || scope === "neighborhood" || scope === "address",
        distanceUnit: "mile" as const,
        metaLocation: {
          key: String(item.osm_id || item.place_id || id),
          type: item.type,
          classification,
          name: label,
          addressString: label,
          countryCode: item.address?.country?.toUpperCase(),
          countryName: item.address?.country,
          region: item.address?.state || item.address?.region,
          primaryCity: item.address?.city || item.address?.town || item.address?.village,
          latitude: lat,
          longitude: lon,
          raw: item as unknown as Record<string, unknown>,
        },
      });
    });

    const normalized = query.toLowerCase();
    if (normalized === "world" || normalized === "worldwide" || normalized.includes("global")) {
      suggestions.unshift({
        id: "worldwide",
        label: "Worldwide",
        scope: "world",
        lat: undefined,
        lon: undefined,
        radiusAllowed: false,
        distanceUnit: "mile",
        metaLocation: { name: "Worldwide", type: "world" } as MetaLocationTargeting,
      });
    }

    const normalizedSuggestions = suggestions
      .filter((suggestion, index, list) => list.findIndex((entry) => entry.id === suggestion.id) === index)
      .sort((a, b) => {
        if (a.source === b.source) return 0;
        if (a.source === "meta") return -1;
        if (b.source === "meta") return 1;
        return 0;
      });

    searchCache.set(cacheKey, {
      expiresAt: Date.now() + searchCacheTtlMs,
      suggestions: normalizedSuggestions,
    });

    return NextResponse.json({ suggestions: normalizedSuggestions });
  } catch {
    return NextResponse.json(
      { suggestions: [], error: "Could not load location suggestions right now." },
      { status: 500 },
    );
  }
}
