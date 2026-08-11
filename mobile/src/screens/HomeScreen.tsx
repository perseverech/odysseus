import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";

import WorldMap from "../components/WorldMap";
import StatsCarousel from "../components/StatsCarousel";
import { useTravelData } from "../context/TravelDataContext";
import worldGeoJson from "../data/world.json";
import { useTravelStatistics } from "../hooks/useTravelStatistics";
import type { RootTabParamList } from "../navigation/navigationTypes";
import type { AiRouteLength } from "../services/aiRouteRecommendations";
import {
  searchLocations,
  type LocationSearchResult,
} from "../services/locationSearch";

type Props = BottomTabScreenProps<RootTabParamList, "Home">;

type WorldCountryFeature = {
  properties?: {
    name?: string;
    ADMIN?: string;
    NAME?: string;
  };
};

type RandomDestination = {
  country: string;
};

type RouteSkeleton = {
  id: string;
  length: AiRouteLength;
  label: string;
  duration: string;
};

const AI_ROUTE_SKELETONS: RouteSkeleton[] = [
  {
    id: "short-route",
    length: "short",
    label: "Short route",
    duration: "1–3 days",
  },
  {
    id: "long-route",
    length: "long",
    label: "Long route",
    duration: "7–14 days",
  },
];

const NON_DESTINATION_NAMES = new Set([
  "Akrotiri Sovereign Base Area",
  "Ashmore and Cartier Islands",
  "Bajo Nuevo Bank (Petrel Is.)",
  "Baykonur Cosmodrome",
  "Bir Tawil",
  "Brazilian Island",
  "Clipperton Island",
  "Coral Sea Islands",
  "Cyprus No Mans Area",
  "Dhekelia Sovereign Base Area",
  "Indian Ocean Territories",
  "Scarborough Reef",
  "Serranilla Bank",
  "Siachen Glacier",
  "Southern Patagonian Ice Field",
  "Spratly Islands",
  "US Naval Base Guantanamo Bay",
]);

const destinations: RandomDestination[] = Array.from(
  new Set(
    (
      worldGeoJson as unknown as {
        features: WorldCountryFeature[];
      }
    ).features
      .map((feature) => {
        const properties = feature.properties;

        return (
          properties?.name ??
          properties?.ADMIN ??
          properties?.NAME ??
          ""
        ).trim();
      })
      .filter(
        (name) =>
          name.length > 0 &&
          !NON_DESTINATION_NAMES.has(name)
      )
  )
)
  .sort((first, second) => first.localeCompare(second))
  .map((country) => ({ country }));

export default function HomeScreen({ navigation }: Props) {
  const screenScrollRef = useRef<ScrollView>(null);
  const mapOffsetRef = useRef(0);
  const mapSearchRequestRef = useRef(0);
  const {
    travelData,
    visitedCountryCodes,
    dreamCountryCodes,
    setVisitedCountryCodes,
    setDreamCountryCodes,
  } = useTravelData();
  const statistics = useTravelStatistics();
  const tripsToPlan = travelData.upcomingTrips;

  const [randomDestination, setRandomDestination] =
    useState<RandomDestination | null>(null);
  const [mapSearchQuery, setMapSearchQuery] = useState("");
  const [mapSearchResults, setMapSearchResults] = useState<
    LocationSearchResult[]
  >([]);
  const [selectedMapLocation, setSelectedMapLocation] =
    useState<LocationSearchResult | null>(null);
  const [mapSearchLoading, setMapSearchLoading] = useState(false);
  const [mapSearchError, setMapSearchError] = useState<string | null>(null);

  function selectMapLocation(location: LocationSearchResult) {
    setSelectedMapLocation(location);
    setRandomDestination(null);
    setTimeout(() => {
      screenScrollRef.current?.scrollTo({
        y: Math.max(0, mapOffsetRef.current - 12),
        animated: true,
      });
    }, 100);
  }

  async function submitMapSearch() {
    const query = mapSearchQuery.trim();
    if (query.length < 2) {
      setMapSearchError("Enter a country, city, address or place name.");
      return;
    }

    const requestId = mapSearchRequestRef.current + 1;
    mapSearchRequestRef.current = requestId;
    setMapSearchLoading(true);
    setMapSearchError(null);

    try {
      const locations = await searchLocations(query, selectedMapLocation);
      if (mapSearchRequestRef.current !== requestId) return;

      setMapSearchResults(locations);
      if (locations.length > 0) {
        selectMapLocation(locations[0]);
      } else {
        setSelectedMapLocation(null);
        setMapSearchError(
          "No matching point found. Add a city or country to make the query more specific."
        );
      }
    } catch (error) {
      if (mapSearchRequestRef.current !== requestId) return;

      setMapSearchResults([]);
      setMapSearchError(
        error instanceof Error ? error.message : "Could not search the map."
      );
    } finally {
      if (mapSearchRequestRef.current === requestId) {
        setMapSearchLoading(false);
      }
    }
  }

  function changeMapSearch(value: string) {
    setMapSearchQuery(value);
    if (value.trim()) return;

    mapSearchRequestRef.current += 1;
    setMapSearchResults([]);
    setSelectedMapLocation(null);
    setMapSearchError(null);
    setMapSearchLoading(false);
  }

  function chooseRandomDestination() {
    const availableDestinations = randomDestination
      ? destinations.filter(
          (destination) =>
            destination.country !== randomDestination.country
        )
      : destinations;

    const index = Math.floor(
      Math.random() * availableDestinations.length
    );

    const nextDestination = availableDestinations[index];

    setSelectedMapLocation(null);
    setRandomDestination(nextDestination);
    screenScrollRef.current?.scrollTo({
      y: mapOffsetRef.current,
      animated: true,
    });
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        ref={screenScrollRef}
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        <Text style={styles.logo}>ODYSSEUS</Text>

        <Text style={styles.question}>
          Where will your next journey be?
        </Text>

        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={20}
            color="#777777"
          />

          <TextInput
            value={mapSearchQuery}
            onChangeText={changeMapSearch}
            onSubmitEditing={() => void submitMapSearch()}
            style={styles.searchInput}
            placeholder="Country, city, address or café..."
            placeholderTextColor="#999999"
            selectionColor="#000000"
            returnKeyType="search"
            autoCorrect={false}
          />

          {mapSearchLoading ? (
            <ActivityIndicator size="small" color="#765FD2" />
          ) : (
            <TouchableOpacity
              style={styles.searchAction}
              onPress={() => void submitMapSearch()}
              accessibilityRole="button"
              accessibilityLabel="Search on map"
            >
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {mapSearchError && (
          <View style={styles.searchMessage}>
            <Ionicons name="information-circle-outline" size={16} color="#A15359" />
            <Text style={styles.searchError}>{mapSearchError}</Text>
          </View>
        )}

        {mapSearchResults.length > 0 && (
          <View style={styles.searchResults}>
            {mapSearchResults.map((location) => {
              const selected = selectedMapLocation?.id === location.id;
              const locationContext = [location.type, location.city, location.country]
                .filter(
                  (value, index, values) =>
                    value && values.indexOf(value) === index
                )
                .join(" · ");

              return (
                <TouchableOpacity
                  key={location.id}
                  style={[
                    styles.searchResult,
                    selected && styles.searchResultSelected,
                  ]}
                  onPress={() => selectMapLocation(location)}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${location.name} on map`}
                >
                  <View
                    style={[
                      styles.resultPin,
                      selected && styles.resultPinSelected,
                    ]}
                  >
                    <Ionicons
                      name="location-sharp"
                      size={16}
                      color={selected ? "#FFFFFF" : "#765FD2"}
                    />
                  </View>
                  <View style={styles.resultBody}>
                    <Text style={styles.resultName} numberOfLines={1}>
                      {location.name}
                    </Text>
                    <Text style={styles.resultMeta} numberOfLines={1}>
                      {locationContext}
                    </Text>
                  </View>
                  <Ionicons
                    name={selected ? "checkmark-circle" : "locate-outline"}
                    size={18}
                    color={selected ? "#765FD2" : "#8C8490"}
                  />
                </TouchableOpacity>
              );
            })}
            <Text style={styles.searchAttribution}>
              Search results © OpenStreetMap contributors
            </Text>
          </View>
        )}

        <View
          onLayout={(event) => {
            mapOffsetRef.current =
              event.nativeEvent.layout.y;
          }}
        >
          <WorldMap
            visitedCountries={visitedCountryCodes}
            plannedCountries={dreamCountryCodes}
            onVisitedCountriesChange={setVisitedCountryCodes}
            onPlannedCountriesChange={setDreamCountryCodes}
            focusedCountryName={randomDestination?.country}
            focusedLocation={selectedMapLocation}
          />
        </View>

        <StatsCarousel statistics={statistics} />

        <TouchableOpacity
          style={styles.randomButton}
          onPress={chooseRandomDestination}
        >
          <View style={styles.randomIcon}>
            <Ionicons
              name="shuffle-outline"
              size={20}
              color="#111111"
            />
          </View>

          <Text style={styles.randomText}>
            Random destination
          </Text>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#777777"
          />
        </TouchableOpacity>

        {randomDestination && (
          <View style={styles.randomResult}>
            <Text style={styles.randomLabel}>
              RANDOM DESTINATION
            </Text>

            <Text style={styles.randomCity}>
              {randomDestination.country}
            </Text>

            <Text style={styles.randomCountry}>
              Country destination
            </Text>

            <TouchableOpacity
              onPress={chooseRandomDestination}
            >
              <Text style={styles.tryAnother}>
                Try another
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {randomDestination && (
          <View style={styles.routeSection}>
            <Text style={styles.routeSectionTitle}>
              AI route ideas
            </Text>

            <Text style={styles.routeSectionSubtitle}>
              Short and long routes for {randomDestination.country}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.routeRecommendations}
              decelerationRate="fast"
              snapToInterval={274}
              snapToAlignment="start"
              disableIntervalMomentum
              nestedScrollEnabled
            >
              {AI_ROUTE_SKELETONS.map((route) => (
                <View
                  key={route.id}
                  style={styles.routeSkeletonCard}
                >
                  <View style={styles.routeSkeletonHeader}>
                    <View style={styles.routeIcon}>
                      <Ionicons
                        name="sparkles-outline"
                        size={20}
                        color="#765FD2"
                      />
                    </View>

                    <View>
                      <Text style={styles.routeSkeletonLabel}>
                        {route.label}
                      </Text>

                      <Text style={styles.routeSkeletonDuration}>
                        {route.duration}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.skeletonLineWide} />
                  <View style={styles.skeletonLineMedium} />

                  <View style={styles.skeletonStops}>
                    <View style={styles.skeletonStop} />
                    <View style={styles.skeletonStopLine} />
                    <View style={styles.skeletonStop} />
                    <View style={styles.skeletonStopLine} />
                    <View style={styles.skeletonStop} />
                  </View>

                  <Text style={styles.routeSkeletonHint}>
                    AI recommendation placeholder
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <Text style={styles.sectionTitle}>
          Continue planning
        </Text>

        {tripsToPlan.map((trip) => (
          <TouchableOpacity
            key={trip.id}
            style={styles.tripCard}
            onPress={() =>
              navigation.navigate("Profile", {
                screen: "TripDetail",
                params: { tripId: trip.id },
              })
            }
          >
            <View>
              <Text style={styles.tripTitle}>
                {trip.destinationCity}
              </Text>
              <Text style={styles.tripSubtitle}>
                {trip.destinationCountry}
              </Text>
            </View>

            <Ionicons
              name="arrow-forward"
              size={19}
              color="#111111"
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 42,
  },

  logo: {
    fontSize: 27,
    fontWeight: "600",
    letterSpacing: 6,
    color: "#111111",
    marginBottom: 22,
  },

  question: {
    marginTop: 0,
    marginBottom: 16,
    fontSize: 27,
    lineHeight: 33,
    fontWeight: "700",
    color: "#111111",
  },

  searchContainer: {
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  searchInput: {
    flex: 1,
    height: "100%",
    marginLeft: 10,
    fontSize: 16,
    color: "#111111",
  },

  searchAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#765FD2",
  },

  searchMessage: {
    marginTop: 8,
    borderRadius: 13,
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: "#FFF4F4",
  },

  searchError: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: "#A15359",
  },

  searchResults: {
    marginTop: 9,
    marginBottom: 12,
    overflow: "hidden",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E5E0EA",
    backgroundColor: "#FFFFFF",
  },

  searchResult: {
    minHeight: 57,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEAF1",
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
  },

  searchResultSelected: {
    backgroundColor: "#F4F0FF",
  },

  resultPin: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEE9FF",
  },

  resultPinSelected: {
    backgroundColor: "#765FD2",
  },

  resultBody: {
    flex: 1,
    marginLeft: 10,
    paddingRight: 8,
  },

  resultName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1D1920",
  },

  resultMeta: {
    marginTop: 3,
    fontSize: 9,
    textTransform: "capitalize",
    color: "#81798A",
  },

  searchAttribution: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    fontSize: 8,
    textAlign: "right",
    color: "#938B98",
  },

  randomButton: {
    minHeight: 66,
    marginTop: 13,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
  },

  randomIcon: {
    width: 41,
    height: 41,
    borderRadius: 20.5,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
  },

  randomText: {
    flex: 1,
    marginLeft: 13,
    fontSize: 16,
    fontWeight: "600",
    color: "#111111",
  },

  randomResult: {
    marginTop: 12,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    backgroundColor: "#FAFAFA",
  },

  randomLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: "#777777",
  },

  randomCity: {
    marginTop: 7,
    fontSize: 27,
    fontWeight: "700",
    color: "#111111",
  },

  randomCountry: {
    marginTop: 2,
    fontSize: 14,
    color: "#777777",
  },

  tryAnother: {
    marginTop: 13,
    fontSize: 13,
    fontWeight: "600",
    color: "#111111",
  },

  routeSection: {
    marginTop: 26,
  },

  routeSectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
  },

  routeSectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: "#777777",
  },

  routeRecommendations: {
    paddingTop: 14,
    paddingRight: 2,
    gap: 12,
  },

  routeSkeletonCard: {
    width: 262,
    minHeight: 205,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5DDF8",
    backgroundColor: "#FAF8FF",
    padding: 16,
  },

  routeSkeletonHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },

  routeIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EEE9FF",
    alignItems: "center",
    justifyContent: "center",
  },

  routeSkeletonLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
  },

  routeSkeletonDuration: {
    marginTop: 2,
    fontSize: 12,
    color: "#777777",
  },

  skeletonLineWide: {
    width: "88%",
    height: 10,
    marginTop: 19,
    borderRadius: 5,
    backgroundColor: "#E9E5F1",
  },

  skeletonLineMedium: {
    width: "62%",
    height: 10,
    marginTop: 8,
    borderRadius: 5,
    backgroundColor: "#EEEAF4",
  },

  skeletonStops: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  skeletonStop: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#CFC3EE",
  },

  skeletonStopLine: {
    width: 42,
    height: 2,
    backgroundColor: "#DED6EE",
  },

  routeSkeletonHint: {
    marginTop: 17,
    fontSize: 11,
    color: "#948AA8",
  },

  sectionTitle: {
    marginTop: 30,
    marginBottom: 13,
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
  },

  tripCard: {
    minHeight: 74,
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  tripTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111111",
  },

  tripSubtitle: {
    marginTop: 3,
    fontSize: 13,
    color: "#777777",
  },
});
