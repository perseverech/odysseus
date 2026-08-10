import type { TravelData } from "../models/travel";

function dateInYear(year: number, monthAndDay: string) {
  return `${year}-${monthAndDay}`;
}

export function createInitialTravelData(
  referenceDate = new Date()
): TravelData {
  const currentYear = referenceDate.getFullYear();
  const previousYear = currentYear - 1;
  const nextYear = currentYear + 1;

  return {
    countryVisits: [
      {
        id: "latvia-visit",
        countryCode: "lv",
        visitedAt: dateInYear(currentYear, "02-16"),
      },
      {
        id: "spain-visit",
        countryCode: "es",
        visitedAt: dateInYear(currentYear, "05-04"),
        tripId: "barcelona-trip",
      },
      {
        id: "turkey-visit",
        countryCode: "tr",
        visitedAt: dateInYear(previousYear, "10-12"),
        tripId: "istanbul-trip",
      },
    ],
    cityVisits: [
      {
        id: "riga-visit",
        city: "Riga",
        countryCode: "lv",
        visitedAt: dateInYear(currentYear, "02-16"),
      },
      {
        id: "barcelona-visit",
        city: "Barcelona",
        countryCode: "es",
        visitedAt: dateInYear(currentYear, "05-04"),
        tripId: "barcelona-trip",
      },
      {
        id: "istanbul-visit",
        city: "Istanbul",
        countryCode: "tr",
        visitedAt: dateInYear(previousYear, "10-12"),
        tripId: "istanbul-trip",
      },
    ],
    dreamCountries: [
      {
        id: "dream-japan",
        countryCode: "jp",
        countryName: "Japan",
        addedAt: dateInYear(currentYear, "01-08"),
      },
      {
        id: "dream-iceland",
        countryCode: "is",
        countryName: "Iceland",
        addedAt: dateInYear(currentYear, "01-09"),
      },
      {
        id: "dream-portugal",
        countryCode: "pt",
        countryName: "Portugal",
        addedAt: dateInYear(currentYear, "01-10"),
      },
    ],
    tripHistory: [
      {
        id: "istanbul-trip",
        title: "Istanbul",
        countryCodes: ["tr"],
        cityNames: ["Istanbul"],
        startDate: dateInYear(previousYear, "10-12"),
        endDate: dateInYear(previousYear, "10-12"),
        stopCount: 6,
      },
      {
        id: "barcelona-trip",
        title: "Barcelona",
        countryCodes: ["es"],
        cityNames: ["Barcelona"],
        startDate: dateInYear(currentYear, "05-04"),
        endDate: dateInYear(currentYear, "05-06"),
      },
    ],
    upcomingTrips: [
      {
        id: "upcoming-barcelona",
        destinationCity: "Barcelona",
        destinationCountry: "Spain",
        startDate: dateInYear(nextYear, "01-17"),
        endDate: dateInYear(nextYear, "01-20"),
        status: "booked",
        budget: 900,
        currency: "EUR",
        dailyStartTime: "09:00",
        dailyEndTime: "19:00",
        interests: ["architecture", "food", "history", "views"],
        pace: "balanced",
        maxTravelDistance: "moderate",
        selectedPlaceIds: [
          "barcelona-sagrada-familia",
          "barcelona-park-guell",
          "barcelona-casa-batllo",
          "barcelona-gothic-quarter",
          "barcelona-la-boqueria",
        ],
        priorityPlaceIds: [],
        unscheduledPlaceIds: [],
        unscheduledPlaceReasons: {},
        notes: "Winter city break",
        flightIds: ["flight-riga-barcelona"],
        createdAt: dateInYear(currentYear, "08-10"),
        updatedAt: dateInYear(currentYear, "08-10"),
      },
    ],
    flights: [
      {
        id: "flight-riga-barcelona",
        tripId: "upcoming-barcelona",
        airline: "airBaltic",
        flightNumber: "BT 683",
        departureCity: "Riga",
        departureAirport: "Riga International Airport",
        departureIata: "RIX",
        arrivalCity: "Barcelona",
        arrivalAirport: "Barcelona–El Prat Airport",
        arrivalIata: "BCN",
        departureDate: dateInYear(nextYear, "01-17"),
        departureTime: "07:15",
        arrivalDate: dateInYear(nextYear, "01-17"),
        arrivalTime: "09:55",
        terminal: "B",
        gate: "12",
        seat: "18A",
        bookingReference: "ABC123",
      },
    ],
    customPlaces: [],
  };
}
