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
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import StackScreenHeader from "../components/profile/StackScreenHeader";
import TripRoutePlanner from "../components/trip-planner/TripRoutePlanner";
import { useTravelData } from "../context/TravelDataContext";
import { usePlacesCatalog } from "../hooks/usePlacesCatalog";
import type { Flight } from "../models/travel";
import type {
  ProfileStackParamList,
  RootTabParamList,
} from "../navigation/navigationTypes";
import { formatTravelDate, formatTripDateRange } from "../utils/travelDates";
import {
  formatTripMoney,
  getTripDayCount,
} from "../utils/tripFormatting";

type Props = NativeStackScreenProps<ProfileStackParamList, "TripDetail">;
type IconName = React.ComponentProps<typeof Ionicons>["name"];

export default function TripDetailScreen({ route, navigation }: Props) {
  const {
    trips,
    flights,
    customPlaces,
    livePlaces,
    deleteTrip,
    setTripRoutePlan,
    setTripPriorityPlaceIds,
  } = useTravelData();
  const trip = trips.find((item) => item.id === route.params.tripId);
  const { places: allPlaces } = usePlacesCatalog(customPlaces, livePlaces);

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
    (flight) => flight.tripId === trip.id || trip.flightIds.includes(flight.id)
  );
  const tripId = trip.id;
  const tripName = trip.destinationCity;
  const tripDayCount = getTripDayCount(trip.startDate, trip.endDate);
  const savedPlaceCount = allPlaces.filter((place) =>
    trip.selectedPlaceIds.includes(place.id)
  ).length;

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
        eyebrow="TRIP PLANNER"
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
                trip.status === "completed" && styles.statusCompleted,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  trip.status === "booked" && styles.statusTextBooked,
                  trip.status === "completed" && styles.statusTextCompleted,
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
              icon="calendar-outline"
              value={tripDayCount}
              label={tripDayCount === 1 ? "Day" : "Days"}
            />
            <Fact
              icon="wallet-outline"
              value={
                trip.budget === undefined
                  ? "—"
                  : formatTripMoney(trip.budget, trip.currency)
              }
              label="Budget"
            />
            <Fact
              icon="bookmark-outline"
              value={savedPlaceCount}
              label="Saved places"
            />
          </View>
        </View>

        <TripRoutePlanner
          trip={trip}
          places={allPlaces}
          onOpenPlaces={() => navigation.navigate("TripPlaces", { tripId })}
          onBrowseDiscover={() =>
            navigation
              .getParent<BottomTabNavigationProp<RootTabParamList>>()
              ?.navigate("Discover", { screen: "DiscoverMain" })
          }
          onAddManualPlace={() =>
            navigation.navigate("AddCustomPlace", { tripId })
          }
          onSaveRoute={(
            days,
            unscheduledPlaceIds,
            unscheduledPlaceReasons
          ) =>
            setTripRoutePlan(
              tripId,
              days,
              unscheduledPlaceIds,
              unscheduledPlaceReasons
            )
          }
          onSetPriorityPlaces={(placeIds) =>
            setTripPriorityPlaceIds(tripId, placeIds)
          }
        />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {tripFlights.length === 1 ? "Flight" : "Flights"}
          </Text>
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
            <TripFlightCard
              key={flight.id}
              flight={flight}
              onPress={() =>
                navigation.navigate("FlightDetail", { flightId: flight.id })
              }
            />
          ))
        )}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <TouchableOpacity
            style={styles.addSmallButton}
            onPress={() => navigation.navigate("AddTrip", { tripId })}
          >
            <Ionicons name="pencil-outline" size={14} color="#765FD2" />
            <Text style={styles.addSmallText}>Edit</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          style={styles.notesCard}
          activeOpacity={0.82}
          onPress={() => navigation.navigate("AddTrip", { tripId })}
        >
          <Ionicons
            name={trip.notes ? "document-text-outline" : "add-circle-outline"}
            size={20}
            color="#765FD2"
          />
          <Text style={[styles.notesText, !trip.notes && styles.notesPlaceholder]}>
            {trip.notes || "Add notes, reservations or reminders for this trip."}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate("AddTrip", { tripId })}
          accessibilityRole="button"
          accessibilityLabel="Edit trip settings"
        >
          <Ionicons name="options-outline" size={17} color="#FFFFFF" />
          <Text style={styles.editText}>Edit trip settings</Text>
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

function TripFlightCard({
  flight,
  onPress,
}: {
  flight: Flight;
  onPress: () => void;
}) {
  const flightLabel = [flight.airline, flight.flightNumber]
    .filter(Boolean)
    .join(" · ");

  return (
    <TouchableOpacity
      style={styles.flightCard}
      activeOpacity={0.84}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`View ${flight.departureIata} to ${flight.arrivalIata} boarding pass`}
    >
      <View style={styles.flightIcon}>
        <Ionicons name="airplane" size={19} color="#765FD2" />
      </View>
      <View style={styles.flightBody}>
        <Text style={styles.flightRoute}>
          {flight.departureIata} → {flight.arrivalIata}
        </Text>
        <Text style={styles.flightMeta}>
          {formatTravelDate(flight.departureDate)}
          {flightLabel ? ` · ${flightLabel}` : ""}
        </Text>
        <Text style={styles.boardingPassLink}>View boarding pass</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#928A97" />
    </TouchableOpacity>
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
  city: { fontSize: 28, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase", color: "#111111" },
  country: { marginTop: 3, fontSize: 13, color: "#777077" },
  status: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 6, backgroundColor: "#F0F0F0" },
  statusBooked: { backgroundColor: "#E9E3FF" },
  statusCompleted: { backgroundColor: "#E3F2EA" },
  statusText: { fontSize: 8, fontWeight: "700", letterSpacing: 0.7, color: "#777777" },
  statusTextBooked: { color: "#765FD2" },
  statusTextCompleted: { color: "#3E7C5A" },
  dates: { marginTop: 17, fontSize: 16, fontWeight: "700", color: "#392C68" },
  facts: { marginTop: 18, paddingTop: 15, borderTopWidth: 1, borderTopColor: "#ECE8F5", flexDirection: "row" },
  fact: { flex: 1, alignItems: "center" },
  factValue: { marginTop: 5, fontSize: 17, fontWeight: "700", color: "#111111" },
  factLabel: { marginTop: 2, fontSize: 9, color: "#888188" },
  sectionHeader: { marginTop: 31, marginBottom: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#111111" },
  addSmallButton: { minHeight: 34, borderRadius: 17, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EEE9FF" },
  addSmallText: { fontSize: 11, fontWeight: "700", color: "#765FD2" },
  noFlights: { borderRadius: 18, borderWidth: 1, borderColor: "#E4DFE9", padding: 16, flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFFFFF" },
  noFlightsText: { flex: 1, fontSize: 11, lineHeight: 17, color: "#777077" },
  flightCard: { minHeight: 104, marginBottom: 10, borderRadius: 20, borderWidth: 1, borderColor: "#DDD6EA", padding: 14, flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF" },
  flightIcon: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#EEE9FF" },
  flightBody: { flex: 1, marginLeft: 12, paddingRight: 8 },
  flightRoute: { fontSize: 18, fontWeight: "800", letterSpacing: 1, color: "#171419" },
  flightMeta: { marginTop: 4, fontSize: 10, color: "#7C7480" },
  boardingPassLink: { marginTop: 8, fontSize: 11, fontWeight: "700", color: "#765FD2" },
  notesCard: { minHeight: 72, borderRadius: 18, borderWidth: 1, borderColor: "#E2DCE8", padding: 14, flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#FFFFFF" },
  notesText: { flex: 1, fontSize: 12, lineHeight: 18, color: "#5F5863" },
  notesPlaceholder: { color: "#918A95" },
  editButton: { height: 51, marginTop: 24, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#111111" },
  editText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  deleteButton: { height: 49, marginTop: 10, borderRadius: 16, borderWidth: 1, borderColor: "#E7CDD0", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#FFF9F9" },
  deleteText: { fontSize: 13, fontWeight: "700", color: "#B94E55" },
  notFound: { flex: 1, paddingHorizontal: 40, alignItems: "center", justifyContent: "center" },
  notFoundTitle: { marginTop: 13, fontSize: 20, fontWeight: "700", color: "#111111" },
  notFoundText: { marginTop: 7, textAlign: "center", fontSize: 12, color: "#777077" },
});
