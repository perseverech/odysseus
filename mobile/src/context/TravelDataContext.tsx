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
  normalizePackingItems,
} from "../data/packingChecklist";
import { placeCatalog } from "../data/placeCatalog";
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
  RouteDay,
  UnscheduledPlaceReason,
  UpdateFlightInput,
  UpdateTripInput,
} from "../models/travel";
import type { CreatePlaceInput, Place } from "../models/place";
import {
  asyncTravelStorage,
  type TravelStorage,
} from "../storage/travelStorage";
import { isPlaceInTripDestination } from "../utils/placeCompatibility";

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
  customPlaces: Place[];
  livePlaces: Place[];
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
  setTripSelectedPlaceIds: (id: string, placeIds: string[]) => void;
  setTripRoutePlan: (
    id: string,
    routeDays: RouteDay[],
    unscheduledPlaceIds?: string[],
    unscheduledPlaceReasons?: Partial<Record<string, UnscheduledPlaceReason>>
  ) => void;
  setTripPriorityPlaceIds: (id: string, placeIds: string[]) => void;
  toggleTripPackingItem: (tripId: string, itemId: string) => void;
  addTripPackingItem: (tripId: string, label: string) => void;
  deleteTripPackingItem: (tripId: string, itemId: string) => void;
  resetTripPackingChecklist: (tripId: string) => void;
  addCustomPlace: (input: CreatePlaceInput) => Place;
  deleteCustomPlace: (id: string) => void;
  cacheLivePlaces: (places: Place[]) => void;
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

const tripStatuses = new Set<Trip["status"]>([
  "planning",
  "planned",
  "booked",
  "completed",
]);

function normalizeStoredTrip(trip: Partial<Trip>): Trip {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  const id = trip.id ?? `trip-migrated-${Date.now()}`;
  const status = tripStatuses.has(trip.status ?? "planning")
    ? trip.status ?? "planning"
    : "planning";

  return {
    id,
    destinationCity: trip.destinationCity?.trim() || "Untitled trip",
    destinationCountry: trip.destinationCountry?.trim() || "",
    startDate: trip.startDate?.trim() || today,
    endDate: trip.endDate?.trim() || trip.startDate?.trim() || today,
    status,
    budget: typeof trip.budget === "number" ? trip.budget : undefined,
    currency: trip.currency?.trim().toLocaleUpperCase() || "EUR",
    dailyStartTime: trip.dailyStartTime?.trim() || "09:00",
    dailyEndTime: trip.dailyEndTime?.trim() || "19:00",
    interests: Array.isArray(trip.interests) ? trip.interests : [],
    pace: trip.pace ?? "balanced",
    maxTravelDistance: trip.maxTravelDistance ?? "moderate",
    selectedPlaceIds: Array.isArray(trip.selectedPlaceIds)
      ? Array.from(new Set(trip.selectedPlaceIds))
      : [],
    priorityPlaceIds: Array.isArray(trip.priorityPlaceIds)
      ? Array.from(new Set(trip.priorityPlaceIds))
      : [],
    unscheduledPlaceIds: Array.isArray(trip.unscheduledPlaceIds)
      ? Array.from(new Set(trip.unscheduledPlaceIds))
      : [],
    unscheduledPlaceReasons:
      trip.unscheduledPlaceReasons &&
      typeof trip.unscheduledPlaceReasons === "object"
        ? trip.unscheduledPlaceReasons
        : {},
    routeDays: Array.isArray(trip.routeDays) ? trip.routeDays : undefined,
    packingItems: normalizePackingItems(trip.packingItems, id),
    notes: trimmedOptional(trip.notes),
    flightIds: Array.isArray(trip.flightIds) ? trip.flightIds : [],
    createdAt: trip.createdAt ?? now,
    updatedAt: trip.updatedAt ?? trip.createdAt ?? now,
  };
}

function migrateLegacyTripToUpcoming(trip: LegacyTrip): Trip {
  const country = getCountryMetadata(trip.countryCodes[0] ?? "");
  const today = new Date().toISOString().slice(0, 10);

  return normalizeStoredTrip({
    id: trip.id,
    destinationCity: trip.cityNames[0] ?? trip.title,
    destinationCountry: country.name,
    startDate: trip.startDate ?? today,
    endDate: trip.endDate ?? trip.startDate ?? today,
    status: "planned",
    flightIds: [],
  });
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

  const migratedData: TravelData = {
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
      ? storedData.upcomingTrips.map(normalizeStoredTrip)
      : legacyTrips.length > 0
        ? migratedUpcomingTrips
        : fallback.upcomingTrips.map(normalizeStoredTrip),
    flights: Array.isArray(storedData.flights)
      ? storedData.flights
      : legacyTrips.length > 0
        ? []
        : fallback.flights,
    customPlaces: Array.isArray(storedData.customPlaces)
      ? storedData.customPlaces
      : fallback.customPlaces,
    livePlaces: Array.isArray(storedData.livePlaces)
      ? storedData.livePlaces.filter((place) => place.source === "live")
      : fallback.livePlaces,
  };

  return sanitizeTravelDataPlaceSelections(migratedData);
}

function trimmedOptional(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed || undefined;
}

function compatiblePlaceIds(
  data: TravelData,
  trip: Trip,
  placeIds: string[]
) {
  const placesById = new Map(
    [...placeCatalog, ...data.customPlaces, ...data.livePlaces].map((place) => [
      place.id,
      place,
    ])
  );

  return Array.from(new Set(placeIds)).filter((placeId) => {
    const place = placesById.get(placeId);

    return place ? isPlaceInTripDestination(place, trip) : false;
  });
}

function sanitizeTravelDataPlaceSelections(data: TravelData): TravelData {
  let changed = false;
  const upcomingTrips = data.upcomingTrips.map((trip) => {
    const selectedPlaceIds = compatiblePlaceIds(
      data,
      trip,
      trip.selectedPlaceIds
    );

    if (selectedPlaceIds.length === trip.selectedPlaceIds.length) return trip;

    changed = true;
    const selectedIdSet = new Set(selectedPlaceIds);

    return {
      ...trip,
      selectedPlaceIds,
      priorityPlaceIds: trip.priorityPlaceIds.filter((placeId) =>
        selectedIdSet.has(placeId)
      ),
      unscheduledPlaceIds: trip.unscheduledPlaceIds.filter((placeId) =>
        selectedIdSet.has(placeId)
      ),
      unscheduledPlaceReasons: Object.fromEntries(
        Object.entries(trip.unscheduledPlaceReasons).filter(([placeId]) =>
          selectedIdSet.has(placeId)
        )
      ),
      routeDays: undefined,
    };
  });

  return changed ? { ...data, upcomingTrips } : data;
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
    const now = new Date().toISOString();
    const trip = normalizeStoredTrip({
      ...input,
      id: `trip-${input.destinationCity
        .trim()
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      flightIds: [],
      selectedPlaceIds: [],
      priorityPlaceIds: [],
      unscheduledPlaceIds: [],
      unscheduledPlaceReasons: {},
      createdAt: now,
      updatedAt: now,
    });

    setTravelData((current) => ({
      ...current,
      upcomingTrips: [...current.upcomingTrips, trip],
    }));

    return trip;
  }

  function updateTrip(id: string, input: UpdateTripInput) {
    setTravelData((current) => ({
      ...current,
      upcomingTrips: current.upcomingTrips.map((trip) => {
        if (trip.id !== id) return trip;

        const routeSettingsChanged =
          (input.destinationCity !== undefined &&
            input.destinationCity.trim() !== trip.destinationCity) ||
          (input.destinationCountry !== undefined &&
            input.destinationCountry.trim() !== trip.destinationCountry) ||
          (input.startDate !== undefined && input.startDate !== trip.startDate) ||
          (input.endDate !== undefined && input.endDate !== trip.endDate) ||
          (input.currency !== undefined &&
            input.currency.trim().toLocaleUpperCase() !== trip.currency) ||
          (input.dailyStartTime !== undefined &&
            input.dailyStartTime !== trip.dailyStartTime) ||
          (input.dailyEndTime !== undefined &&
            input.dailyEndTime !== trip.dailyEndTime) ||
          (input.pace !== undefined && input.pace !== trip.pace) ||
          (input.interests !== undefined &&
            input.interests.join("|") !== (trip.interests ?? []).join("|")) ||
          (input.maxTravelDistance !== undefined &&
            input.maxTravelDistance !== trip.maxTravelDistance);

        const nextTrip = normalizeStoredTrip({
          ...trip,
          ...input,
          id: trip.id,
          flightIds: trip.flightIds,
          selectedPlaceIds: trip.selectedPlaceIds,
          priorityPlaceIds: trip.priorityPlaceIds,
          unscheduledPlaceIds: routeSettingsChanged
            ? []
            : trip.unscheduledPlaceIds,
          unscheduledPlaceReasons: routeSettingsChanged
            ? {}
            : trip.unscheduledPlaceReasons,
          routeDays: routeSettingsChanged ? undefined : trip.routeDays,
          createdAt: trip.createdAt,
          updatedAt: new Date().toISOString(),
        });

        if (!routeSettingsChanged) return nextTrip;

        const selectedPlaceIds = compatiblePlaceIds(
          current,
          nextTrip,
          nextTrip.selectedPlaceIds
        );

        return {
          ...nextTrip,
          selectedPlaceIds,
          priorityPlaceIds: nextTrip.priorityPlaceIds.filter((placeId) =>
            selectedPlaceIds.includes(placeId)
          ),
        };
      }),
    }));
  }

  function setTripSelectedPlaceIds(id: string, placeIds: string[]) {
    setTravelData((current) => ({
      ...current,
      upcomingTrips: current.upcomingTrips.map((trip) => {
        if (trip.id !== id) return trip;

        const selectedPlaceIds = compatiblePlaceIds(
          current,
          trip,
          placeIds
        );

        return {
          ...trip,
          selectedPlaceIds,
          priorityPlaceIds: trip.priorityPlaceIds.filter((placeId) =>
            selectedPlaceIds.includes(placeId)
          ),
          unscheduledPlaceIds: [],
          unscheduledPlaceReasons: {},
          routeDays: undefined,
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }

  function setTripRoutePlan(
    id: string,
    routeDays: RouteDay[],
    unscheduledPlaceIds: string[] = [],
    unscheduledPlaceReasons: Partial<
      Record<string, UnscheduledPlaceReason>
    > = {}
  ) {
    setTravelData((current) => ({
      ...current,
      upcomingTrips: current.upcomingTrips.map((trip) =>
        trip.id === id
          ? {
              ...trip,
              routeDays,
              unscheduledPlaceIds: Array.from(
                new Set(unscheduledPlaceIds)
              ),
              unscheduledPlaceReasons,
              status: trip.status === "planning" ? "planned" : trip.status,
              updatedAt: new Date().toISOString(),
            }
          : trip
      ),
    }));
  }

  function setTripPriorityPlaceIds(id: string, placeIds: string[]) {
    setTravelData((current) => ({
      ...current,
      upcomingTrips: current.upcomingTrips.map((trip) =>
        trip.id === id
          ? {
              ...trip,
              priorityPlaceIds: Array.from(new Set(placeIds)).filter(
                (placeId) => trip.selectedPlaceIds.includes(placeId)
              ),
              updatedAt: new Date().toISOString(),
            }
          : trip
      ),
    }));
  }

  function toggleTripPackingItem(tripId: string, itemId: string) {
    setTravelData((current) => ({
      ...current,
      upcomingTrips: current.upcomingTrips.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              packingItems: normalizePackingItems(
                trip.packingItems,
                trip.id
              ).map((item) =>
                item.id === itemId
                  ? { ...item, isPacked: !item.isPacked }
                  : item
              ),
              updatedAt: new Date().toISOString(),
            }
          : trip
      ),
    }));
  }

  function addTripPackingItem(tripId: string, label: string) {
    const trimmedLabel = label.trim().slice(0, 80);
    if (!trimmedLabel) return;

    setTravelData((current) => ({
      ...current,
      upcomingTrips: current.upcomingTrips.map((trip) => {
        if (trip.id !== tripId) return trip;

        const packingItems = normalizePackingItems(
          trip.packingItems,
          trip.id
        );
        const duplicate = packingItems.some(
          (item) =>
            item.label.trim().toLocaleLowerCase() ===
            trimmedLabel.toLocaleLowerCase()
        );
        if (duplicate) return trip;

        return {
          ...trip,
          packingItems: [
            ...packingItems,
            {
              id: `packing-${trip.id}-${Date.now()}-${Math.random()
                .toString(36)
                .slice(2, 7)}`,
              label: trimmedLabel,
              category: "other",
              isPacked: false,
              isDefault: false,
            },
          ],
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }

  function deleteTripPackingItem(tripId: string, itemId: string) {
    setTravelData((current) => ({
      ...current,
      upcomingTrips: current.upcomingTrips.map((trip) => {
        if (trip.id !== tripId) return trip;

        const packingItems = normalizePackingItems(
          trip.packingItems,
          trip.id
        );
        const item = packingItems.find((entry) => entry.id === itemId);
        if (!item || item.isDefault) return trip;

        return {
          ...trip,
          packingItems: packingItems.filter(
            (entry) => entry.id !== itemId
          ),
          updatedAt: new Date().toISOString(),
        };
      }),
    }));
  }

  function resetTripPackingChecklist(tripId: string) {
    setTravelData((current) => ({
      ...current,
      upcomingTrips: current.upcomingTrips.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              packingItems: normalizePackingItems(
                trip.packingItems,
                trip.id
              ).map((item) => ({ ...item, isPacked: false })),
              updatedAt: new Date().toISOString(),
            }
          : trip
      ),
    }));
  }

  function addCustomPlace(input: CreatePlaceInput) {
    const now = new Date().toISOString();
    const place: Place = {
      ...input,
      id: `place-${input.name
        .trim()
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      name: input.name.trim(),
      city: input.city.trim(),
      country: input.country.trim(),
      address: trimmedOptional(input.address),
      category: input.category.trim().toLocaleLowerCase(),
      description: trimmedOptional(input.description),
      currency:
        trimmedOptional(input.currency)?.toLocaleUpperCase() ?? "EUR",
      notes: trimmedOptional(input.notes),
      source: "manual",
      createdAt: now,
      updatedAt: now,
    };

    setTravelData((current) => ({
      ...current,
      customPlaces: [...current.customPlaces, place],
    }));

    return place;
  }

  function deleteCustomPlace(id: string) {
    setTravelData((current) => ({
      ...current,
      customPlaces: current.customPlaces.filter((place) => place.id !== id),
      upcomingTrips: current.upcomingTrips.map((trip) => {
        const usedByTrip = trip.selectedPlaceIds.includes(id);

        return {
          ...trip,
          selectedPlaceIds: trip.selectedPlaceIds.filter(
            (placeId) => placeId !== id
          ),
          priorityPlaceIds: trip.priorityPlaceIds.filter(
            (placeId) => placeId !== id
          ),
          unscheduledPlaceIds: trip.unscheduledPlaceIds.filter(
            (placeId) => placeId !== id
          ),
          unscheduledPlaceReasons: Object.fromEntries(
            Object.entries(trip.unscheduledPlaceReasons).filter(
              ([placeId]) => placeId !== id
            )
          ),
          routeDays: usedByTrip ? undefined : trip.routeDays,
          updatedAt: usedByTrip ? new Date().toISOString() : trip.updatedAt,
        };
      }),
    }));
  }

  function cacheLivePlaces(places: Place[]) {
    const validPlaces = places.filter((place) => place.source === "live");
    if (validPlaces.length === 0) return;

    setTravelData((current) => {
      const byId = new Map(
        current.livePlaces.map((place) => [place.id, place])
      );

      validPlaces.forEach((place) => byId.set(place.id, place));

      return {
        ...current,
        livePlaces: Array.from(byId.values()).slice(-300),
      };
    });
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
        customPlaces: travelData.customPlaces,
        livePlaces: travelData.livePlaces,
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
        setTripSelectedPlaceIds,
        setTripRoutePlan,
        setTripPriorityPlaceIds,
        toggleTripPackingItem,
        addTripPackingItem,
        deleteTripPackingItem,
        resetTripPackingChecklist,
        addCustomPlace,
        deleteCustomPlace,
        cacheLivePlaces,
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
