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

export function createLocalPlacesProvider(customPlaces: Place[] = []) {
  return new LocalPlacesProvider(getAllPlaces(customPlaces));
}

export const localPlacesProvider = createLocalPlacesProvider();
