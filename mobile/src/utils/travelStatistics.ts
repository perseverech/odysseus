import {
  CONTINENTS,
  type Continent,
  type TravelData,
  type TravelMembership,
  type TravelStatistics,
} from "../models/travel";
import {
  getCountryMetadata,
  normalizeCountryCode,
  TOTAL_COUNTRIES,
} from "../data/travelCatalog";

function emptyContinentCounts(): Record<Continent, number> {
  return CONTINENTS.reduce(
    (counts, continent) => ({
      ...counts,
      [continent]: 0,
    }),
    {} as Record<Continent, number>
  );
}

export function calculateTravelStatistics(
  travelData: TravelData,
  wishlistItemCount = 0,
  currentYear = new Date().getFullYear()
): TravelStatistics {
  const visitedCountryCodes = Array.from(
    new Set(
      travelData.countryVisits.map((visit) =>
        normalizeCountryCode(visit.countryCode)
      )
    )
  );
  const continentCounts = emptyContinentCounts();
  const membershipCounts: Record<TravelMembership, number> = {
    eu: 0,
    schengen: 0,
    nato: 0,
  };

  visitedCountryCodes.forEach((countryCode) => {
    const country = getCountryMetadata(countryCode);

    if (country.continent) {
      continentCounts[country.continent] += 1;
    }

    country.memberships.forEach((membership) => {
      membershipCounts[membership] += 1;
    });
  });

  const continentsVisited = CONTINENTS.filter(
    (continent) => continentCounts[continent] > 0
  );
  const mostExploredContinent = CONTINENTS.reduce<Continent | null>(
    (mostExplored, continent) => {
      if (continentCounts[continent] === 0) return mostExplored;
      if (!mostExplored) return continent;

      return continentCounts[continent] >
        continentCounts[mostExplored]
        ? continent
        : mostExplored;
    },
    null
  );
  const countriesThisYear = new Set(
    travelData.countryVisits
      .filter(
        (visit) =>
          Number(visit.visitedAt.slice(0, 4)) === currentYear
      )
      .map((visit) => normalizeCountryCode(visit.countryCode))
  ).size;
  const uniqueCities = new Set(
    travelData.cityVisits.map(
      (visit) =>
        `${normalizeCountryCode(visit.countryCode)}:${visit.city
          .trim()
          .toLocaleLowerCase()}`
    )
  );

  return {
    countryCount: visitedCountryCodes.length,
    cityCount: uniqueCities.size,
    continentCount: continentsVisited.length,
    worldPercentage: Math.min(
      100,
      (visitedCountryCodes.length / TOTAL_COUNTRIES) * 100
    ),
    tripCount:
      travelData.tripHistory.length + travelData.upcomingTrips.length,
    countriesThisYear,
    wishlistItemCount,
    dreamCountryCount: new Set(
      travelData.dreamCountries.map((country) =>
        normalizeCountryCode(country.countryCode)
      )
    ).size,
    upcomingTripCount: travelData.upcomingTrips.length,
    continentCounts,
    membershipCounts,
    mostExploredContinent,
  };
}
