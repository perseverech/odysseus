import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { useTravelData } from "../../context/TravelDataContext";
import ProfileSectionHeader from "./ProfileSectionHeader";

type Props = {
  onOpenChecklist: (tripId: string) => void;
};

export default function PackingListsSection({ onOpenChecklist }: Props) {
  const { trips } = useTravelData();

  if (trips.length === 0) return null;

  return (
    <>
      <ProfileSectionHeader title="Packing lists" count={trips.length} />
      {trips.map((trip) => {
        const items = trip.packingItems ?? [];
        const packedCount = items.filter((item) => item.isPacked).length;
        const progress = items.length > 0 ? packedCount / items.length : 0;
        const complete = items.length > 0 && packedCount === items.length;

        return (
          <TouchableOpacity
            key={trip.id}
            style={styles.card}
            activeOpacity={0.82}
            onPress={() => onOpenChecklist(trip.id)}
            accessibilityRole="button"
            accessibilityLabel={`Open packing list for ${trip.destinationCity}`}
          >
            <View
              style={[
                styles.icon,
                complete && styles.iconComplete,
              ]}
            >
              <Ionicons
                name={complete ? "checkmark" : "bag-handle-outline"}
                size={20}
                color={complete ? "#FFFFFF" : "#765FD2"}
              />
            </View>

            <View style={styles.body}>
              <View style={styles.titleRow}>
                <Text style={styles.city}>{trip.destinationCity}</Text>
                <Text style={[styles.progressText, complete && styles.completeText]}>
                  {complete ? "Ready" : `${packedCount}/${items.length}`}
                </Text>
              </View>
              <Text style={styles.country}>{trip.destinationCountry}</Text>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    complete && styles.progressFillComplete,
                    { width: `${Math.round(progress * 100)}%` },
                  ]}
                />
              </View>
            </View>

            <Ionicons name="chevron-forward" size={18} color="#928A97" />
          </TouchableOpacity>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 92,
    marginBottom: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5DFF2",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FCFBFF",
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEE9FF",
  },
  iconComplete: { backgroundColor: "#57A678" },
  body: { flex: 1, marginHorizontal: 12 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  city: { flex: 1, fontSize: 15, fontWeight: "700", color: "#171419" },
  country: { marginTop: 2, fontSize: 10, color: "#817982" },
  progressText: { marginLeft: 8, fontSize: 10, fontWeight: "700", color: "#765FD2" },
  completeText: { color: "#3E7C5A" },
  progressTrack: {
    height: 5,
    marginTop: 10,
    overflow: "hidden",
    borderRadius: 3,
    backgroundColor: "#E9E5ED",
  },
  progressFill: { height: "100%", borderRadius: 3, backgroundColor: "#765FD2" },
  progressFillComplete: { backgroundColor: "#57A678" },
});
