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
import { useWishlist } from "../context/WishlistContext";
import { discoverItems } from "../data/discoverItems";
import type { ProfileStackParamList } from "../navigation/navigationTypes";
import { formatTripDateRange } from "../utils/travelDates";

type Props = NativeStackScreenProps<ProfileStackParamList, "TripDetail">;
type IconName = React.ComponentProps<typeof Ionicons>["name"];

export default function TripDetailScreen({ route, navigation }: Props) {
  const { trips, flights, deleteTrip } = useTravelData();
  const { wishlist } = useWishlist();
  const trip = trips.find((item) => item.id === route.params.tripId);

  if (!trip) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StackScreenHeader title="Trip not found" onBack={navigation.goBack} />
        <View style={styles.notFound}>
          <Ionicons name="map-outline" size={30} color="#9B91A2" />
          <Text style={styles.notFoundTitle}>Trip not found</Text>
          <Text style={styles.notFoundText}>
            It may have been removed from your travel data.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const tripFlights = flights.filter(
    (flight) =>
      flight.tripId === trip.id || trip.flightIds.includes(flight.id)
  );
  const savedItems = discoverItems.filter((item) => wishlist.includes(item.id));
  const savedPlacesCount = savedItems.filter(
    (item) =>
      item.category === "Place" &&
      item.country.toLocaleLowerCase() ===
        trip.destinationCountry.toLocaleLowerCase()
  ).length;
  const routePlanned = savedItems.some(
    (item) =>
      item.category === "Route" &&
      item.country.toLocaleLowerCase() ===
        trip.destinationCountry.toLocaleLowerCase()
  );
  const tripId = trip.id;
  const tripName = trip.destinationCity;

  function confirmDelete() {
    Alert.alert(
      "Delete trip?",
      `${tripName} will be removed. Saved flights will remain available as standalone travel cards.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteTrip(tripId);
            navigation.goBack();
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StackScreenHeader
        eyebrow="UPCOMING TRIP"
        title={trip.destinationCity}
        onBack={navigation.goBack}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroTitleArea}>
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
          {trip.notes && <Text style={styles.notes}>{trip.notes}</Text>}

          <View style={styles.facts}>
            <Fact
              icon="airplane-outline"
              value={tripFlights.length}
              label={tripFlights.length === 1 ? "Flight" : "Flights"}
            />
            <Fact icon="bookmark-outline" value={savedPlacesCount} label="Places" />
            <Fact
              icon="map-outline"
              value={routePlanned ? "Yes" : "No"}
              label="Route"
            />
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Flights</Text>
          <TouchableOpacity
            style={styles.addSmallButton}
            onPress={() => navigation.navigate("AddFlight", { tripId })}
            accessibilityRole="button"
            accessibilityLabel="Add flight to trip"
          >
            <Ionicons name="add" size={15} color="#765FD2" />
            <Text style={styles.addSmallText}>Add flight</Text>
          </TouchableOpacity>
        </View>

        {tripFlights.length === 0 ? (
          <TouchableOpacity
            style={styles.noFlights}
            onPress={() => navigation.navigate("AddFlight", { tripId })}
          >
            <Ionicons name="airplane-outline" size={22} color="#8D8493" />
            <Text style={styles.noFlightsText}>
              No flights saved for this trip. Add one when you are ready.
            </Text>
          </TouchableOpacity>
        ) : (
          tripFlights.map((flight) => (
            <BoardingPassCard
              key={flight.id}
              flight={flight}
              onPress={() =>
                navigation.navigate("FlightDetail", { flightId: flight.id })
              }
            />
          ))
        )}

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate("AddTrip", { tripId })}
          accessibilityRole="button"
          accessibilityLabel="Edit trip"
        >
          <Ionicons name="pencil-outline" size={17} color="#FFFFFF" />
          <Text style={styles.editText}>Edit trip</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={confirmDelete}
          accessibilityRole="button"
          accessibilityLabel="Delete trip"
        >
          <Ionicons name="trash-outline" size={17} color="#B94E55" />
          <Text style={styles.deleteText}>Delete trip</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function Fact({
  icon,
  value,
  label,
}: {
  icon: IconName;
  value: string | number;
  label: string;
}) {
  return (
    <View style={styles.fact}>
      <Ionicons name={icon} size={16} color="#765FD2" />
      <Text style={styles.factValue}>{value}</Text>
      <Text style={styles.factLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8F7FC" },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 42 },
  heroCard: { borderRadius: 23, borderWidth: 1, borderColor: "#E5DFF4", padding: 18, backgroundColor: "#FFFFFF" },
  heroHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  heroTitleArea: { flex: 1, paddingRight: 10 },
  city: { fontSize: 28, fontWeight: "700", color: "#111111" },
  country: { marginTop: 3, fontSize: 13, color: "#777077" },
  status: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: "#F0F0F0" },
  statusBooked: { backgroundColor: "#E9E3FF" },
  statusText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.8, color: "#777777" },
  statusTextBooked: { color: "#765FD2" },
  dates: { marginTop: 17, fontSize: 16, fontWeight: "700", color: "#392C68" },
  notes: { marginTop: 12, borderRadius: 13, padding: 11, fontSize: 12, lineHeight: 18, color: "#6F6774", backgroundColor: "#F7F4FF" },
  facts: { marginTop: 18, paddingTop: 15, borderTopWidth: 1, borderTopColor: "#ECE8F5", flexDirection: "row" },
  fact: { flex: 1, alignItems: "center" },
  factValue: { marginTop: 5, fontSize: 17, fontWeight: "700", color: "#111111" },
  factLabel: { marginTop: 2, fontSize: 9, color: "#888188" },
  sectionHeader: { marginTop: 28, marginBottom: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111111" },
  addSmallButton: { minHeight: 34, borderRadius: 17, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EEE9FF" },
  addSmallText: { fontSize: 11, fontWeight: "700", color: "#765FD2" },
  noFlights: { borderRadius: 18, borderWidth: 1, borderColor: "#E4DFE9", padding: 16, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFFFFF" },
  noFlightsText: { flex: 1, fontSize: 11, lineHeight: 17, color: "#777077" },
  editButton: { height: 51, marginTop: 20, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#111111" },
  editText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  deleteButton: { height: 49, marginTop: 10, borderRadius: 16, borderWidth: 1, borderColor: "#E7CDD0", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FFF9F9" },
  deleteText: { fontSize: 13, fontWeight: "700", color: "#B94E55" },
  notFound: { flex: 1, paddingHorizontal: 40, alignItems: "center", justifyContent: "center" },
  notFoundTitle: { marginTop: 13, fontSize: 20, fontWeight: "700", color: "#111111" },
  notFoundText: { marginTop: 7, textAlign: "center", fontSize: 12, color: "#777077" },
});
