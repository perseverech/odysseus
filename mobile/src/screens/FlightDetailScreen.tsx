import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import BoardingPassCard from "../components/BoardingPassCard";
import StackScreenHeader from "../components/profile/StackScreenHeader";
import { useTravelData } from "../context/TravelDataContext";
import type { ProfileStackParamList } from "../navigation/navigationTypes";

type Props = NativeStackScreenProps<
  ProfileStackParamList,
  "FlightDetail"
>;

export default function FlightDetailScreen({ route, navigation }: Props) {
  const { flights, trips, deleteFlight } = useTravelData();
  const flight = flights.find((item) => item.id === route.params.flightId);
  const linkedTrip = trips.find((trip) => trip.id === flight?.tripId);

  if (!flight) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StackScreenHeader title="Flight not found" onBack={navigation.goBack} />
        <View style={styles.notFound}>
          <Ionicons name="airplane-outline" size={30} color="#9B91A2" />
          <Text style={styles.notFoundTitle}>Flight not found</Text>
          <Text style={styles.notFoundText}>
            It may have been removed from your saved travel data.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const flightId = flight.id;
  const flightRoute = `${flight.departureIata} → ${flight.arrivalIata}`;

  function confirmDelete() {
    Alert.alert(
      "Delete flight?",
      `${flightRoute} will be removed from your travel data.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteFlight(flightId);
            navigation.goBack();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StackScreenHeader
        eyebrow="SAVED TRAVEL INFO"
        title="Flight details"
        onBack={navigation.goBack}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <BoardingPassCard flight={flight} />

        {linkedTrip && (
          <View style={styles.tripLink}>
            <View style={styles.tripIcon}>
              <Ionicons name="calendar-outline" size={17} color="#765FD2" />
            </View>
            <View style={styles.tripTextArea}>
              <Text style={styles.tripLabel}>SAVED TO TRIP</Text>
              <Text style={styles.tripName}>
                {linkedTrip.destinationCity}, {linkedTrip.destinationCountry}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.notice}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="#766B7E"
          />
          <Text style={styles.noticeText}>
            This card stores travel information only. It is not a boarding
            pass and cannot be used to board a flight.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.editButton}
          activeOpacity={0.82}
          onPress={() => navigation.navigate("AddFlight", { flightId })}
          accessibilityRole="button"
          accessibilityLabel="Edit flight"
        >
          <Ionicons name="pencil-outline" size={17} color="#FFFFFF" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.deleteButton}
          activeOpacity={0.75}
          onPress={confirmDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete flight"
        >
          <Ionicons name="trash-outline" size={17} color="#B94E55" />
          <Text style={styles.deleteButtonText}>Delete flight</Text>
        </TouchableOpacity>
      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8F7FC" },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 42 },
  tripLink: {
    marginBottom: 13,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#E7E1F3",
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  tripIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEE9FF",
  },
  tripTextArea: { flex: 1, marginLeft: 11 },
  tripLabel: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#998FA1",
  },
  tripName: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "700",
    color: "#332B3C",
  },
  notice: {
    marginBottom: 17,
    borderRadius: 15,
    padding: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: "#EEEAF5",
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 17,
    color: "#6D6573",
  },
  editButton: {
    height: 51,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#111111",
  },
  editButtonText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  deleteButton: {
    height: 49,
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E7CDD0",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#FFF9F9",
  },
  deleteButtonText: { fontSize: 13, fontWeight: "700", color: "#B94E55" },
  notFound: {
    flex: 1,
    paddingHorizontal: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  notFoundTitle: {
    marginTop: 13,
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
  },
  notFoundText: {
    marginTop: 7,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 18,
    color: "#777077",
  },
});
