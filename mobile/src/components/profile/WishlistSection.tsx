import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { useWishlist } from "../../context/WishlistContext";
import { useTravelData } from "../../context/TravelDataContext";
import { discoverItems } from "../../data/discoverItems";
import { placeToDiscoverItem } from "../../data/placeCatalog";
import ProfileSectionHeader from "./ProfileSectionHeader";

export default function WishlistSection({
  onOpenItem,
}: {
  onOpenItem: (itemId: string) => void;
}) {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { livePlaces } = useTravelData();
  const items = [...discoverItems, ...livePlaces.map(placeToDiscoverItem)].filter(
    (item, index, allItems) =>
      wishlist.includes(item.id) &&
      allItems.findIndex((candidate) => candidate.id === item.id) === index
  );

  return (
    <>
      <ProfileSectionHeader title="Wishlist" count={items.length} />
      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-outline" size={23} color="#777777" />
          </View>
          <View style={styles.emptyTextArea}>
            <Text style={styles.emptyTitle}>Nothing saved yet</Text>
            <Text style={styles.emptyText}>
              Save places, experiences and routes from Discover.
            </Text>
          </View>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {items.map((item) => (
            <View key={item.id} style={styles.card}>
              <TouchableOpacity
                style={styles.cardLink}
                activeOpacity={0.84}
                onPress={() => onOpenItem(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.title}`}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.image} />
                ) : (
                  <View style={[styles.image, styles.imageFallback]}>
                    <Ionicons name="location-outline" size={28} color="#765FD2" />
                  </View>
                )}
                <View style={styles.categoryBadge}>
                  <Text style={styles.category}>{item.category.toUpperCase()}</Text>
                </View>
                <View style={styles.cardContent}>
                  <Text style={styles.itemTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.locationRow}>
                    <Ionicons name="location-outline" size={13} color="#888888" />
                    <Text style={styles.location} numberOfLines={1}>
                      {item.country}
                    </Text>
                  </View>
                  <Text style={styles.price} numberOfLines={1}>
                    {item.price}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromWishlist(item.id)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${item.title} from Wishlist`}
              >
                <Ionicons name="trash-outline" size={17} color="#111111" />
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: { paddingRight: 20, gap: 12 },
  card: {
    width: 205,
    overflow: "hidden",
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    backgroundColor: "#FFFFFF",
  },
  cardLink: { flex: 1 },
  image: { width: "100%", height: 118, backgroundColor: "#EEEEEE" },
  imageFallback: { alignItems: "center", justifyContent: "center", backgroundColor: "#EEE9FF" },
  categoryBadge: {
    position: "absolute",
    top: 9,
    left: 9,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: "rgba(255,255,255,0.92)",
  },
  category: { fontSize: 7, fontWeight: "800", letterSpacing: 0.7, color: "#555555" },
  cardContent: { minHeight: 113, padding: 12 },
  itemTitle: { minHeight: 36, fontSize: 14, lineHeight: 18, fontWeight: "700", color: "#111111" },
  locationRow: { marginTop: 5, flexDirection: "row", alignItems: "center", gap: 3 },
  location: { flex: 1, fontSize: 10, color: "#888888" },
  price: { marginTop: 9, paddingRight: 34, fontSize: 11, fontWeight: "700", color: "#765FD2" },
  removeButton: {
    position: "absolute",
    right: 9,
    bottom: 9,
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F2F2F2",
  },
  emptyCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEEEEE",
  },
  emptyTextArea: { flex: 1, marginLeft: 12 },
  emptyTitle: { fontSize: 13, fontWeight: "700", color: "#111111" },
  emptyText: { marginTop: 3, fontSize: 11, lineHeight: 16, color: "#777777" },
});
