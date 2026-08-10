import React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import FlightForm from "../components/profile/FlightForm";
import StackScreenHeader from "../components/profile/StackScreenHeader";
import { useTravelData } from "../context/TravelDataContext";
import type { CreateFlightInput } from "../models/travel";
import type { ProfileStackParamList } from "../navigation/navigationTypes";

type Props = NativeStackScreenProps<ProfileStackParamList, "AddFlight">;

export default function AddFlightScreen({ navigation, route }: Props) {
  const { flights, trips, addFlight, updateFlight } = useTravelData();
  const flightId = route.params?.flightId;
  const initialFlight = flightId
    ? flights.find((flight) => flight.id === flightId)
    : undefined;
  const linkedTripId = initialFlight?.tripId ?? route.params?.tripId;
  const linkedTrip = linkedTripId
    ? trips.find((trip) => trip.id === linkedTripId)
    : undefined;

  function save(input: CreateFlightInput) {
    if (initialFlight) {
      updateFlight(initialFlight.id, input);
      navigation.goBack();
      return;
    }

    const flight = addFlight(input);
    navigation.replace("FlightDetail", { flightId: flight.id });
  }

  if (flightId && !initialFlight) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StackScreenHeader title="Flight not found" onBack={navigation.goBack} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>
            This flight is no longer available in your travel data.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StackScreenHeader
        eyebrow="SAVED TRAVEL INFO"
        title={initialFlight ? "Edit flight" : "Add flight"}
        onBack={navigation.goBack}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.content}
        >
          <Text style={styles.intro}>
            {initialFlight
              ? "Update the information shown on your digital travel card."
              : linkedTrip
                ? `Save this flight to ${linkedTrip.destinationCity}.`
                : "Store the flight details you want close at hand."}
          </Text>
          <FlightForm
            initialFlight={initialFlight}
            linkedTrip={linkedTrip}
            submitLabel={initialFlight ? "Save changes" : "Save flight"}
            onSubmit={save}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8F7FC" },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 },
  intro: { marginBottom: 23, fontSize: 13, lineHeight: 19, color: "#777077" },
  notFound: { flex: 1, padding: 30, alignItems: "center", justifyContent: "center" },
  notFoundText: { textAlign: "center", fontSize: 13, color: "#777077" },
});
