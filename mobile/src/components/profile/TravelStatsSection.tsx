import React from "react";
import { StyleSheet, Text, View } from "react-native";

import StatsCarousel from "../StatsCarousel";
import type { TravelStatistics } from "../../models/travel";
import ProfileSectionHeader from "./ProfileSectionHeader";

export default function TravelStatsSection({
  statistics,
}: {
  statistics: TravelStatistics;
}) {
  return (
    <>
      <ProfileSectionHeader title="Travel statistics" />
      <StatsCarousel statistics={statistics} />
      <View style={styles.summary}>
        <SummaryStat value={statistics.wishlistItemCount} label="Wishlist" />
        <View style={styles.divider} />
        <SummaryStat
          value={statistics.dreamCountryCount}
          label="Dream countries"
        />
        <View style={styles.divider} />
        <SummaryStat
          value={statistics.upcomingTripCount}
          label="Upcoming trips"
        />
      </View>
    </>
  );
}

function SummaryStat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summary: {
    minHeight: 82,
    marginTop: 11,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#ECECEC",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  stat: { flex: 1, paddingHorizontal: 5, alignItems: "center" },
  value: { fontSize: 20, fontWeight: "700", color: "#111111" },
  label: {
    marginTop: 4,
    textAlign: "center",
    fontSize: 9,
    lineHeight: 12,
    color: "#888888",
  },
  divider: { width: 1, height: 31, backgroundColor: "#E8E8E8" },
});
