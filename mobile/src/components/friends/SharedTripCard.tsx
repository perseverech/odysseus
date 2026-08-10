import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import type { SharedTrip } from "../../models/collaboration";
import { formatSharedTripDates } from "../../utils/collaborationDates";

const ROUTE_LABELS: Record<SharedTrip["routeStatus"], string> = {
  not_started: "Route not started",
  in_progress: "Route in progress",
  ready: "Route ready",
};

export default function SharedTripCard({
  trip,
  ideaCount,
  onPress,
}: {
  trip: SharedTrip;
  ideaCount: number;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.82}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open shared trip to ${trip.city}`}
    >
      <View style={styles.header}>
        <View style={styles.locationIcon}>
          <Ionicons name="paper-plane-outline" size={18} color="#765FD2" />
        </View>
        <View style={styles.titleArea}>
          <Text style={styles.title}>{trip.title}</Text>
          <Text style={styles.dates}>
            {formatSharedTripDates(trip.startDate, trip.endDate)}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={19} color="#AAA2B0" />
      </View>

      <View style={styles.metaRow}>
        <Meta icon="people-outline" label={`${trip.participantIds.length} travellers`} />
        <Meta icon="bookmark-outline" label={`${ideaCount} saved places`} />
      </View>

      <View
        style={[
          styles.routeStatus,
          trip.routeStatus === "ready" && styles.routeReady,
        ]}
      >
        <View style={styles.statusDot} />
        <Text style={styles.routeText}>{ROUTE_LABELS[trip.routeStatus]}</Text>
      </View>
    </TouchableOpacity>
  );
}

function Meta({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
}) {
  return (
    <View style={styles.meta}>
      <Ionicons name={icon} size={14} color="#777077" />
      <Text style={styles.metaText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 11,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: "#E6E0F5",
    padding: 15,
    backgroundColor: "#FCFBFF",
  },
  header: { flexDirection: "row", alignItems: "center" },
  locationIcon: {
    width: 39,
    height: 39,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEE9FF",
  },
  titleArea: { flex: 1, marginLeft: 11 },
  title: { fontSize: 17, fontWeight: "700", color: "#111111" },
  dates: { marginTop: 3, fontSize: 11, color: "#777077" },
  metaRow: { marginTop: 15, flexDirection: "row", gap: 17 },
  meta: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 10, color: "#6F6874" },
  routeStatus: {
    marginTop: 13,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1EDF9",
  },
  routeReady: { backgroundColor: "#E9F3EC" },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#9B82EA" },
  routeText: { marginLeft: 7, fontSize: 10, fontWeight: "700", color: "#655878" },
});
