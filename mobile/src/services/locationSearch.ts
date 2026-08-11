export type LocationSearchResult = {
  id: string;
  name: string;
  displayName: string;
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  category: string;
  type: string;
  addressType: string;
  sourceUrl: string;
  mapsUrl: string;
};

type LocationSearchResponse = {
  locations?: unknown;
  detail?: unknown;
};

type LocationSearchBias = Pick<
  LocationSearchResult,
  "latitude" | "longitude"
>;

function isLocationSearchResult(value: unknown): value is LocationSearchResult {
  if (!value || typeof value !== "object") return false;

  const location = value as Partial<LocationSearchResult>;

  return (
    typeof location.id === "string" &&
    typeof location.name === "string" &&
    typeof location.displayName === "string" &&
    typeof location.city === "string" &&
    typeof location.country === "string" &&
    typeof location.countryCode === "string" &&
    typeof location.latitude === "number" &&
    Number.isFinite(location.latitude) &&
    typeof location.longitude === "number" &&
    Number.isFinite(location.longitude) &&
    typeof location.category === "string" &&
    typeof location.type === "string" &&
    typeof location.addressType === "string" &&
    typeof location.sourceUrl === "string" &&
    typeof location.mapsUrl === "string"
  );
}

export function getLocationFocusZoom(location: LocationSearchResult) {
  if (location.addressType === "country") return 3.2;
  if (["state", "region", "county"].includes(location.addressType)) return 6;
  if (
    ["city", "town", "municipality", "village"].includes(
      location.addressType
    )
  ) {
    return 10.5;
  }

  return 16;
}

export async function searchLocations(
  query: string,
  bias?: LocationSearchBias | null
) {
  const apiBaseUrl = (
    process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000"
  ).replace(/\/+$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);
  const biasParameters = bias
    ? `&lat=${encodeURIComponent(bias.latitude)}&lon=${encodeURIComponent(
        bias.longitude
      )}`
    : "";

  try {
    const response = await fetch(
      `${apiBaseUrl}/locations/search?q=${encodeURIComponent(
        query
      )}&limit=8${biasParameters}`,
      { signal: controller.signal }
    );
    const payload: LocationSearchResponse = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof payload.detail === "string"
          ? payload.detail
          : `Location search failed (${response.status}).`
      );
    }
    if (!Array.isArray(payload.locations)) {
      throw new Error("Location search returned an invalid response.");
    }

    return payload.locations.filter(isLocationSearchResult);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Location search timed out. Please try again.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
