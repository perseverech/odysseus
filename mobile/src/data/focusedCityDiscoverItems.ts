import type { DiscoverItem } from "./discoverItems";

type CityConfig = {
  city: string;
  country: string;
  currency: string;
  officialSiteUrl: string;
  bestSeason: string;
};

type PlaceSeed = {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  placeCategory: string;
  estimatedVisitMinutes: number;
  price: number;
  openingHours: string;
  description: string;
  keywords: string[];
  image: string;
};

const istanbul: CityConfig = {
  city: "Istanbul",
  country: "Turkey",
  currency: "EUR",
  officialSiteUrl: "https://visit.istanbul/",
  bestSeason: "April – June / September – October",
};

const barcelona: CityConfig = {
  city: "Barcelona",
  country: "Spain",
  currency: "EUR",
  officialSiteUrl: "https://www.barcelonaturisme.com/wv3/en/",
  bestSeason: "March – June / September – November",
};

const istanbulImages = [
  "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1527838832700-5059252407fa?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=85",
] as const;

const barcelonaImages = [
  "https://images.unsplash.com/photo-1583779457094-ab6f77f7bf57?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1563897539633-7374c276c212?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1558642084-fd07fae5282e?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=85",
] as const;

function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours === 0) return `${remainder} min`;
  if (remainder === 0) return `${hours} ${hours === 1 ? "hour" : "hours"}`;

  return `${hours} hour ${remainder} min`;
}

function createCityPlace(config: CityConfig, seed: PlaceSeed): DiscoverItem {
  const isFree = seed.price === 0;

  return {
    id: seed.id,
    category: "Place",
    title: seed.title,
    location: config.city,
    country: config.country,
    image: seed.image,
    price: isFree ? "Free" : `Demo estimate · €${seed.price}`,
    paymentType: isFree ? "Free" : "Paid",
    ticketInfo: isFree
      ? "No demo admission cost"
      : "Demo admission estimate; check the official source",
    duration: durationLabel(seed.estimatedVisitMinutes),
    openingHours: `Demo schedule · ${seed.openingHours}`,
    bestSeason: config.bestSeason,
    description: seed.description,
    note:
      "This local catalog entry is for application testing. Prices and opening hours are not live.",
    keywords: [
      seed.title,
      seed.placeCategory,
      config.city,
      config.country,
      ...seed.keywords,
    ],
    officialSiteUrl: config.officialSiteUrl,
    mapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      `${seed.title} ${config.city} ${config.country}`
    )}`,
    placeData: {
      latitude: seed.latitude,
      longitude: seed.longitude,
      estimatedVisitMinutes: seed.estimatedVisitMinutes,
      price: seed.price,
      currency: config.currency,
    },
    placeCategory: seed.placeCategory,
    isDemoData: true,
  };
}

const istanbulSeeds: PlaceSeed[] = [
  {
    id: "istanbul-hagia-sophia",
    title: "Hagia Sophia",
    latitude: 41.0086,
    longitude: 28.9802,
    placeCategory: "history",
    estimatedVisitMinutes: 90,
    price: 25,
    openingHours: "09:00–19:30",
    description:
      "A major historic landmark in Sultanahmet, useful for testing priority places and central route clusters.",
    keywords: ["Sultanahmet", "architecture", "Айя-София", "Стамбул"],
    image: istanbulImages[0],
  },
  {
    id: "istanbul-blue-mosque",
    title: "Blue Mosque",
    latitude: 41.0054,
    longitude: 28.9768,
    placeCategory: "religious",
    estimatedVisitMinutes: 60,
    price: 0,
    openingHours: "09:00–18:00",
    description:
      "A free religious landmark close to Hagia Sophia, ideal for testing nearby stops and mixed budgets.",
    keywords: ["mosque", "Sultanahmet", "Голубая мечеть", "Стамбул"],
    image: istanbulImages[1],
  },
  {
    id: "istanbul-basilica-cistern",
    title: "Basilica Cistern",
    latitude: 41.0084,
    longitude: 28.9779,
    placeCategory: "history",
    estimatedVisitMinutes: 60,
    price: 20,
    openingHours: "09:00–18:30",
    description:
      "An underground historic site near Sultanahmet that creates a short paid stop in a dense cluster.",
    keywords: ["cistern", "underground", "Цистерна Базилика", "Стамбул"],
    image: istanbulImages[2],
  },
  {
    id: "istanbul-grand-bazaar",
    title: "Grand Bazaar",
    latitude: 41.0107,
    longitude: 28.9681,
    placeCategory: "shopping",
    estimatedVisitMinutes: 90,
    price: 0,
    openingHours: "09:00–19:00",
    description:
      "A large covered market included for shopping interests, flexible visits and lunch-area testing.",
    keywords: ["market", "shopping", "Гранд-базар", "Стамбул"],
    image: istanbulImages[0],
  },
  {
    id: "istanbul-galata-tower",
    title: "Galata Tower",
    latitude: 41.0256,
    longitude: 28.9741,
    placeCategory: "views",
    estimatedVisitMinutes: 75,
    price: 30,
    openingHours: "08:30–22:00",
    description:
      "A viewpoint north of the historic peninsula for testing travel between neighbouring Istanbul clusters.",
    keywords: ["tower", "viewpoint", "Галатская башня", "Стамбул"],
    image: istanbulImages[1],
  },
  {
    id: "istanbul-dolmabahce-palace",
    title: "Dolmabahçe Palace",
    latitude: 41.0392,
    longitude: 29.0005,
    placeCategory: "architecture",
    estimatedVisitMinutes: 150,
    price: 35,
    openingHours: "09:00–17:00",
    description:
      "A long palace visit that helps test opening-hour limits, budgets and realistic daily capacity.",
    keywords: ["palace", "architecture", "Долмабахче", "Стамбул"],
    image: istanbulImages[2],
  },
  {
    id: "istanbul-ortakoy-mosque",
    title: "Ortaköy Mosque",
    latitude: 41.0472,
    longitude: 29.0269,
    placeCategory: "religious",
    estimatedVisitMinutes: 45,
    price: 0,
    openingHours: "09:00–18:00",
    description:
      "A Bosphorus-side landmark positioned farther east for testing distance and Unscheduled logic.",
    keywords: ["Bosphorus", "mosque", "Ортакёй", "Стамбул"],
    image: istanbulImages[0],
  },
  {
    id: "istanbul-modern",
    title: "Istanbul Modern",
    latitude: 41.0268,
    longitude: 28.9847,
    placeCategory: "museums",
    estimatedVisitMinutes: 120,
    price: 18,
    openingHours: "10:00–18:00",
    description:
      "A longer museum stop for testing art interests, later opening times and route-day capacity.",
    keywords: ["museum", "modern art", "музей", "Стамбул"],
    image: istanbulImages[1],
  },
];

const barcelonaSeeds: PlaceSeed[] = [
  {
    id: "barcelona-sagrada-familia",
    title: "Sagrada Família",
    latitude: 41.4036,
    longitude: 2.1744,
    placeCategory: "architecture",
    estimatedVisitMinutes: 120,
    price: 26,
    openingHours: "09:00–18:00",
    description:
      "A major Barcelona architecture stop included for ticket, budget and priority-place testing.",
    keywords: ["Gaudi", "basilica", "Саграда Фамилия", "Барселона"],
    image: barcelonaImages[0],
  },
  {
    id: "barcelona-park-guell",
    title: "Park Güell",
    latitude: 41.4145,
    longitude: 2.1527,
    placeCategory: "views",
    estimatedVisitMinutes: 105,
    price: 18,
    openingHours: "09:30–19:30",
    description:
      "A colourful park and viewpoint for testing a stop outside the tight city-centre cluster.",
    keywords: ["Gaudi", "park", "views", "Парк Гуэль", "Барселона"],
    image: barcelonaImages[1],
  },
  {
    id: "barcelona-casa-batllo",
    title: "Casa Batlló",
    latitude: 41.3917,
    longitude: 2.1649,
    placeCategory: "architecture",
    estimatedVisitMinutes: 90,
    price: 35,
    openingHours: "09:00–20:00",
    description:
      "A paid architecture visit in central Barcelona, useful for budget and duration testing.",
    keywords: ["Gaudi", "house", "Каса-Батльо", "Барселона"],
    image: barcelonaImages[2],
  },
  {
    id: "barcelona-gothic-quarter",
    title: "Gothic Quarter",
    latitude: 41.3839,
    longitude: 2.1763,
    placeCategory: "history",
    estimatedVisitMinutes: 120,
    price: 0,
    openingHours: "00:00–23:59",
    description:
      "A free historic-area walk that can be combined with nearby central stops and flexible breaks.",
    keywords: ["old town", "history", "Готический квартал", "Барселона"],
    image: barcelonaImages[3],
  },
  {
    id: "barcelona-la-boqueria",
    title: "La Boqueria",
    latitude: 41.3817,
    longitude: 2.1716,
    placeCategory: "food",
    estimatedVisitMinutes: 75,
    price: 15,
    openingHours: "09:00–19:00",
    description:
      "A central food-market stop for testing food interests, mixed spending and lunchtime planning.",
    keywords: ["market", "food", "Бокерия", "Барселона"],
    image: barcelonaImages[0],
  },
  {
    id: "barcelona-picasso-museum",
    title: "Picasso Museum",
    latitude: 41.3853,
    longitude: 2.1809,
    placeCategory: "museums",
    estimatedVisitMinutes: 120,
    price: 14,
    openingHours: "10:00–19:00",
    description:
      "A two-hour museum visit near the old city for testing later openings and culture-focused routes.",
    keywords: ["Picasso", "museum", "art", "музей Пикассо", "Барселона"],
    image: barcelonaImages[1],
  },
  {
    id: "barcelona-barceloneta-beach",
    title: "Barceloneta Beach",
    latitude: 41.3784,
    longitude: 2.1925,
    placeCategory: "nature",
    estimatedVisitMinutes: 120,
    price: 0,
    openingHours: "00:00–23:59",
    description:
      "A flexible free seaside stop for balancing museums and architecture with outdoor time.",
    keywords: ["beach", "sea", "nature", "Барселонета", "Барселона"],
    image: barcelonaImages[2],
  },
  {
    id: "barcelona-bunkers-del-carmel",
    title: "Bunkers del Carmel",
    latitude: 41.4186,
    longitude: 2.1619,
    placeCategory: "views",
    estimatedVisitMinutes: 90,
    price: 0,
    openingHours: "09:00–19:30",
    description:
      "A hilltop viewpoint for testing travel distance, elevation-area grouping and evening stops.",
    keywords: ["viewpoint", "sunset", "bunkers", "Бункерс-дель-Кармель", "Барселона"],
    image: barcelonaImages[3],
  },
];

export const focusedCityDiscoverItems: DiscoverItem[] = istanbulSeeds.flatMap(
  (seed, index) => [
    createCityPlace(istanbul, seed),
    createCityPlace(barcelona, barcelonaSeeds[index]),
  ]
);
