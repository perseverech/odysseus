import React, { useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import WorldMap from "../components/WorldMap";
import StatsCarousel from "../components/StatsCarousel";
import worldGeoJson from "../data/world.json";
import type { AiRouteLength } from "../services/aiRouteRecommendations";

console.log("WorldMap:", typeof WorldMap);
console.log("StatsCarousel:", typeof StatsCarousel);

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

export default function HomeScreen() {
  const screenScrollRef = useRef<ScrollView>(null);
  const mapOffsetRef = useRef(0);
  const [visitedCountries, setVisitedCountries] = useState([
    "lv",
    "tr",
    "es",
  ]);
  const [plannedCountries, setPlannedCountries] =
    useState<string[]>([]);

  const [randomDestination, setRandomDestination] =
    useState<RandomDestination | null>(null);

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

        <View
          onLayout={(event) => {
            mapOffsetRef.current =
              event.nativeEvent.layout.y;
          }}
        >
          <WorldMap
            visitedCountries={visitedCountries}
            plannedCountries={plannedCountries}
            onVisitedCountriesChange={setVisitedCountries}
            onPlannedCountriesChange={setPlannedCountries}
            focusedCountryName={randomDestination?.country}
          />
        </View>

        <StatsCarousel
          visitedCountries={visitedCountries}
        />

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
            style={styles.searchInput}
            placeholder="Search city or country..."
            placeholderTextColor="#999999"
            selectionColor="#000000"
          />
        </View>

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

        <TouchableOpacity style={styles.tripCard}>
          <View>
            <Text style={styles.tripTitle}>Istanbul</Text>
            <Text style={styles.tripSubtitle}>Turkey</Text>
          </View>

          <Ionicons
            name="arrow-forward"
            size={19}
            color="#111111"
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.tripCard}>
          <View>
            <Text style={styles.tripTitle}>Barcelona</Text>
            <Text style={styles.tripSubtitle}>Spain</Text>
          </View>

          <Ionicons
            name="arrow-forward"
            size={19}
            color="#111111"
          />
        </TouchableOpacity>
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
    marginTop: 28,
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
