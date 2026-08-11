import { findCountryMetadataByName } from "../data/travelCatalog";
import type { Place } from "../models/place";
import type { Trip } from "../models/travel";

type PlaceLocation = Pick<Place, "city" | "country">;
type TripDestination = Pick<Trip, "destinationCity" | "destinationCountry">;

const CITY_ALIASES: Record<string, string> = {
  istanbul: "istanbul",
  stambul: "istanbul",
  "стамбул": "istanbul",
  vienna: "vienna",
  wien: "vienna",
  "вена": "vienna",
  barcelona: "barcelona",
  "барселона": "barcelona",
  riga: "riga",
  "рига": "riga",
};

const COUNTRY_CODE_ALIASES: Record<string, string> = {
  "австрия": "at",
  "беларусь": "by",
  "великобритания": "gb",
  "германия": "de",
  "греция": "gr",
  "испания": "es",
  "италия": "it",
  "латвия": "lv",
  "литва": "lt",
  "нидерланды": "nl",
  "норвегия": "no",
  "польша": "pl",
  "португалия": "pt",
  "россия": "ru",
  "сша": "us",
  "турция": "tr",
  "финляндия": "fi",
  "франция": "fr",
  "чехия": "cz",
  "швеция": "se",
  "эстония": "ee",
};

export function normalizePlaceLocation(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function canonicalCity(city: string) {
  const normalized = normalizePlaceLocation(city);

  return CITY_ALIASES[normalized] ?? normalized;
}

function canonicalCountry(country: string) {
  const metadata = findCountryMetadataByName(country);

  if (metadata?.id) return metadata.id;

  const normalized = normalizePlaceLocation(country);

  return COUNTRY_CODE_ALIASES[normalized] ?? normalized;
}

export function isPlaceInTripDestination(
  place: PlaceLocation,
  trip: TripDestination
) {
  const placeCity = canonicalCity(place.city);
  const tripCity = canonicalCity(trip.destinationCity);
  const placeCountry = canonicalCountry(place.country);
  const tripCountry = canonicalCountry(trip.destinationCountry);

  return (
    Boolean(placeCity) &&
    Boolean(placeCountry) &&
    placeCity === tripCity &&
    placeCountry === tripCountry
  );
}

export function placeTripMismatchMessage(
  place: PlaceLocation,
  trip: TripDestination
) {
  if (isPlaceInTripDestination(place, trip)) return null;

  return `Only places in ${trip.destinationCity}, ${trip.destinationCountry} can be added.`;
}
