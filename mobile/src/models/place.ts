export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type OpeningHoursPeriod = {
  opensAt: string;
  closesAt: string;
};

export type OpeningHours = {
  summary?: string;
  timezone?: string;
  weekly?: Partial<Record<Weekday, OpeningHoursPeriod[]>>;
};

export type PlaceSource = "catalog" | "discover" | "manual";

export type Place = {
  id: string;
  name: string;
  city: string;
  country: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  category: string;
  description?: string;
  estimatedVisitMinutes: number;
  price?: number;
  priceLabel?: string;
  currency?: string;
  isFree?: boolean;
  openingHours?: OpeningHours;
  bestSeason?: string;
  image?: string;
  officialWebsite?: string;
  ticketsUrl?: string;
  mapsUrl?: string;
  notes?: string;
  isDemoData?: boolean;
  source: PlaceSource;
  createdAt?: string;
  updatedAt?: string;
};

export type CreatePlaceInput = Omit<
  Place,
  "id" | "source" | "createdAt" | "updatedAt"
>;
