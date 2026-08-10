import type { Place, Weekday } from "../models/place";
import type {
  MaxTravelDistance,
  RouteDay,
  RouteStop,
  RouteTravelMode,
  Trip,
  UnscheduledPlaceReason,
} from "../models/travel";
import { formatTripMoney } from "../utils/tripFormatting";

export type RouteBuildRequest = {
  trip: Trip;
  places: Place[];
};

export type RouteBuildResult = {
  days: RouteDay[];
  unscheduledPlaceIds: string[];
  unscheduledPlaceReasons: Partial<
    Record<string, UnscheduledPlaceReason>
  >;
  totalTravelMinutes: number;
  totalVisitMinutes: number;
  totalWalkingDistanceKm: number;
  estimatedCost: number;
  currency: string;
  warnings: string[];
  generatedBy: "local";
};

export type TravelEstimate = {
  minutes: number;
  distanceKm?: number;
  mode?: RouteTravelMode;
  estimatedCost: number;
  isEstimated: true;
};

export interface RoutingProvider {
  getTravelTime(
    from: Place | undefined,
    to: Place
  ): Promise<TravelEstimate>;
  buildRoute(request: RouteBuildRequest): Promise<RouteBuildResult>;
}

type TravelTimeProvider = Pick<RoutingProvider, "getTravelTime">;

const DISTANCE_LIMIT_KM: Record<MaxTravelDistance, number> = {
  central: 3,
  moderate: 12,
  anywhere: 40,
};

const MAX_STOPS_PER_DAY: Record<NonNullable<Trip["pace"]>, number> = {
  relaxed: 3,
  balanced: 5,
  intensive: 7,
};

const BREAK_MINUTES: Record<NonNullable<Trip["pace"]>, number> = {
  relaxed: 60,
  balanced: 45,
  intensive: 30,
};

const WEEKDAYS: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function parseIsoDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function enumerateDates(startDate: string, endDate: string) {
  const start = parseIsoDate(startDate);
  const end = parseIsoDate(endDate);

  if (!start || !end || end < start) return [startDate];

  const dates: string[] = [];
  const cursor = new Date(start);

  while (cursor <= end && dates.length < 60) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates.length > 0 ? dates : [startDate];
}

function timeToMinutes(value: string | undefined, fallback: number) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value ?? "");

  if (!match) return fallback;

  return Number(match[1]) * 60 + Number(match[2]);
}

function minutesToTime(value: number) {
  const normalized = Math.max(0, Math.round(value));
  const hours = Math.floor(normalized / 60) % 24;
  const minutes = normalized % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

function hasCoordinates(
  place: Place
): place is Place & Required<Pick<Place, "latitude" | "longitude">> {
  return place.latitude !== undefined && place.longitude !== undefined;
}

export function distanceBetweenPlaces(first: Place, second: Place) {
  if (!hasCoordinates(first) || !hasCoordinates(second)) return undefined;

  const earthRadiusKm = 6371;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;

  return (
    earthRadiusKm *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

function estimateLocalTravel(from: Place | undefined, to: Place): TravelEstimate {
  if (!from) {
    return {
      minutes: 0,
      estimatedCost: 0,
      isEstimated: true,
    };
  }

  const distanceKm = distanceBetweenPlaces(from, to);

  if (distanceKm === undefined) {
    return {
      minutes: 20,
      mode: "walk",
      estimatedCost: 0,
      isEstimated: true,
    };
  }

  const mode: RouteTravelMode = distanceKm <= 2.2 ? "walk" : "transit";
  const minutes =
    mode === "walk"
      ? Math.max(4, Math.round((distanceKm / 4.8) * 60))
      : Math.max(18, Math.round((distanceKm / 20) * 60 + 10));

  return {
    minutes,
    distanceKm: Math.round(distanceKm * 10) / 10,
    mode,
    estimatedCost: mode === "transit" ? 2.5 : 0,
    isEstimated: true,
  };
}

const localTravelTimeProvider: TravelTimeProvider = {
  async getTravelTime(from, to) {
    return estimateLocalTravel(from, to);
  },
};

function orderByGeographicCluster(places: Place[], trip: Trip) {
  if (places.length < 2) return [...places];

  const priorities = new Set(trip.priorityPlaceIds);
  const interests = new Set<string>(trip.interests ?? []);
  const remaining = [...places].sort((first, second) => {
    const priorityDifference =
      Number(priorities.has(second.id)) - Number(priorities.has(first.id));

    if (priorityDifference !== 0) return priorityDifference;

    return (
      Number(interests.has(second.category)) -
      Number(interests.has(first.category))
    );
  });
  const ordered = [remaining.shift()!];

  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1];
    const hasPriorityRemaining = remaining.some((place) =>
      priorities.has(place.id)
    );
    let nearestIndex = 0;
    let nearestScore = Number.POSITIVE_INFINITY;

    remaining.forEach((candidate, index) => {
      if (hasPriorityRemaining && !priorities.has(candidate.id)) return;

      const distance = distanceBetweenPlaces(current, candidate) ?? 5;
      const priorityBonus = priorities.has(candidate.id) ? 4 : 0;
      const interestBonus = interests.has(candidate.category) ? 0.8 : 0;
      const score = distance - priorityBonus - interestBonus;

      if (score < nearestScore) {
        nearestScore = score;
        nearestIndex = index;
      }
    });

    ordered.push(remaining.splice(nearestIndex, 1)[0]);
  }

  return ordered;
}

function chooseGeographicAnchor(places: Place[]) {
  const placesWithCoordinates = places.filter(hasCoordinates);

  if (placesWithCoordinates.length < 2) {
    return placesWithCoordinates[0] ?? places[0];
  }

  return placesWithCoordinates.reduce((best, candidate) => {
    const candidateDistance = placesWithCoordinates.reduce(
      (sum, place) => sum + (distanceBetweenPlaces(candidate, place) ?? 0),
      0
    );
    const bestDistance = placesWithCoordinates.reduce(
      (sum, place) => sum + (distanceBetweenPlaces(best, place) ?? 0),
      0
    );

    return candidateDistance < bestDistance ? candidate : best;
  });
}

type OpeningWindow = {
  opensAt: number;
  closesAt: number;
} | null;

function getOpeningWindow(place: Place, dateValue: string): OpeningWindow {
  const openingHours = place.openingHours;

  if (!openingHours) return { opensAt: 0, closesAt: 24 * 60 };

  const date = parseIsoDate(dateValue);
  const weekday = date ? WEEKDAYS[date.getUTCDay()] : undefined;
  const periods = weekday ? openingHours.weekly?.[weekday] : undefined;

  if (periods) {
    if (periods.length === 0) return null;

    return {
      opensAt: timeToMinutes(periods[0].opensAt, 0),
      closesAt: timeToMinutes(periods[0].closesAt, 24 * 60),
    };
  }

  const summary = openingHours.summary?.trim().toLocaleLowerCase();

  if (!summary || summary.includes("all day") || summary.includes("24 hour")) {
    return { opensAt: 0, closesAt: 24 * 60 };
  }

  if (summary.includes("closed")) return null;

  const timeRange = /(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})/.exec(
    summary
  );

  if (!timeRange) return { opensAt: 0, closesAt: 24 * 60 };

  return {
    opensAt: Number(timeRange[1]) * 60 + Number(timeRange[2]),
    closesAt: Number(timeRange[3]) * 60 + Number(timeRange[4]),
  };
}

function getPlaceCost(place: Place, tripCurrency: string) {
  const sameCurrency =
    !place.currency ||
    place.currency.toLocaleUpperCase() === tripCurrency.toLocaleUpperCase();

  return place.isFree || !sameCurrency ? 0 : place.price ?? 0;
}

type StopSchedule = {
  arrival: number;
  departure: number;
  breakMinutesBefore?: number;
  breakLabel?: string;
  waitingMinutesBefore?: number;
  waitingLabel?: string;
};

function scheduleStop({
  cursor,
  travel,
  visitMinutes,
  openingWindow,
  dayEnd,
  needsBreak,
  breakDuration,
}: {
  cursor: number;
  travel: TravelEstimate;
  visitMinutes: number;
  openingWindow: Exclude<OpeningWindow, null>;
  dayEnd: number;
  needsBreak: boolean;
  breakDuration: number;
}): StopSchedule | null {
  let nextCursor = cursor;
  let breakMinutesBefore = 0;
  let breakLabel: string | undefined;
  const wouldCrossLunch =
    cursor >= 11 * 60 &&
    cursor < 13 * 60 &&
    cursor + travel.minutes + visitMinutes > 13 * 60;

  if (needsBreak && (cursor >= 11 * 60 + 45 || wouldCrossLunch)) {
    breakMinutesBefore = breakDuration;
    nextCursor = cursor + breakDuration;
    breakLabel = "Lunch / free time";
  }

  const arrivalBeforeOpening = nextCursor + travel.minutes;
  const arrival = Math.max(arrivalBeforeOpening, openingWindow.opensAt);
  const waitingMinutesBefore = Math.max(0, arrival - arrivalBeforeOpening);

  const departure = arrival + visitMinutes;

  if (departure > Math.min(dayEnd, openingWindow.closesAt)) return null;

  return {
    arrival,
    departure,
    breakMinutesBefore: breakMinutesBefore || undefined,
    breakLabel,
    waitingMinutesBefore: waitingMinutesBefore || undefined,
    waitingLabel: waitingMinutesBefore ? "Free time until opening" : undefined,
  };
}

function createRouteStop({
  day,
  place,
  order,
  schedule,
  travel,
  visitMinutes,
  currency,
  priority,
  existingId,
}: {
  day: RouteDay;
  place: Place;
  order: number;
  schedule: StopSchedule;
  travel: TravelEstimate;
  visitMinutes: number;
  currency: string;
  priority: boolean;
  existingId?: string;
}): RouteStop {
  return {
    id: existingId ?? `${day.id}-${place.id}-${order}`,
    placeId: place.id,
    order,
    arrivalTime: minutesToTime(schedule.arrival),
    departureTime: minutesToTime(schedule.departure),
    visitMinutes,
    travelMinutesFromPrevious: travel.minutes,
    travelDistanceKm: travel.distanceKm,
    travelModeFromPrevious: travel.mode,
    breakMinutesBefore: schedule.breakMinutesBefore,
    breakLabel: schedule.breakLabel,
    waitingMinutesBefore: schedule.waitingMinutesBefore,
    waitingLabel: schedule.waitingLabel,
    isPriority: priority,
    estimatedCost:
      Math.round((getPlaceCost(place, currency) + travel.estimatedCost) * 100) /
      100,
    currency,
  };
}

function finalizeDay(day: RouteDay) {
  const walkingDistanceKm = day.stops.reduce(
    (sum, stop) =>
      sum +
      (stop.travelModeFromPrevious === "walk"
        ? stop.travelDistanceKm ?? 0
        : 0),
    0
  );

  return {
    ...day,
    totalVisitMinutes: day.stops.reduce(
      (sum, stop) => sum + stop.visitMinutes,
      0
    ),
    totalTravelMinutes: day.stops.reduce(
      (sum, stop) => sum + stop.travelMinutesFromPrevious,
      0
    ),
    walkingDistanceKm: Math.round(walkingDistanceKm * 10) / 10,
    estimatedCost:
      Math.round(
        day.stops.reduce((sum, stop) => sum + stop.estimatedCost, 0) * 100
      ) / 100,
  };
}

function summarizeDays(
  days: RouteDay[],
  unscheduledPlaceIds: string[],
  unscheduledPlaceReasons: Partial<
    Record<string, UnscheduledPlaceReason>
  >,
  warnings: string[]
): RouteBuildResult {
  return {
    days,
    unscheduledPlaceIds,
    unscheduledPlaceReasons,
    totalTravelMinutes: days.reduce(
      (sum, day) => sum + day.totalTravelMinutes,
      0
    ),
    totalVisitMinutes: days.reduce(
      (sum, day) => sum + day.totalVisitMinutes,
      0
    ),
    totalWalkingDistanceKm:
      Math.round(
        days.reduce((sum, day) => sum + (day.walkingDistanceKm ?? 0), 0) * 10
      ) / 10,
    estimatedCost:
      Math.round(days.reduce((sum, day) => sum + day.estimatedCost, 0) * 100) /
      100,
    currency: days[0]?.currency ?? "EUR",
    warnings,
    generatedBy: "local",
  };
}

export function recalculateRouteDay(
  trip: Trip,
  day: RouteDay,
  places: Place[]
) {
  const placeById = new Map(places.map((place) => [place.id, place]));
  const currency = trip.currency ?? "EUR";
  const dayStart = timeToMinutes(trip.dailyStartTime, 9 * 60);
  const dayEnd = timeToMinutes(trip.dailyEndTime, 19 * 60);
  const breakDuration = BREAK_MINUTES[trip.pace ?? "balanced"];
  let cursor = dayStart;
  let previous: Place | undefined;
  let breakTaken = false;
  const stops: RouteStop[] = [];

  day.stops.forEach((existingStop, index) => {
    const place = placeById.get(existingStop.placeId);

    if (!place) return;

    const travel = estimateLocalTravel(previous, place);
    const openingWindow = getOpeningWindow(place, day.date) ?? {
      opensAt: 0,
      closesAt: 24 * 60,
    };
    const schedule =
      scheduleStop({
        cursor,
        travel,
        visitMinutes: existingStop.visitMinutes,
        openingWindow,
        dayEnd: 24 * 60,
        needsBreak: !breakTaken && stops.length > 0,
        breakDuration,
      }) ?? {
        arrival: cursor + travel.minutes,
        departure: cursor + travel.minutes + existingStop.visitMinutes,
      };
    const stop = createRouteStop({
      day,
      place,
      order: index,
      schedule,
      travel,
      visitMinutes: existingStop.visitMinutes,
      currency,
      priority: trip.priorityPlaceIds.includes(place.id),
      existingId: existingStop.id,
    });

    stops.push(stop);
    cursor = schedule.departure;
    previous = place;
    breakTaken = breakTaken || Boolean(schedule.breakLabel?.includes("Lunch"));
  });

  return finalizeDay({ ...day, stops });
}

export function appendPlaceToRouteDay(
  trip: Trip,
  day: RouteDay,
  place: Place,
  places: Place[]
) {
  const currency = trip.currency ?? "EUR";
  const placeholderStop: RouteStop = {
    id: `${day.id}-${place.id}-manual-${Date.now()}`,
    placeId: place.id,
    order: day.stops.length,
    arrivalTime: "",
    departureTime: "",
    visitMinutes: place.estimatedVisitMinutes,
    travelMinutesFromPrevious: 0,
    isPriority: trip.priorityPlaceIds.includes(place.id),
    estimatedCost: getPlaceCost(place, currency),
    currency,
  };

  return recalculateRouteDay(
    trip,
    { ...day, stops: [...day.stops, placeholderStop] },
    places
  );
}

export function summarizeRouteDays(days: RouteDay[]) {
  return summarizeDays(days, [], {}, []);
}

export function createRouteBuilder(
  travelTimeProvider: TravelTimeProvider = localTravelTimeProvider
): Pick<RoutingProvider, "buildRoute"> {
  return {
    async buildRoute({ trip, places }) {
      const dates = enumerateDates(trip.startDate, trip.endDate);
      const currency = trip.currency ?? "EUR";
      const dayStart = timeToMinutes(trip.dailyStartTime, 9 * 60);
      const dayEnd = timeToMinutes(trip.dailyEndTime, 19 * 60);
      const pace = trip.pace ?? "balanced";
      const maxStops = MAX_STOPS_PER_DAY[pace];
      const breakDuration = BREAK_MINUTES[pace];
      const destinationCountry = trip.destinationCountry.trim().toLocaleLowerCase();
      const destinationCity = trip.destinationCity.trim().toLocaleLowerCase();
      const countryPlaces = places.filter(
        (place) => place.country.trim().toLocaleLowerCase() === destinationCountry
      );
      const cityPlaces = countryPlaces.filter(
        (place) => place.city.trim().toLocaleLowerCase() === destinationCity
      );
      const anchor = chooseGeographicAnchor(
        cityPlaces.length > 0 ? cityPlaces : countryPlaces
      );
      const distanceLimit = DISTANCE_LIMIT_KM[trip.maxTravelDistance ?? "moderate"];
      const excludedPlaceReasons: Partial<
        Record<string, UnscheduledPlaceReason>
      > = {};

      places.forEach((place) => {
        if (place.country.trim().toLocaleLowerCase() !== destinationCountry) {
          excludedPlaceReasons[place.id] = "too_far";
        }
      });

      const eligiblePlaces = countryPlaces.filter((place) => {
        if (!anchor) {
          excludedPlaceReasons[place.id] = "missing_coordinates";
          return false;
        }
        if (place.id === anchor.id) return true;

        const distance = distanceBetweenPlaces(anchor, place);

        if (distance === undefined) {
          const inDestinationCity =
            place.city.trim().toLocaleLowerCase() === destinationCity;

          if (!inDestinationCity) {
            excludedPlaceReasons[place.id] = "missing_coordinates";
          }

          return inDestinationCity;
        }

        if (distance > distanceLimit) {
          excludedPlaceReasons[place.id] = "too_far";
          return false;
        }

        return true;
      });
      const eligibleIds = new Set(eligiblePlaces.map((place) => place.id));
      const excludedPlaceIds = places
        .filter((place) => !eligibleIds.has(place.id))
        .map((place) => place.id);
      const remaining = orderByGeographicCluster(eligiblePlaces, trip);
      const warnings: string[] = [];
      const days: RouteDay[] = [];
      let scheduledActivityCost = 0;

      for (const [dayIndex, date] of dates.entries()) {
        const day: RouteDay = {
          id: `${trip.id}-${date}`,
          date,
          dayNumber: dayIndex + 1,
          stops: [],
          totalVisitMinutes: 0,
          totalTravelMinutes: 0,
          walkingDistanceKm: 0,
          estimatedCost: 0,
          currency,
        };
        let cursor = dayStart;
        let previous: Place | undefined;
        let breakTaken = false;

        while (remaining.length > 0 && day.stops.length < maxStops) {
          let scheduledIndex = -1;
          let scheduledStop: RouteStop | undefined;
          let scheduledDeparture = cursor;
          let scheduledPlace: Place | undefined;

          for (const [candidateIndex, place] of remaining.entries()) {
            const openingWindow = getOpeningWindow(place, date);

            if (!openingWindow) continue;

            const travel = await travelTimeProvider.getTravelTime(
              previous,
              place
            );
            const schedule = scheduleStop({
              cursor,
              travel,
              visitMinutes: place.estimatedVisitMinutes,
              openingWindow,
              dayEnd,
              needsBreak: !breakTaken && day.stops.length > 0,
              breakDuration,
            });

            if (!schedule) continue;

            const candidateCost = getPlaceCost(place, currency);
            const exceedsBudget =
              trip.budget !== undefined &&
              scheduledActivityCost + candidateCost > trip.budget;
            const priority = trip.priorityPlaceIds.includes(place.id);

            if (exceedsBudget && !priority) continue;

            scheduledIndex = candidateIndex;
            scheduledDeparture = schedule.departure;
            scheduledPlace = place;
            scheduledStop = createRouteStop({
              day,
              place,
              order: day.stops.length,
              schedule,
              travel,
              visitMinutes: place.estimatedVisitMinutes,
              currency,
              priority,
            });
            break;
          }

          if (scheduledIndex < 0 || !scheduledStop || !scheduledPlace) break;

          remaining.splice(scheduledIndex, 1);
          day.stops.push(scheduledStop);
          cursor = scheduledDeparture;
          previous = scheduledPlace;
          scheduledActivityCost += getPlaceCost(scheduledPlace, currency);
          breakTaken =
            breakTaken || Boolean(scheduledStop.breakLabel?.includes("Lunch"));
        }

        days.push(finalizeDay(day));
      }

      const unscheduledPlaceIds = Array.from(
        new Set([...excludedPlaceIds, ...remaining.map((place) => place.id)])
      );
      const unscheduledPlaceReasons: Partial<
        Record<string, UnscheduledPlaceReason>
      > = { ...excludedPlaceReasons };

      remaining.forEach((place) => {
        const closedForTrip = dates.every(
          (date) => getOpeningWindow(place, date) === null
        );
        const exceedsBudget =
          !trip.priorityPlaceIds.includes(place.id) &&
          trip.budget !== undefined &&
          scheduledActivityCost + getPlaceCost(place, currency) > trip.budget;

        unscheduledPlaceReasons[place.id] = closedForTrip
          ? "closed"
          : exceedsBudget
            ? "budget"
            : "not_enough_time";
      });
      const unscheduledIdSet = new Set(unscheduledPlaceIds);
      const unscheduledPriorityPlaces = places.filter(
        (place) =>
          trip.priorityPlaceIds.includes(place.id) &&
          unscheduledIdSet.has(place.id)
      );

      unscheduledPriorityPlaces.forEach((place) => {
        const dayLabel =
          dates.length === 1 ? "Day 1" : `Days 1–${dates.length}`;

        warnings.push(`${place.name} may not fit into ${dayLabel}.`);
      });

      if (excludedPlaceIds.length > 0) {
        warnings.push(
          "Some places are outside this trip's destination or selected travel area."
        );
      }

      if (unscheduledPlaceIds.length > 0) {
        warnings.push(
          `${unscheduledPlaceIds.length} ${
            unscheduledPlaceIds.length === 1 ? "place does" : "places do"
          } not fit the available days, opening hours or budget.`
        );
      }

      if (
        trip.budget !== undefined &&
        scheduledActivityCost > trip.budget
      ) {
        warnings.push(
          `Estimated activities exceed your budget by ${formatTripMoney(
            scheduledActivityCost - trip.budget,
            currency
          )}.`
        );
      }

      const hasDifferentCurrency = eligiblePlaces.some(
        (place) =>
          place.currency &&
          place.currency.toLocaleUpperCase() !== currency.toLocaleUpperCase()
      );

      if (hasDifferentCurrency) {
        warnings.push(
          "Prices in other currencies are excluded until conversion is available."
        );
      }

      return summarizeDays(
        days,
        unscheduledPlaceIds,
        unscheduledPlaceReasons,
        warnings
      );
    },
  };
}

export class LocalRoutingProvider implements RoutingProvider {
  async getTravelTime(from: Place | undefined, to: Place) {
    return estimateLocalTravel(from, to);
  }

  async buildRoute(request: RouteBuildRequest) {
    return createRouteBuilder(this).buildRoute(request);
  }
}

export const localRoutingProvider = new LocalRoutingProvider();
