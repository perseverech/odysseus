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

export type TripStatus = "planned" | "booked";

export type Trip = {
  id: string;
  destinationCity: string;
  destinationCountry: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  notes?: string;
  flightIds: string[];
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

export type CreateTripInput = Omit<Trip, "id" | "flightIds">;
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
