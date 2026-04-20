import { CampaignLaunchState } from "@/types";

type MetaGeoLocations = {
  location_types?: Array<"home" | "recent" | "travel_in" | "recent_and_home">;
  countries?: string[];
  custom_locations?: Array<{
    latitude: number;
    longitude: number;
    radius: number;
    distance_unit: "mile";
  }>;
};

/**
 * Converts wizard launch-state locations into a Meta-friendly geo_locations shape.
 * This is intentionally conservative and only emits supported fields we can
 * populate reliably from saved launch state today.
 */
export function buildMetaGeoLocations(
  state: CampaignLaunchState,
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

  const customLocations = locations
    .filter(
      (location) =>
        typeof location.lat === "number" &&
        typeof location.lon === "number" &&
        (location.scope === "city" || location.scope === "address"),
    )
    .map((location) => {
      const parsedRadius = Number.parseInt(location.radius || "10", 10);
      const clampedRadius = Number.isFinite(parsedRadius)
        ? Math.min(Math.max(parsedRadius, 1), 50)
        : 10;

      return {
        latitude: location.lat as number,
        longitude: location.lon as number,
        radius: clampedRadius,
        distance_unit: "mile" as const,
      };
    });

  return {
    location_types: locationTypes.length ? locationTypes : ["home"],
    countries: countries.length ? countries : undefined,
    custom_locations: customLocations.length ? customLocations : undefined,
  };
}
