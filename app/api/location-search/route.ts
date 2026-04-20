import { NextRequest, NextResponse } from "next/server";
import { CampaignLocationScope } from "@/types";

type NominatimResult = {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    country_code?: string;
  };
  class?: string;
  type?: string;
  addresstype?: string;
};

type LocationSuggestion = {
  id: string;
  label: string;
  scope: CampaignLocationScope;
  lat: number;
  lon: number;
  countryCode?: string;
};

function mapScope(result: NominatimResult): CampaignLocationScope {
  const hint = `${result.addresstype || ""} ${result.type || ""} ${result.class || ""}`.toLowerCase();

  if (
    hint.includes("country") ||
    hint.includes("sovereign")
  ) {
    return "country";
  }

  if (
    hint.includes("state") ||
    hint.includes("province") ||
    hint.includes("region")
  ) {
    return "state";
  }

  if (
    hint.includes("city") ||
    hint.includes("town") ||
    hint.includes("village") ||
    hint.includes("county") ||
    hint.includes("municipality")
  ) {
    return "city";
  }

  return "address";
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() || "";
  if (query.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const upstreamUrl = new URL("https://nominatim.openstreetmap.org/search");
  upstreamUrl.searchParams.set("q", query);
  upstreamUrl.searchParams.set("format", "jsonv2");
  upstreamUrl.searchParams.set("addressdetails", "1");
  upstreamUrl.searchParams.set("limit", "8");

  try {
    const response = await fetch(upstreamUrl.toString(), {
      headers: {
        "Accept": "application/json",
        "User-Agent": "SideKickStudioss/1.0 (location-autocomplete)",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ suggestions: [], error: "Location provider unavailable." }, { status: 502 });
    }

    const payload = (await response.json()) as NominatimResult[];
    const suggestions = payload
      .map((item) => {
        const lat = Number.parseFloat(item.lat);
        const lon = Number.parseFloat(item.lon);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

        return {
          id: String(item.place_id),
          label: item.display_name,
          scope: mapScope(item),
          lat,
          lon,
          ...(item.address?.country_code ? { countryCode: item.address.country_code.toUpperCase() } : {}),
        };
      })
      .filter((item): item is LocationSuggestion => Boolean(item));

    const normalized = query.toLowerCase();
    if (normalized === "world" || normalized === "worldwide" || normalized.includes("global")) {
      suggestions.unshift({
        id: "worldwide",
        label: "Worldwide",
        scope: "world",
        lat: 0,
        lon: 0,
      });
    }

    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json(
      { suggestions: [], error: "Could not load location suggestions right now." },
      { status: 500 },
    );
  }
}
