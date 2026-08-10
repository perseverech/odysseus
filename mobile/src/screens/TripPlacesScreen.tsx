import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import StackScreenHeader from "../components/profile/StackScreenHeader";
import { useTravelData } from "../context/TravelDataContext";
import { useWishlist } from "../context/WishlistContext";
import { usePlacesCatalog } from "../hooks/usePlacesCatalog";
import type { Place } from "../models/place";
import type { ProfileStackParamList } from "../navigation/navigationTypes";

type Props = NativeStackScreenProps<ProfileStackParamList, "TripPlaces">;

function normalize(value: string) {
  return value.trim().toLocaleLowerCase();
}

function placePrice(place: Place) {
  if (place.isFree || place.price === 0) return "Free";
  if (place.priceLabel) return place.priceLabel;
  if (place.price === undefined) return "Price unknown";

  return `≈ ${place.price} ${place.currency ?? "EUR"}`;
}

export default function TripPlacesScreen({ route, navigation }: Props) {
  const { trips, customPlaces, setTripSelectedPlaceIds } = useTravelData();
  const { wishlist } = useWishlist();
  const [search, setSearch] = useState("");
  const trip = trips.find((item) => item.id === route.params.tripId);
  const { places: allPlaces } = usePlacesCatalog(customPlaces);

  if (!trip) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StackScreenHeader title="Trip not found" onBack={navigation.goBack} />
        <View style={styles.notFound}>
          <Text style={styles.emptyText}>This trip is no longer available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const tripId = trip.id;
  const selectedIds = trip.selectedPlaceIds;
  const normalizedSearch = normalize(search);
  const searchResults = normalizedSearch
    ? allPlaces.filter((place) =>
        normalize(
          `${place.name} ${place.city} ${place.country} ${place.category}`
        ).includes(normalizedSearch)
      )
    : [];
  const wishlistPlaces = allPlaces.filter((place) => wishlist.includes(place.id));
  const wishlistIdSet = new Set(wishlistPlaces.map((place) => place.id));
  const destinationPlaces = allPlaces.filter(
    (place) =>
      !wishlistIdSet.has(place.id) &&
      place.source !== "manual" &&
      (normalize(place.city) === normalize(trip.destinationCity) ||
        normalize(place.country) === normalize(trip.destinationCountry))
  );
  const destinationIdSet = new Set(destinationPlaces.map((place) => place.id));
  const otherDiscoverPlaces = allPlaces.filter(
    (place) =>
      place.source === "discover" &&
      !wishlistIdSet.has(place.id) &&
      !destinationIdSet.has(place.id)
  );
  const manualPlaces = allPlaces.filter(
    (place) =>
      place.source === "manual" &&
      !wishlistIdSet.has(place.id)
  );

  function togglePlace(placeId: string) {
    setTripSelectedPlaceIds(
      tripId,
      selectedIds.includes(placeId)
        ? selectedIds.filter((id) => id !== placeId)
        : [...selectedIds, placeId]
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StackScreenHeader
        eyebrow={`${selectedIds.length} SELECTED`}
        title="Places"
        onBack={navigation.goBack}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <Text style={styles.intro}>
          Build a pool of places for {trip.destinationCity}. Changing this list
          resets the generated route so it stays consistent.
        </Text>
        <Text style={styles.estimateNote}>
          Items marked Demo use local development estimates, not live prices or
          opening hours.
        </Text>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#81798A" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholder="Search the place catalog"
            placeholderTextColor="#9D96A4"
            autoCorrect={false}
          />
        </View>

        <TouchableOpacity
          style={styles.manualButton}
          onPress={() =>
            navigation.navigate("AddCustomPlace", { tripId: trip.id })
          }
        >
          <View style={styles.manualIcon}>
            <Ionicons name="add" size={22} color="#765FD2" />
          </View>
          <View style={styles.manualTextArea}>
            <Text style={styles.manualTitle}>Add your own place</Text>
            <Text style={styles.manualText}>Name, duration, price and coordinates</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#8E8794" />
        </TouchableOpacity>

        {normalizedSearch ? (
          <PlaceSection
            title="Search results"
            places={searchResults}
            selectedIds={selectedIds}
            onToggle={togglePlace}
          />
        ) : (
          <>
            <PlaceSection
              title="From Wishlist"
              subtitle="Saved in Discover"
              places={wishlistPlaces}
              selectedIds={selectedIds}
              onToggle={togglePlace}
            />
            <PlaceSection
              title={`Recommended in ${trip.destinationCity}`}
              places={destinationPlaces}
              selectedIds={selectedIds}
              onToggle={togglePlace}
            />
            <PlaceSection
              title="My places"
              places={manualPlaces}
              selectedIds={selectedIds}
              onToggle={togglePlace}
            />
            <PlaceSection
              title="More from Discover"
              places={otherDiscoverPlaces}
              selectedIds={selectedIds}
              onToggle={togglePlace}
            />
          </>
        )}

        <TouchableOpacity style={styles.doneButton} onPress={navigation.goBack}>
          <Text style={styles.doneText}>Done · {selectedIds.length} places</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function PlaceSection({
  title,
  subtitle,
  places,
  selectedIds,
  onToggle,
}: {
  title: string;
  subtitle?: string;
  places: Place[];
  selectedIds: string[];
  onToggle: (placeId: string) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
        </View>
        <Text style={styles.sectionCount}>{places.length}</Text>
      </View>
      {places.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No places here yet.</Text>
        </View>
      ) : (
        places.map((place) => {
          const selected = selectedIds.includes(place.id);

          return (
            <TouchableOpacity
              key={place.id}
              style={[styles.placeCard, selected && styles.placeCardSelected]}
              activeOpacity={0.82}
              onPress={() => onToggle(place.id)}
            >
              {place.image ? (
                <Image source={{ uri: place.image }} style={styles.placeImage} />
              ) : (
                <View style={styles.placeImageFallback}>
                  <Ionicons name="location-outline" size={22} color="#765FD2" />
                </View>
              )}
              <View style={styles.placeBody}>
                <View style={styles.categoryRow}>
                  <Text style={styles.placeCategory}>
                    {place.category.toUpperCase()}
                  </Text>
                  {place.isDemoData && (
                    <View style={styles.demoBadge}>
                      <Text style={styles.demoBadgeText}>DEMO</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.placeName} numberOfLines={1}>
                  {place.name}
                </Text>
                <Text style={styles.placeMeta} numberOfLines={1}>
                  {place.city}, {place.country} · {place.estimatedVisitMinutes} min
                </Text>
                <Text style={styles.placePrice}>{placePrice(place)}</Text>
              </View>
              <View style={[styles.selectIcon, selected && styles.selectIconActive]}>
                <Ionicons
                  name={selected ? "checkmark" : "add"}
                  size={17}
                  color={selected ? "#FFFFFF" : "#765FD2"}
                />
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8F7FC" },
  content: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 42 },
  intro: { fontSize: 12, lineHeight: 18, color: "#746D78" },
  estimateNote: { marginTop: 7, fontSize: 9, lineHeight: 14, color: "#8A8190" },
  searchBox: { height: 48, marginTop: 16, borderRadius: 15, borderWidth: 1, borderColor: "#E1DCE8", paddingHorizontal: 13, flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF" },
  searchInput: { flex: 1, height: "100%", marginLeft: 8, paddingVertical: 0, fontSize: 14, color: "#111111" },
  manualButton: { marginTop: 12, borderRadius: 18, borderWidth: 1, borderColor: "#DDD4F4", padding: 13, flexDirection: "row", alignItems: "center", backgroundColor: "#F1EDFF" },
  manualIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  manualTextArea: { flex: 1, marginLeft: 11 },
  manualTitle: { fontSize: 13, fontWeight: "700", color: "#30274B" },
  manualText: { marginTop: 2, fontSize: 10, color: "#7C728F" },
  section: { marginTop: 25 },
  sectionHeading: { marginBottom: 10, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111111" },
  sectionSubtitle: { marginTop: 2, fontSize: 10, color: "#8D8591" },
  sectionCount: { minWidth: 26, height: 26, borderRadius: 13, overflow: "hidden", textAlign: "center", lineHeight: 26, fontSize: 11, fontWeight: "700", color: "#765FD2", backgroundColor: "#EDE8FC" },
  placeCard: { minHeight: 104, marginBottom: 9, borderRadius: 18, borderWidth: 1, borderColor: "#E4E0E8", padding: 9, flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF" },
  placeCardSelected: { borderColor: "#B9A8F2", backgroundColor: "#FBFAFF" },
  placeImage: { width: 82, height: 84, borderRadius: 13, backgroundColor: "#EFEFEF" },
  placeImageFallback: { width: 82, height: 84, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "#EEE9FF" },
  placeBody: { flex: 1, marginLeft: 11, paddingRight: 7 },
  categoryRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  placeCategory: { fontSize: 8, fontWeight: "700", letterSpacing: 0.8, color: "#8A7FA0" },
  demoBadge: { borderRadius: 7, paddingHorizontal: 5, paddingVertical: 2, backgroundColor: "#EEE9FF" },
  demoBadgeText: { fontSize: 6, fontWeight: "800", letterSpacing: 0.5, color: "#765FD2" },
  placeName: { marginTop: 4, fontSize: 14, fontWeight: "700", color: "#171419" },
  placeMeta: { marginTop: 4, fontSize: 10, color: "#777077" },
  placePrice: { marginTop: 7, fontSize: 10, fontWeight: "600", color: "#5C4A97" },
  selectIcon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#EEE9FF" },
  selectIconActive: { backgroundColor: "#765FD2" },
  emptyCard: { borderRadius: 16, borderWidth: 1, borderColor: "#E7E3EA", padding: 16, backgroundColor: "#FFFFFF" },
  emptyText: { fontSize: 11, color: "#8A838D" },
  doneButton: { height: 52, marginTop: 28, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#111111" },
  doneText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center" },
});
