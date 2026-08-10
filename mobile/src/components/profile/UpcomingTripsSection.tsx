import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { useTravelData } from "../../context/TravelDataContext";
import { formatTripDateRange } from "../../utils/travelDates";
import ProfileSectionHeader from "./ProfileSectionHeader";

type Props = {
  onAddTrip: () => void;
  onOpenTrip: (tripId: string) => void;
};

export default function UpcomingTripsSection({ onAddTrip, onOpenTrip }: Props) {
  const { trips, flights } = useTravelData();

  return (
    <>
      <ProfileSectionHeader
        title="Upcoming trips"
        count={trips.length}
        actionLabel="Add trip"
        onAction={onAddTrip}
      />
      {trips.length === 0 ? (
        <EmptyTripCard onAdd={onAddTrip} />
      ) : (
        trips.map((trip) => {
          const tripFlightCount = flights.filter(
            (flight) =>
              flight.tripId === trip.id || trip.flightIds.includes(flight.id)
          ).length;
          const savedPlacesCount = trip.selectedPlaceIds.length;
          const routeStopCount = (trip.routeDays ?? []).reduce(
            (sum, day) => sum + day.stops.length,
            0
          );
          const routePlanned = routeStopCount > 0;

          return (
            <TouchableOpacity
              key={trip.id}
              style={styles.card}
              activeOpacity={0.82}
              onPress={() => onOpenTrip(trip.id)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${trip.destinationCity} trip`}
            >
              <View style={styles.cardHeader}>
                <View style={styles.titleArea}>
                  <Text style={styles.city}>{trip.destinationCity}</Text>
                  <Text style={styles.country}>{trip.destinationCountry}</Text>
                </View>
                <View
                  style={[
                    styles.status,
                    trip.status === "booked" && styles.statusBooked,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      trip.status === "booked" && styles.statusTextBooked,
                    ]}
                  >
                    {trip.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.dates}>
                {formatTripDateRange(trip.startDate, trip.endDate)}
              </Text>
              <View style={styles.facts}>
                <Fact
                  icon="airplane-outline"
                  label={
                    tripFlightCount === 0
                      ? "No flight saved"
                      : tripFlightCount === 1
                        ? "Flight saved"
                        : `${tripFlightCount} flights saved`
                  }
                  active={tripFlightCount > 0}
                />
                <Fact
                  icon="bookmark-outline"
                  label={`${savedPlacesCount} ${
                    savedPlacesCount === 1 ? "place" : "places"
                  } saved`}
                  active={savedPlacesCount > 0}
                />
                <Fact
                  icon="map-outline"
                  label={
                    routePlanned
                      ? `${routeStopCount} route stops`
                      : "Route not planned"
                  }
                  active={routePlanned}
                />
              </View>
              <View style={styles.openRow}>
                <Text style={styles.openText}>View trip</Text>
                <Ionicons name="arrow-forward" size={15} color="#111111" />
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </>
  );
}

function Fact({
  icon,
  label,
  active,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  active: boolean;
}) {
  return (
    <View style={styles.fact}>
      <View style={[styles.factIcon, active && styles.factIconActive]}>
        <Ionicons
          name={active ? "checkmark" : icon}
          size={13}
          color={active ? "#765FD2" : "#888888"}
        />
      </View>
      <Text style={styles.factText}>{label}</Text>
    </View>
  );
}

function EmptyTripCard({ onAdd }: { onAdd: () => void }) {
  return (
    <TouchableOpacity style={styles.emptyCard} onPress={onAdd}>
      <View style={styles.emptyIcon}>
        <Ionicons name="calendar-outline" size={22} color="#777777" />
      </View>
      <View style={styles.emptyTextArea}>
        <Text style={styles.emptyTitle}>No upcoming trips</Text>
        <Text style={styles.emptyText}>Add a journey to keep plans together.</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 11,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#E6E0F8",
    padding: 16,
    backgroundColor: "#FCFBFF",
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  titleArea: { flex: 1, paddingRight: 10 },
  city: { fontSize: 22, fontWeight: "700", color: "#111111" },
  country: { marginTop: 2, fontSize: 12, color: "#777777" },
  status: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: "#F0F0F0" },
  statusBooked: { backgroundColor: "#E9E3FF" },
  statusText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.8, color: "#777777" },
  statusTextBooked: { color: "#765FD2" },
  dates: { marginTop: 13, fontSize: 15, fontWeight: "600", color: "#111111" },
  facts: { marginTop: 15, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#ECE8F5", gap: 8 },
  fact: { flexDirection: "row", alignItems: "center" },
  factIcon: { width: 23, height: 23, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#F0F0F0" },
  factIconActive: { backgroundColor: "#EEE9FF" },
  factText: { marginLeft: 8, fontSize: 12, color: "#666666" },
  openRow: { marginTop: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  openText: { fontSize: 13, fontWeight: "700", color: "#111111" },
  emptyCard: { borderRadius: 18, borderWidth: 1, borderColor: "#E8E8E8", padding: 15, flexDirection: "row", alignItems: "center", backgroundColor: "#FAFAFA" },
  emptyIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#EEEEEE" },
  emptyTextArea: { flex: 1, marginLeft: 12 },
  emptyTitle: { fontSize: 13, fontWeight: "700", color: "#111111" },
  emptyText: { marginTop: 3, fontSize: 11, color: "#777777" },
});
