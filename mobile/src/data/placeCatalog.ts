import { discoverItems, type DiscoverItem } from "./discoverItems";
import type { Place } from "../models/place";

type DiscoverPlaceMetadata = {
  latitude: number;
  longitude: number;
  estimatedVisitMinutes: number;
  price?: number;
  currency: string;
};

const DISCOVER_PLACE_METADATA: Record<string, DiscoverPlaceMetadata> = {
  "hoi-an-lanterns": {
    latitude: 15.8801,
    longitude: 108.338,
    estimatedVisitMinutes: 180,
    price: 4,
    currency: "EUR",
  },
  "cappadocia-balloons": {
    latitude: 38.6431,
    longitude: 34.8289,
    estimatedVisitMinutes: 210,
    price: 180,
    currency: "EUR",
  },
  "lake-bled": {
    latitude: 46.3625,
    longitude: 14.0938,
    estimatedVisitMinutes: 240,
    price: 0,
    currency: "EUR",
  },
  setenil: {
    latitude: 36.8621,
    longitude: -5.1816,
    estimatedVisitMinutes: 180,
    price: 0,
    currency: "EUR",
  },
  "istanbul-one-day": {
    latitude: 41.0086,
    longitude: 28.9802,
    estimatedVisitMinutes: 540,
    price: 25,
    currency: "EUR",
  },
};

export function discoverItemToPlace(item: DiscoverItem): Place {
  const metadata = item.placeData ?? DISCOVER_PLACE_METADATA[item.id];
  const price = metadata?.price;

  return {
    id: item.id,
    name: item.title,
    city: item.location,
    country: item.country,
    latitude: metadata?.latitude,
    longitude: metadata?.longitude,
    category: item.placeCategory ?? item.category.toLocaleLowerCase(),
    description: item.description,
    estimatedVisitMinutes: metadata?.estimatedVisitMinutes ?? 120,
    price,
    priceLabel: item.price,
    currency: metadata?.currency,
    isFree: item.paymentType === "Free" || price === 0,
    openingHours: { summary: item.openingHours },
    bestSeason: item.bestSeason,
    image: item.image,
    officialWebsite: item.officialSiteUrl,
    ticketsUrl: item.ticketsUrl,
    mapsUrl: item.mapsUrl,
    notes: item.note,
    isDemoData: item.isDemoData,
    source: "discover",
  };
}

function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours === 0) return `${remainder} min`;
  if (remainder === 0) return `${hours} ${hours === 1 ? "hour" : "hours"}`;

  return `${hours}h ${remainder}m`;
}

function livePlacePrice(place: Place) {
  if (place.isFree || place.price === 0) return "Free";
  if (place.priceLabel) return place.priceLabel;
  if (place.price !== undefined) {
    return `${place.price} ${place.currency ?? ""}`.trim();
  }
  if (place.isFree === false) return "Paid · price not provided";

  return "Price not provided";
}

export function placeToDiscoverItem(place: Place): DiscoverItem {
  return {
    id: place.id,
    category: "Place",
    title: place.name,
    location: place.city,
    country: place.country,
    image: place.image ?? "",
    price: livePlacePrice(place),
    paymentType:
      place.isFree || place.price === 0
        ? "Free"
        : place.isFree === false || place.price !== undefined
          ? "Paid"
          : "Unknown",
    ticketInfo: place.ticketsUrl
      ? "Ticket link provided by source"
      : "Not provided by source",
    duration: `${durationLabel(place.estimatedVisitMinutes)} estimate`,
    openingHours:
      place.openingHours?.summary ?? "Not provided by source",
    bestSeason: place.bestSeason ?? "Not provided by source",
    description:
      place.description ?? "No description was provided by the source.",
    keywords: [place.name, place.city, place.country, place.category],
    officialSiteUrl: place.officialWebsite,
    ticketsUrl: place.ticketsUrl,
    mapsUrl:
      place.mapsUrl ??
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${place.latitude ?? ""},${place.longitude ?? ""}`
      )}`,
    placeData:
      place.latitude !== undefined && place.longitude !== undefined
        ? {
            latitude: place.latitude,
            longitude: place.longitude,
            estimatedVisitMinutes: place.estimatedVisitMinutes,
            price: place.price,
            currency: place.currency,
          }
        : undefined,
    placeCategory: place.category,
    isLiveData: place.source === "live",
    dataSource: place.dataSource,
  };
}

export const istanbulDemoPlaces: Place[] = [
  {
    id: "istanbul-hagia-sophia",
    name: "Hagia Sophia",
    city: "Istanbul",
    country: "Turkey",
    latitude: 41.0086,
    longitude: 28.9802,
    category: "history",
    description: "Local demo landmark used to exercise the route planner.",
    estimatedVisitMinutes: 90,
    price: 25,
    currency: "EUR",
    openingHours: { summary: "09:00–19:30" },
    isDemoData: true,
    source: "catalog",
  },
  {
    id: "istanbul-blue-mosque",
    name: "Blue Mosque",
    city: "Istanbul",
    country: "Turkey",
    latitude: 41.0054,
    longitude: 28.9768,
    category: "religious",
    description: "Local demo landmark used to exercise the route planner.",
    estimatedVisitMinutes: 60,
    price: 0,
    currency: "EUR",
    isFree: true,
    openingHours: { summary: "09:00–18:00" },
    isDemoData: true,
    source: "catalog",
  },
  {
    id: "istanbul-basilica-cistern",
    name: "Basilica Cistern",
    city: "Istanbul",
    country: "Turkey",
    latitude: 41.0084,
    longitude: 28.9779,
    category: "history",
    description: "Local demo landmark used to exercise the route planner.",
    estimatedVisitMinutes: 60,
    price: 20,
    currency: "EUR",
    openingHours: { summary: "09:00–18:30" },
    isDemoData: true,
    source: "catalog",
  },
  {
    id: "istanbul-grand-bazaar",
    name: "Grand Bazaar",
    city: "Istanbul",
    country: "Turkey",
    latitude: 41.0107,
    longitude: 28.9681,
    category: "shopping",
    description: "Local demo market used to exercise the route planner.",
    estimatedVisitMinutes: 90,
    price: 0,
    currency: "EUR",
    isFree: true,
    openingHours: { summary: "09:00–19:00" },
    isDemoData: true,
    source: "catalog",
  },
  {
    id: "istanbul-galata-tower",
    name: "Galata Tower",
    city: "Istanbul",
    country: "Turkey",
    latitude: 41.0256,
    longitude: 28.9741,
    category: "views",
    description: "Local demo viewpoint used to exercise the route planner.",
    estimatedVisitMinutes: 75,
    price: 30,
    currency: "EUR",
    openingHours: { summary: "08:30–22:00" },
    isDemoData: true,
    source: "catalog",
  },
  {
    id: "istanbul-dolmabahce-palace",
    name: "Dolmabahçe Palace",
    city: "Istanbul",
    country: "Turkey",
    latitude: 41.0392,
    longitude: 29.0005,
    category: "architecture",
    description: "Local demo palace used to exercise the route planner.",
    estimatedVisitMinutes: 150,
    price: 35,
    currency: "EUR",
    openingHours: { summary: "09:00–17:00" },
    isDemoData: true,
    source: "catalog",
  },
  {
    id: "istanbul-ortakoy-mosque",
    name: "Ortaköy Mosque",
    city: "Istanbul",
    country: "Turkey",
    latitude: 41.0472,
    longitude: 29.0269,
    category: "religious",
    description: "Local demo landmark used to exercise the route planner.",
    estimatedVisitMinutes: 45,
    price: 0,
    currency: "EUR",
    isFree: true,
    openingHours: { summary: "09:00–18:00" },
    isDemoData: true,
    source: "catalog",
  },
  {
    id: "istanbul-modern",
    name: "Istanbul Modern",
    city: "Istanbul",
    country: "Turkey",
    latitude: 41.0268,
    longitude: 28.9847,
    category: "museums",
    description: "Local demo museum used to exercise the route planner.",
    estimatedVisitMinutes: 120,
    price: 18,
    currency: "EUR",
    openingHours: { summary: "10:00–18:00" },
    isDemoData: true,
    source: "catalog",
  },
];

const destinationCatalog: Place[] = [
  {
    id: "barcelona-sagrada-familia",
    name: "Sagrada Família",
    city: "Barcelona",
    country: "Spain",
    latitude: 41.4036,
    longitude: 2.1744,
    category: "architecture",
    description: "Gaudí's landmark basilica and one of Barcelona's essential stops.",
    estimatedVisitMinutes: 120,
    price: 26,
    currency: "EUR",
    openingHours: { summary: "Hours vary by season" },
    image:
      "https://images.unsplash.com/photo-1583779457094-ab6f77f7bf57?auto=format&fit=crop&w=1000&q=85",
    source: "catalog",
  },
  {
    id: "barcelona-park-guell",
    name: "Park Güell",
    city: "Barcelona",
    country: "Spain",
    latitude: 41.4145,
    longitude: 2.1527,
    category: "views",
    description: "A colourful Gaudí park with city views and monumental architecture.",
    estimatedVisitMinutes: 105,
    price: 18,
    currency: "EUR",
    openingHours: { summary: "Timed entry for the monumental zone" },
    image:
      "https://images.unsplash.com/photo-1563897539633-7374c276c212?auto=format&fit=crop&w=1000&q=85",
    source: "catalog",
  },
  {
    id: "barcelona-casa-batllo",
    name: "Casa Batlló",
    city: "Barcelona",
    country: "Spain",
    latitude: 41.3917,
    longitude: 2.1649,
    category: "architecture",
    description: "An immersive visit inside one of Gaudí's most distinctive houses.",
    estimatedVisitMinutes: 90,
    price: 35,
    currency: "EUR",
    openingHours: { summary: "Daily; timed tickets recommended" },
    image:
      "https://images.unsplash.com/photo-1558642084-fd07fae5282e?auto=format&fit=crop&w=1000&q=85",
    source: "catalog",
  },
  {
    id: "barcelona-gothic-quarter",
    name: "Gothic Quarter",
    city: "Barcelona",
    country: "Spain",
    latitude: 41.3839,
    longitude: 2.1763,
    category: "history",
    description: "A walk through medieval lanes, plazas and the old Roman centre.",
    estimatedVisitMinutes: 120,
    price: 0,
    currency: "EUR",
    isFree: true,
    openingHours: { summary: "Open all day" },
    image:
      "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1000&q=85",
    source: "catalog",
  },
  {
    id: "barcelona-la-boqueria",
    name: "La Boqueria",
    city: "Barcelona",
    country: "Spain",
    latitude: 41.3817,
    longitude: 2.1716,
    category: "food",
    description: "Barcelona's central food market, ideal for a flexible lunch stop.",
    estimatedVisitMinutes: 75,
    price: 15,
    priceLabel: "Approx. €15 for food",
    currency: "EUR",
    openingHours: { summary: "Usually Monday–Saturday" },
    image:
      "https://images.unsplash.com/photo-1558110047-2558e3f6fdb2?auto=format&fit=crop&w=1000&q=85",
    source: "catalog",
  },
];

export const discoverPlaces = discoverItems.map(discoverItemToPlace);
export const placeCatalog: Place[] = [
  ...destinationCatalog,
  ...istanbulDemoPlaces,
  ...discoverPlaces,
];

export function getAllPlaces(customPlaces: Place[]) {
  const byId = new Map<string, Place>();

  [...placeCatalog, ...customPlaces].forEach((place) => {
    byId.set(place.id, place);
  });

  return Array.from(byId.values());
}

export function getPlacesByIds(placeIds: string[], customPlaces: Place[]) {
  const idSet = new Set(placeIds);

  return getAllPlaces(customPlaces).filter((place) => idSet.has(place.id));
}
