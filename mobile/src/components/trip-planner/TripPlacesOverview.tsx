import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import type { Place } from "../../models/place";
import {
  formatTripMoney,
  formatVisitDuration,
} from "../../utils/tripFormatting";

function formatCategory(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toLocaleUpperCase() + part.slice(1))
    .join(" ");
}

function formatPrice(place: Place) {
  if (place.isFree || place.price === 0) return "Free";
  if (place.price === undefined) return "Price unknown";

  return formatTripMoney(place.price, place.currency);
}

function formatOpeningHours(place: Place) {
  if (place.openingHours?.summary?.trim()) {
    return place.openingHours.summary.trim();
  }

  if (place.openingHours?.weekly) return "Hours available";

  return "Hours unknown";
}

export default function TripPlacesOverview({
  places,
  priorityPlaceIds,
  onAddPlace,
  onBrowseDiscover,
  onAddManualPlace,
  onTogglePriority,
}: {
  places: Place[];
  priorityPlaceIds: string[];
  onAddPlace: () => void;
  onBrowseDiscover: () => void;
  onAddManualPlace: () => void;
  onTogglePriority: (placeId: string) => void;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Places</Text>
          <Text style={styles.subtitle}>
            {places.length === 1 ? "1 saved place" : `${places.length} saved places`}
          </Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={onAddPlace}>
          <Ionicons name="add" size={16} color="#765FD2" />
          <Text style={styles.addText}>Add place</Text>
        </TouchableOpacity>
      </View>

      {places.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyTop}>
            <View style={styles.emptyIcon}>
              <Ionicons name="location-outline" size={21} color="#765FD2" />
            </View>
            <View style={styles.emptyBody}>
              <Text style={styles.emptyTitle}>No places yet</Text>
              <Text style={styles.emptyText}>
                Save places from Discover or add your own.
              </Text>
            </View>
          </View>
          <View style={styles.emptyActions}>
            <TouchableOpacity
              style={styles.browseButton}
              onPress={onBrowseDiscover}
            >
              <Ionicons name="compass-outline" size={15} color="#765FD2" />
              <Text style={styles.browseText}>Browse Discover</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.manualButton}
              onPress={onAddManualPlace}
            >
              <Ionicons name="add" size={15} color="#FFFFFF" />
              <Text style={styles.manualText}>Add manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.list}>
          {places.map((place, index) => {
            const isPriority = priorityPlaceIds.includes(place.id);

            return (
              <View
                key={place.id}
                style={[
                  styles.placeRow,
                  index === places.length - 1 && styles.placeRowLast,
                ]}
              >
                <TouchableOpacity
                  style={[
                    styles.priorityButton,
                    isPriority && styles.priorityButtonActive,
                  ]}
                  onPress={() => onTogglePriority(place.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`${
                    isPriority ? "Remove" : "Mark"
                  } ${place.name} as Must see`}
                >
                  <Ionicons
                    name={isPriority ? "star" : "star-outline"}
                    size={16}
                    color={isPriority ? "#8B6A22" : "#8A8190"}
                  />
                </TouchableOpacity>
                <View style={styles.placeBody}>
                  <View style={styles.placeNameRow}>
                    <Text style={styles.placeName} numberOfLines={1}>
                      {place.name}
                    </Text>
                    {isPriority && (
                      <View style={styles.mustSeeBadge}>
                        <Text style={styles.mustSeeText}>Must see</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.placeCategory}>
                    {formatCategory(place.category)} · {formatOpeningHours(place)}
                  </Text>
                  {place.isDemoData && (
                    <Text style={styles.demoText}>Local demo estimate</Text>
                  )}
                </View>
                <View style={styles.placeFacts}>
                  <Text
                    style={[
                      styles.placePrice,
                      (place.isFree || place.price === 0) && styles.freePrice,
                    ]}
                  >
                    {formatPrice(place)}
                  </Text>
                  <Text style={styles.placeDuration}>
                    {formatVisitDuration(place.estimatedVisitMinutes)}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 25 },
  header: { marginBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 21, fontWeight: "700", color: "#111111" },
  subtitle: { marginTop: 3, fontSize: 10, color: "#8A838D" },
  addButton: { minHeight: 34, borderRadius: 17, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EEE9FF" },
  addText: { fontSize: 11, fontWeight: "700", color: "#765FD2" },
  list: { borderRadius: 20, borderWidth: 1, borderColor: "#E3DEE8", paddingHorizontal: 14, backgroundColor: "#FFFFFF" },
  placeRow: { minHeight: 78, borderBottomWidth: 1, borderBottomColor: "#EEEAF1", flexDirection: "row", alignItems: "center" },
  placeRowLast: { borderBottomWidth: 0 },
  priorityButton: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: "#F1EDF4" },
  priorityButtonActive: { backgroundColor: "#FFF3D8" },
  placeBody: { flex: 1, marginLeft: 11, paddingRight: 8 },
  placeNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  placeName: { fontSize: 14, fontWeight: "700", color: "#171419" },
  mustSeeBadge: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, backgroundColor: "#FFF3D8" },
  mustSeeText: { fontSize: 7, fontWeight: "800", letterSpacing: 0.3, textTransform: "uppercase", color: "#8B6A22" },
  placeCategory: { marginTop: 4, fontSize: 10, color: "#7E7682" },
  demoText: { marginTop: 3, fontSize: 8, fontWeight: "700", color: "#826BD2" },
  placeFacts: { alignItems: "flex-end" },
  placePrice: { fontSize: 11, fontWeight: "700", color: "#44375E" },
  freePrice: { color: "#3E7C5A" },
  placeDuration: { marginTop: 5, fontSize: 10, color: "#88808C" },
  empty: { borderRadius: 18, borderWidth: 1, borderColor: "#E1DBEA", padding: 13, backgroundColor: "#FBFAFD" },
  emptyTop: { flexDirection: "row", alignItems: "center" },
  emptyIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#EEE9FF" },
  emptyBody: { flex: 1, marginLeft: 11, paddingRight: 8 },
  emptyTitle: { fontSize: 12, fontWeight: "700", color: "#28222C" },
  emptyText: { marginTop: 3, fontSize: 10, lineHeight: 15, color: "#817986" },
  emptyActions: { marginTop: 13, flexDirection: "row", gap: 8 },
  browseButton: { flex: 1, minHeight: 39, borderRadius: 13, borderWidth: 1, borderColor: "#D9D0F0", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "#FFFFFF" },
  browseText: { fontSize: 10, fontWeight: "700", color: "#765FD2" },
  manualButton: { flex: 1, minHeight: 39, borderRadius: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, backgroundColor: "#171419" },
  manualText: { fontSize: 10, fontWeight: "700", color: "#FFFFFF" },
});
