import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { createInitialTravelData } from "../data/initialTravelData";
import {
  findCountryMetadataByName,
  getCountryMetadata,
  normalizeCountryCode,
  normalizeCountryName,
} from "../data/travelCatalog";
import type {
  CityVisit,
  CountryVisit,
  CreateFlightInput,
  CreateTripInput,
  DreamCountry,
  Flight,
  TravelData,
  TravelHistoryTrip,
  Trip,
  UpdateFlightInput,
  UpdateTripInput,
} from "../models/travel";
import {
  asyncTravelStorage,
  type TravelStorage,
} from "../storage/travelStorage";

type AddDreamCountryResult =
  | "added"
  | "duplicate"
  | "invalid"
  | "visited";

type LegacyTrip = {
  id: string;
  title: string;
  countryCodes: string[];
  cityNames: string[];
  status: "draft" | "upcoming" | "completed";
  startDate?: string;
  endDate?: string;
  stopCount?: number;
};

type LegacyTravelData = Partial<TravelData> & {
  dreamCountryCodes?: string[];
  trips?: LegacyTrip[];
};

type TravelDataContextType = {
  travelData: TravelData;
  dreamCountries: DreamCountry[];
  trips: Trip[];
  flights: Flight[];
  visitedCountries: CountryVisit[];
  visitedCities: CityVisit[];
  visitedCountryCodes: string[];
  dreamCountryCodes: string[];
  setVisitedCountryCodes: (countryCodes: string[]) => void;
  setDreamCountryCodes: (countryCodes: string[]) => void;
  addDreamCountry: (countryName: string) => AddDreamCountryResult;
  removeDreamCountry: (id: string) => void;
  addTrip: (input: CreateTripInput) => Trip;
  updateTrip: (id: string, input: UpdateTripInput) => void;
  deleteTrip: (id: string) => void;
  addFlight: (input: CreateFlightInput) => Flight;
  updateFlight: (id: string, input: UpdateFlightInput) => void;
  deleteFlight: (id: string) => void;
};

const TravelDataContext = createContext<
  TravelDataContextType | undefined
>(undefined);

function uniqueCountryCodes(countryCodes: string[]) {
  return Array.from(
    new Set(countryCodes.map(normalizeCountryCode).filter(Boolean))
  );
}

function createDreamCountry(
  countryCode: string,
  countryName: string,
  suffix: string | number = Date.now()
): DreamCountry {
  const normalizedCode = normalizeCountryCode(countryCode);

  return {
    id: `dream-${normalizedCode.replace(/[^a-z0-9]+/g, "-")}-${suffix}`,
    countryCode: normalizedCode,
    countryName: countryName.trim(),
    addedAt: new Date().toISOString(),
  };
}

function migrateLegacyTripToUpcoming(trip: LegacyTrip): Trip {
  const country = getCountryMetadata(trip.countryCodes[0] ?? "");
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: trip.id,
    destinationCity: trip.cityNames[0] ?? trip.title,
    destinationCountry: country.name,
    startDate: trip.startDate ?? today,
    endDate: trip.endDate ?? trip.startDate ?? today,
    status: "planned",
    flightIds: [],
  };
}

function migrateLegacyTripToHistory(
  trip: LegacyTrip
): TravelHistoryTrip {
  const today = new Date().toISOString().slice(0, 10);

  return {
    id: trip.id,
    title: trip.title,
    countryCodes: trip.countryCodes,
    cityNames: trip.cityNames,
    startDate: trip.startDate ?? today,
    endDate: trip.endDate ?? trip.startDate ?? today,
    stopCount: trip.stopCount,
  };
}

function migrateTravelData(value: unknown): TravelData {
  const fallback = createInitialTravelData();

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const storedData = value as LegacyTravelData;
  const legacyCodes = Array.isArray(storedData.dreamCountryCodes)
    ? uniqueCountryCodes(storedData.dreamCountryCodes)
    : [];
  const migratedDreamCountries = legacyCodes.map(
    (countryCode, index) => {
      const country = getCountryMetadata(countryCode);

      return createDreamCountry(
        country.id,
        country.name,
        `migrated-${index}`
      );
    }
  );
  const legacyTrips = Array.isArray(storedData.trips)
    ? storedData.trips
    : [];
  const migratedUpcomingTrips = legacyTrips
    .filter((trip) => trip.status !== "completed")
    .map(migrateLegacyTripToUpcoming);
  const migratedTripHistory = legacyTrips
    .filter((trip) => trip.status === "completed")
    .map(migrateLegacyTripToHistory);

  return {
    countryVisits: Array.isArray(storedData.countryVisits)
      ? storedData.countryVisits
      : fallback.countryVisits,
    cityVisits: Array.isArray(storedData.cityVisits)
      ? storedData.cityVisits
      : fallback.cityVisits,
    dreamCountries: Array.isArray(storedData.dreamCountries)
      ? storedData.dreamCountries
      : migratedDreamCountries.length > 0
        ? migratedDreamCountries
        : fallback.dreamCountries,
    tripHistory: Array.isArray(storedData.tripHistory)
      ? storedData.tripHistory
      : legacyTrips.length > 0
        ? migratedTripHistory
        : fallback.tripHistory,
    upcomingTrips: Array.isArray(storedData.upcomingTrips)
      ? storedData.upcomingTrips
      : legacyTrips.length > 0
        ? migratedUpcomingTrips
        : fallback.upcomingTrips,
    flights: Array.isArray(storedData.flights)
      ? storedData.flights
      : legacyTrips.length > 0
        ? []
        : fallback.flights,
  };
}

function trimmedOptional(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed || undefined;
}

function normalizeFlightInput(input: CreateFlightInput) {
  return {
    ...input,
    tripId: trimmedOptional(input.tripId),
    airline: trimmedOptional(input.airline),
    flightNumber: trimmedOptional(input.flightNumber),
    departureCity: input.departureCity.trim(),
    departureAirport: input.departureAirport.trim(),
    departureIata: input.departureIata.trim().toLocaleUpperCase(),
    arrivalCity: input.arrivalCity.trim(),
    arrivalAirport: input.arrivalAirport.trim(),
    arrivalIata: input.arrivalIata.trim().toLocaleUpperCase(),
    departureDate: input.departureDate.trim(),
    departureTime: input.departureTime.trim(),
    arrivalDate: trimmedOptional(input.arrivalDate),
    arrivalTime: input.arrivalTime.trim(),
    terminal: trimmedOptional(input.terminal),
    gate: trimmedOptional(input.gate),
    seat: trimmedOptional(input.seat),
    bookingReference: trimmedOptional(input.bookingReference),
    notes: trimmedOptional(input.notes),
  };
}

export function TravelDataProvider({
  children,
  storage = asyncTravelStorage,
}: {
  children: ReactNode;
  storage?: TravelStorage;
}) {
  const [travelData, setTravelData] = useState<TravelData>(() =>
    createInitialTravelData()
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    async function loadTravelData() {
      try {
        const stored = await storage.load();

        if (stored) {
          setTravelData(migrateTravelData(stored));
        }
      } catch (error) {
        console.log("Travel data load error:", error);
      } finally {
        setIsHydrated(true);
      }
    }

    loadTravelData();
  }, [storage]);

  useEffect(() => {
    if (!isHydrated) return;

    storage.save(travelData).catch((error) => {
      console.log("Travel data save error:", error);
    });
  }, [isHydrated, storage, travelData]);

  const visitedCountryCodes = useMemo(
    () =>
      uniqueCountryCodes(
        travelData.countryVisits.map(
          (visit) => visit.countryCode
        )
      ),
    [travelData.countryVisits]
  );
  const dreamCountryCodes = useMemo(
    () =>
      uniqueCountryCodes(
        travelData.dreamCountries.map(
          (country) => country.countryCode
        )
      ),
    [travelData.dreamCountries]
  );

  function setVisitedCountryCodes(countryCodes: string[]) {
    const nextCodes = uniqueCountryCodes(countryCodes);
    const nextCodeSet = new Set(nextCodes);

    setTravelData((current) => {
      const existingCodes = new Set(
        current.countryVisits.map((visit) =>
          normalizeCountryCode(visit.countryCode)
        )
      );
      const retainedVisits = current.countryVisits.filter((visit) =>
        nextCodeSet.has(normalizeCountryCode(visit.countryCode))
      );
      const newVisits = nextCodes
        .filter((countryCode) => !existingCodes.has(countryCode))
        .map((countryCode) => ({
          id: `country-${countryCode}-${Date.now()}`,
          countryCode,
          visitedAt: new Date().toISOString().slice(0, 10),
        }));

      return {
        ...current,
        countryVisits: [...retainedVisits, ...newVisits],
        cityVisits: current.cityVisits.filter((visit) =>
          nextCodeSet.has(normalizeCountryCode(visit.countryCode))
        ),
        dreamCountries: current.dreamCountries.filter(
          (country) =>
            !nextCodeSet.has(
              normalizeCountryCode(country.countryCode)
            )
        ),
      };
    });
  }

  function setDreamCountryCodes(countryCodes: string[]) {
    const visitedCodeSet = new Set(visitedCountryCodes);
    const nextCodes = uniqueCountryCodes(countryCodes).filter(
      (countryCode) => !visitedCodeSet.has(countryCode)
    );
    const nextCodeSet = new Set(nextCodes);

    setTravelData((current) => {
      const retainedCountries = current.dreamCountries.filter(
        (country) =>
          nextCodeSet.has(
            normalizeCountryCode(country.countryCode)
          )
      );
      const existingCodeSet = new Set(
        retainedCountries.map((country) =>
          normalizeCountryCode(country.countryCode)
        )
      );
      const newCountries = nextCodes
        .filter((countryCode) => !existingCodeSet.has(countryCode))
        .map((countryCode, index) => {
          const country = getCountryMetadata(countryCode);

          return createDreamCountry(
            country.id,
            country.name,
            `${Date.now()}-${index}`
          );
        });

      return {
        ...current,
        dreamCountries: [...retainedCountries, ...newCountries],
      };
    });
  }

  function addDreamCountry(
    countryName: string
  ): AddDreamCountryResult {
    const trimmedName = countryName.trim();

    if (!trimmedName) return "invalid";

    const catalogCountry = findCountryMetadataByName(trimmedName);
    const resolvedCode =
      catalogCountry?.id ??
      `name:${normalizeCountryName(trimmedName)}`;
    const resolvedName = catalogCountry?.name ?? trimmedName;

    if (visitedCountryCodes.includes(resolvedCode)) return "visited";

    const duplicate = travelData.dreamCountries.some(
      (country) =>
        normalizeCountryCode(country.countryCode) === resolvedCode ||
        normalizeCountryName(country.countryName) ===
          normalizeCountryName(resolvedName)
    );

    if (duplicate) return "duplicate";

    setTravelData((current) => ({
      ...current,
      dreamCountries: [
        ...current.dreamCountries,
        createDreamCountry(resolvedCode, resolvedName),
      ],
    }));

    return "added";
  }

  function removeDreamCountry(id: string) {
    setTravelData((current) => ({
      ...current,
      dreamCountries: current.dreamCountries.filter(
        (country) => country.id !== id
      ),
    }));
  }

  function addTrip(input: CreateTripInput) {
    const trip: Trip = {
      ...input,
      id: `trip-${input.destinationCity
        .trim()
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      destinationCity: input.destinationCity.trim(),
      destinationCountry: input.destinationCountry.trim(),
      startDate: input.startDate.trim(),
      endDate: input.endDate.trim(),
      notes: trimmedOptional(input.notes),
      flightIds: [],
    };

    setTravelData((current) => ({
      ...current,
      upcomingTrips: [...current.upcomingTrips, trip],
    }));

    return trip;
  }

  function updateTrip(id: string, input: UpdateTripInput) {
    setTravelData((current) => ({
      ...current,
      upcomingTrips: current.upcomingTrips.map((trip) =>
        trip.id === id
          ? {
              ...trip,
              ...input,
              destinationCity:
                input.destinationCity?.trim() ?? trip.destinationCity,
              destinationCountry:
                input.destinationCountry?.trim() ??
                trip.destinationCountry,
              startDate: input.startDate?.trim() ?? trip.startDate,
              endDate: input.endDate?.trim() ?? trip.endDate,
              notes:
                input.notes === undefined
                  ? trip.notes
                  : trimmedOptional(input.notes),
            }
          : trip
      ),
    }));
  }

  function deleteTrip(id: string) {
    setTravelData((current) => ({
      ...current,
      upcomingTrips: current.upcomingTrips.filter(
        (trip) => trip.id !== id
      ),
      flights: current.flights.map((flight) =>
        flight.tripId === id
          ? { ...flight, tripId: undefined }
          : flight
      ),
    }));
  }

  function addFlight(input: CreateFlightInput) {
    const route = `${input.departureIata}-${input.arrivalIata}`
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const flight: Flight = {
      ...normalizeFlightInput(input),
      id: `flight-${route}-${Date.now()}`,
    };

    setTravelData((current) => ({
      ...current,
      flights: [...current.flights, flight],
      upcomingTrips: current.upcomingTrips.map((trip) =>
        trip.id === flight.tripId
          ? {
              ...trip,
              flightIds: Array.from(
                new Set([...trip.flightIds, flight.id])
              ),
            }
          : trip
      ),
    }));

    return flight;
  }

  function updateFlight(id: string, input: UpdateFlightInput) {
    const normalizedInput = normalizeFlightInput(input);

    setTravelData((current) => ({
      ...current,
      flights: current.flights.map((flight) =>
        flight.id === id
          ? { ...flight, ...normalizedInput }
          : flight
      ),
      upcomingTrips: current.upcomingTrips.map((trip) => {
        const withoutFlight = trip.flightIds.filter(
          (flightId) => flightId !== id
        );

        return trip.id === normalizedInput.tripId
          ? {
              ...trip,
              flightIds: [...withoutFlight, id],
            }
          : { ...trip, flightIds: withoutFlight };
      }),
    }));
  }

  function deleteFlight(id: string) {
    setTravelData((current) => ({
      ...current,
      flights: current.flights.filter((flight) => flight.id !== id),
      upcomingTrips: current.upcomingTrips.map((trip) => ({
        ...trip,
        flightIds: trip.flightIds.filter((flightId) => flightId !== id),
      })),
    }));
  }

  return (
    <TravelDataContext.Provider
      value={{
        travelData,
        dreamCountries: travelData.dreamCountries,
        trips: travelData.upcomingTrips,
        flights: travelData.flights,
        visitedCountries: travelData.countryVisits,
        visitedCities: travelData.cityVisits,
        visitedCountryCodes,
        dreamCountryCodes,
        setVisitedCountryCodes,
        setDreamCountryCodes,
        addDreamCountry,
        removeDreamCountry,
        addTrip,
        updateTrip,
        deleteTrip,
        addFlight,
        updateFlight,
        deleteFlight,
      }}
    >
      {children}
    </TravelDataContext.Provider>
  );
}

export function useTravelData() {
  const context = useContext(TravelDataContext);

  if (!context) {
    throw new Error(
      "useTravelData must be used inside TravelDataProvider"
    );
  }

  return context;
}
