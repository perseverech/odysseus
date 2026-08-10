import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { useTravelData } from "../../context/TravelDataContext";
import BoardingPassCard from "../BoardingPassCard";
import ProfileSectionHeader from "./ProfileSectionHeader";

type Props = {
  onAddFlight: () => void;
  onOpenFlight: (flightId: string) => void;
};

export default function FlightsSection({
  onAddFlight,
  onOpenFlight,
}: Props) {
  const { flights } = useTravelData();

  return (
    <>
      <ProfileSectionHeader
        title="Flights"
        count={flights.length}
        actionLabel="Add flight"
        onAction={onAddFlight}
      />
      {flights.length === 0 ? (
        <TouchableOpacity style={styles.emptyCard} onPress={onAddFlight}>
          <View style={styles.emptyIcon}>
            <Ionicons name="airplane-outline" size={22} color="#777777" />
          </View>
          <View style={styles.emptyTextArea}>
            <Text style={styles.emptyTitle}>No flights saved</Text>
            <Text style={styles.emptyText}>
              Store your ticket details for quick access.
            </Text>
          </View>
        </TouchableOpacity>
      ) : (
        flights.map((flight) => (
          <BoardingPassCard
            key={flight.id}
            flight={flight}
            onPress={() => onOpenFlight(flight.id)}
          />
        ))
      )}
    </>
  );
}

const styles = StyleSheet.create({
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
  emptyText: { marginTop: 3, fontSize: 11, color: "#777777" },
});
