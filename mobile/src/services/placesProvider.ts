import { getAllPlaces } from "../data/placeCatalog";
import type { Place } from "../models/place";

export type PlacesQuery = {
  city?: string;
  country?: string;
  search?: string;
};

export interface PlacesProvider {
  getPlaces(query?: PlacesQuery): Promise<Place[]>;
  getPlacesByIds(placeIds: string[]): Promise<Place[]>;
}

type PlacesApiResponse = {
  places?: unknown;
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

export class LocalPlacesProvider implements PlacesProvider {
  constructor(private readonly places: Place[]) {}

  async getPlaces(query: PlacesQuery = {}) {
    const city = query.city ? normalize(query.city) : undefined;
    const country = query.country ? normalize(query.country) : undefined;
    const search = query.search ? normalize(query.search) : undefined;

    return this.places.filter((place) => {
      if (city && normalize(place.city) !== city) return false;
      if (country && normalize(place.country) !== country) return false;

      if (search) {
        const searchable = normalize(
          `${place.name} ${place.city} ${place.country} ${place.category}`
        );

        if (!searchable.includes(search)) return false;
      }

      return true;
    });
  }

  async getPlacesByIds(placeIds: string[]) {
    const placeById = new Map(this.places.map((place) => [place.id, place]));

    return Array.from(new Set(placeIds)).flatMap((placeId) => {
      const place = placeById.get(placeId);

      return place ? [place] : [];
    });
  }
}

function apiErrorMessage(payload: unknown, status: number) {
  if (
    payload &&
    typeof payload === "object" &&
    "detail" in payload &&
    typeof payload.detail === "string"
  ) {
    return payload.detail;
  }

  return `Places request failed (${status}).`;
}

function isLivePlace(value: unknown): value is Place {
  if (!value || typeof value !== "object") return false;

  const place = value as Partial<Place>;

  return (
    typeof place.id === "string" &&
    typeof place.name === "string" &&
    typeof place.city === "string" &&
    typeof place.country === "string" &&
    typeof place.category === "string" &&
    typeof place.estimatedVisitMinutes === "number" &&
    place.source === "live"
  );
}

export class ApiPlacesProvider implements PlacesProvider {
  private readonly placeCache = new Map<string, Place>();

  constructor(private readonly apiBaseUrl: string) {}

  async getPlaces(query: PlacesQuery = {}) {
    const parameters: string[] = [];

    if (query.city) {
      parameters.push(`city=${encodeURIComponent(query.city)}`);
    }
    if (query.country) {
      parameters.push(`country=${encodeURIComponent(query.country)}`);
    }
    if (query.search) {
      parameters.push(`q=${encodeURIComponent(query.search)}`);
    }
    parameters.push("limit=30");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 50_000);

    try {
      const response = await fetch(
        `${this.apiBaseUrl}/places/search?${parameters.join("&")}`,
        { signal: controller.signal }
      );
      const payload: PlacesApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(apiErrorMessage(payload, response.status));
      }

      if (!Array.isArray(payload.places)) {
        throw new Error("Places API returned an invalid response.");
      }

      const places = payload.places.filter(isLivePlace);
      places.forEach((place) => this.placeCache.set(place.id, place));

      return places;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Places search timed out. Please try again.");
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getPlacesByIds(placeIds: string[]) {
    return Array.from(new Set(placeIds)).flatMap((placeId) => {
      const place = this.placeCache.get(placeId);

      return place ? [place] : [];
    });
  }
}

export function createLocalPlacesProvider(customPlaces: Place[] = []) {
  return new LocalPlacesProvider(getAllPlaces(customPlaces));
}

export function createApiPlacesProvider(
  apiBaseUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://127.0.0.1:8000"
) {
  return new ApiPlacesProvider(apiBaseUrl.replace(/\/+$/, ""));
}

export const localPlacesProvider = createLocalPlacesProvider();
export const apiPlacesProvider = createApiPlacesProvider();
