import React, { useMemo } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTravelData } from "../context/TravelDataContext";
import { useWishlist } from "../context/WishlistContext";
import { discoverItems, type DiscoverItem } from "../data/discoverItems";
import { placeToDiscoverItem } from "../data/placeCatalog";
import type { DiscoverStackParamList } from "../navigation/DiscoverStack";

type Props = NativeStackScreenProps<
  DiscoverStackParamList,
  "DiscoverPlacesAlbum"
>;

function itemKey(item: DiscoverItem) {
  return `${item.title.trim().toLocaleLowerCase()}-${item.location
    .trim()
    .toLocaleLowerCase()}`;
}

export default function DiscoverPlacesAlbumScreen({ navigation }: Props) {
  const { livePlaces } = useTravelData();
  const { isSaved, toggleWishlist } = useWishlist();
  const places = useMemo(
    () =>
      [
        ...livePlaces.map(placeToDiscoverItem),
        ...discoverItems.filter((item) => item.category === "Place"),
      ].filter(
        (item, index, items) =>
          items.findIndex((candidate) => itemKey(candidate) === itemKey(item)) ===
          index
      ),
    [livePlaces]
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={navigation.goBack}
          accessibilityRole="button"
          accessibilityLabel="Back to Discover"
        >
          <Ionicons name="chevron-back" size={23} color="#111111" />
        </TouchableOpacity>

        <View style={styles.headingText}>
          <Text style={styles.eyebrow}>DISCOVER ALBUM</Text>
          <Text style={styles.title}>All places</Text>
          <Text style={styles.subtitle}>
            {places.length} {places.length === 1 ? "place" : "places"}
          </Text>
        </View>
      </View>

      <FlatList
        data={places}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.84}
            onPress={() =>
              navigation.navigate("DiscoverDetail", { itemId: item.id })
            }
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.title}`}
          >
            {item.image ? (
              <Image source={{ uri: item.image }} style={styles.image} />
            ) : (
              <View style={[styles.image, styles.imageFallback]}>
                <Ionicons name="location-outline" size={30} color="#765FD2" />
              </View>
            )}

            <TouchableOpacity
              style={styles.heartButton}
              onPress={() => toggleWishlist(item.id)}
              accessibilityRole="button"
              accessibilityLabel={
                isSaved(item.id)
                  ? `Remove ${item.title} from Wishlist`
                  : `Save ${item.title} to Wishlist`
              }
            >
              <Ionicons
                name={isSaved(item.id) ? "heart" : "heart-outline"}
                size={18}
                color={isSaved(item.id) ? "#765FD2" : "#111111"}
              />
            </TouchableOpacity>

            <View style={styles.cardBody}>
              <View style={styles.badgeRow}>
                <Text style={styles.category}>
                  {(item.placeCategory ?? item.category).replace(/_/g, " ").toUpperCase()}
                </Text>
                {item.isLiveData && (
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>LIVE</Text>
                  </View>
                )}
                {item.isDemoData && (
                  <View style={styles.demoBadge}>
                    <Text style={styles.demoBadgeText}>DEMO</Text>
                  </View>
                )}
              </View>

              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.location} numberOfLines={1}>
                {item.location}, {item.country}
              </Text>
              <Text style={styles.price} numberOfLines={1}>
                {item.price}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Ionicons name="images-outline" size={30} color="#918A95" />
            <Text style={styles.emptyTitle}>No places yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    paddingHorizontal: 18,
    paddingTop: 5,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "flex-start",
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#E7E3EA",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  headingText: { flex: 1, marginLeft: 13, paddingTop: 1 },
  eyebrow: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#8A8190",
  },
  title: { marginTop: 3, fontSize: 28, fontWeight: "700", color: "#111111" },
  subtitle: { marginTop: 2, fontSize: 11, color: "#81798A" },
  grid: { paddingHorizontal: 16, paddingBottom: 42 },
  row: { gap: 11 },
  card: {
    width: "48%",
    marginBottom: 12,
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8E5EB",
    backgroundColor: "#FFFFFF",
  },
  image: { width: "100%", height: 146, backgroundColor: "#F0EEF2" },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEE9FF",
  },
  heartButton: {
    position: "absolute",
    top: 9,
    right: 9,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.94)",
  },
  cardBody: { minHeight: 132, padding: 12 },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  category: {
    flexShrink: 1,
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: "#8A8190",
  },
  liveBadge: {
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: "#E4F4EA",
  },
  liveBadgeText: {
    fontSize: 6,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#34704C",
  },
  demoBadge: {
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    backgroundColor: "#EEE9FF",
  },
  demoBadgeText: {
    fontSize: 6,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#765FD2",
  },
  cardTitle: {
    minHeight: 38,
    marginTop: 7,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "700",
    color: "#171419",
  },
  location: { marginTop: 3, fontSize: 9, color: "#81798A" },
  price: { marginTop: 9, fontSize: 10, fontWeight: "700", color: "#5C4A97" },
  emptyCard: {
    marginTop: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { marginTop: 10, fontSize: 14, fontWeight: "700", color: "#777077" },
});
