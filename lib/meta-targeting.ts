import { CampaignLaunchLocation } from "@/types";
import { CampaignLaunchView } from "@/lib/campaign-launch";

type MetaGeoLocations = {
  location_types?: Array<"home" | "recent" | "travel_in" | "recent_and_home">;
  countries?: string[];
  regions?: Array<{ key: string; radius?: number; distance_unit: "mile" | "kilometer" }>;
  cities?: Array<{ key: string; radius?: number; distance_unit: "mile" | "kilometer" }>;
  zips?: Array<{ key: string }>;
  neighborhoods?: Array<{ key: string }>;
  custom_locations?: Array<{
    latitude?: number;
    longitude?: number;
    radius: number;
    distance_unit: "mile" | "kilometer";
    address_string?: string;
  }>;
};

/**
 * Converts wizard launch-state locations into a Meta-friendly geo_locations shape.
 * This is intentionally conservative and only emits supported fields we can
 * populate reliably from saved launch state today.
 */
export function buildMetaGeoLocations(
  state: Pick<CampaignLaunchView, "targetLocations">,
): MetaGeoLocations {
  const locations = state.targetLocations || [];
  if (!locations.length) return {};
  if (locations.some((location) => location.scope === "world")) {
    return {};
  }

  const locationTypes = Array.from(
    new Set(locations.map((location) => location.targetingMode)),
  );

  const countries = Array.from(
    new Set(
      locations
        .filter((location) => location.scope === "country" && location.countryCode)
        .map((location) => location.countryCode!.toUpperCase()),
    ),
  );

  const toRadius = (location: (typeof locations)[number]) => {
    return clampRadius(location.radius);
  };

  const regions = locations
    .filter((location) => location.scope === "state" && location.metaLocation?.key)
    .map((location) => ({
      key: String(location.metaLocation?.key),
      radius: canUseRadius(location) ? toRadius(location) : undefined,
      distance_unit: (location.distanceUnit || "mile") as "mile" | "kilometer",
    }));

  const cities = locations
    .filter((location) => location.scope === "city" && location.metaLocation?.key)
    .map((location) => ({
      key: String(location.metaLocation?.key),
      radius: canUseRadius(location) ? toRadius(location) : undefined,
      distance_unit: (location.distanceUnit || "mile") as "mile" | "kilometer",
    }));

  const zips = locations
    .filter((location) => location.scope === "zip" && location.metaLocation?.key)
    .map((location) => ({
      key: String(location.metaLocation?.key),
    }));

  const neighborhoods = locations
    .filter((location) => location.scope === "neighborhood" && location.metaLocation?.key)
    .map((location) => ({
      key: String(location.metaLocation?.key),
    }));

  const customLocations = locations
    .filter(
      (location) =>
        location.scope === "address" ||
        ((location.scope === "city" || location.scope === "neighborhood") && !location.metaLocation?.key),
    )
    .map((location) => ({
      radius: toRadius(location),
      distance_unit: (location.distanceUnit || "mile") as "mile" | "kilometer",
      ...(typeof location.lat === "number" && typeof location.lon === "number"
        ? {
            latitude: location.lat as number,
            longitude: location.lon as number,
          }
        : {}),
      address_string:
        location.metaLocation?.addressString ||
        location.metaLocation?.name ||
        location.label,
    }));

  return {
    location_types: locationTypes.length ? locationTypes : ["home"],
    countries: countries.length ? countries : undefined,
    regions: regions.length ? regions : undefined,
    cities: cities.length ? cities : undefined,
    zips: zips.length ? zips : undefined,
    neighborhoods: neighborhoods.length ? neighborhoods : undefined,
    custom_locations: customLocations.length ? customLocations : undefined,
  };
}

function canUseRadius(location: CampaignLaunchLocation) {
  return Boolean(
    location.radiusAllowed ??
      (location.scope === "city" || location.scope === "zip" || location.scope === "neighborhood" || location.scope === "address"),
  );
}

function clampRadius(radius: string | number | undefined) {
  const value = typeof radius === "number" ? radius : Number.parseInt(radius || "10", 10);
  if (!Number.isFinite(value)) return 10;
  return Math.min(Math.max(value, 1), 50);
}
