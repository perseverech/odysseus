import type { Place } from "./place";

export const CONTINENTS = [
  "Europe",
  "Asia",
  "Africa",
  "North America",
  "South America",
  "Oceania",
] as const;

export type Continent = (typeof CONTINENTS)[number];

export type TravelMembership = "eu" | "schengen" | "nato";

export type CountryMetadata = {
  id: string;
  name: string;
  continent: Continent | null;
  memberships: TravelMembership[];
};

export type CountryVisit = {
  id: string;
  countryCode: string;
  visitedAt: string;
  tripId?: string;
};

export type CityVisit = {
  id: string;
  city: string;
  countryCode: string;
  visitedAt: string;
  tripId?: string;
};

export type DreamCountry = {
  id: string;
  countryCode: string;
  countryName: string;
  addedAt: string;
};

export type TravelHistoryTrip = {
  id: string;
  title: string;
  countryCodes: string[];
  cityNames: string[];
  startDate: string;
  endDate: string;
  stopCount?: number;
};

export type TripStatus =
  | "planning"
  | "planned"
  | "booked"
  | "completed";

export type TripInterest =
  | "architecture"
  | "history"
  | "food"
  | "museums"
  | "nature"
  | "shopping"
  | "nightlife"
  | "views"
  | "religious"
  | "hidden_gems";

export type TripPace = "relaxed" | "balanced" | "intensive";

export type MaxTravelDistance = "central" | "moderate" | "anywhere";

export type RouteTravelMode = "walk" | "transit";

export type UnscheduledPlaceReason =
  | "closed"
  | "too_far"
  | "not_enough_time"
  | "budget"
  | "missing_coordinates"
  | "removed_manually";

export type RouteStop = {
  id: string;
  placeId: string;
  order: number;
  arrivalTime: string;
  departureTime: string;
  visitMinutes: number;
  travelMinutesFromPrevious: number;
  travelDistanceKm?: number;
  travelModeFromPrevious?: RouteTravelMode;
  breakMinutesBefore?: number;
  breakLabel?: string;
  waitingMinutesBefore?: number;
  waitingLabel?: string;
  isPriority?: boolean;
  estimatedCost: number;
  currency: string;
};

export type RouteDay = {
  id: string;
  date: string;
  dayNumber: number;
  stops: RouteStop[];
  totalVisitMinutes: number;
  totalTravelMinutes: number;
  walkingDistanceKm?: number;
  estimatedCost: number;
  currency: string;
};

export type Trip = {
  id: string;
  destinationCity: string;
  destinationCountry: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  budget?: number;
  currency?: string;
  dailyStartTime?: string;
  dailyEndTime?: string;
  interests?: TripInterest[];
  pace?: TripPace;
  maxTravelDistance?: MaxTravelDistance;
  selectedPlaceIds: string[];
  priorityPlaceIds: string[];
  unscheduledPlaceIds: string[];
  unscheduledPlaceReasons: Partial<
    Record<string, UnscheduledPlaceReason>
  >;
  routeDays?: RouteDay[];
  notes?: string;
  flightIds: string[];
  createdAt: string;
  updatedAt: string;
};

export type Flight = {
  id: string;
  tripId?: string;
  airline?: string;
  flightNumber?: string;
  departureCity: string;
  departureAirport: string;
  departureIata: string;
  arrivalCity: string;
  arrivalAirport: string;
  arrivalIata: string;
  departureDate: string;
  departureTime: string;
  arrivalDate?: string;
  arrivalTime: string;
  terminal?: string;
  gate?: string;
  seat?: string;
  bookingReference?: string;
  notes?: string;
};

export type CreateTripInput = Omit<
  Trip,
  | "id"
  | "flightIds"
  | "selectedPlaceIds"
  | "priorityPlaceIds"
  | "unscheduledPlaceIds"
  | "unscheduledPlaceReasons"
  | "routeDays"
  | "createdAt"
  | "updatedAt"
>;
export type CreateFlightInput = Omit<Flight, "id">;
export type UpdateTripInput = Partial<CreateTripInput>;
export type UpdateFlightInput = CreateFlightInput;

export type TravelData = {
  countryVisits: CountryVisit[];
  cityVisits: CityVisit[];
  dreamCountries: DreamCountry[];
  tripHistory: TravelHistoryTrip[];
  upcomingTrips: Trip[];
  flights: Flight[];
  customPlaces: Place[];
};

export type TravelStatistics = {
  countryCount: number;
  cityCount: number;
  continentCount: number;
  worldPercentage: number;
  tripCount: number;
  countriesThisYear: number;
  wishlistItemCount: number;
  dreamCountryCount: number;
  upcomingTripCount: number;
  continentCounts: Record<Continent, number>;
  membershipCounts: Record<TravelMembership, number>;
  mostExploredContinent: Continent | null;
};
