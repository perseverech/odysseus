import React from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import StackScreenHeader from "../components/profile/StackScreenHeader";
import TripForm from "../components/profile/TripForm";
import { useTravelData } from "../context/TravelDataContext";
import { placeCatalog } from "../data/placeCatalog";
import type { CreateTripInput } from "../models/travel";
import type { ProfileStackParamList } from "../navigation/navigationTypes";
import { placeTripMismatchMessage } from "../utils/placeCompatibility";

type Props = NativeStackScreenProps<ProfileStackParamList, "AddTrip">;

export default function AddTripScreen({ navigation, route }: Props) {
  const {
    trips,
    customPlaces,
    livePlaces,
    addTrip,
    updateTrip,
    setTripSelectedPlaceIds,
  } = useTravelData();
  const tripId = route.params?.tripId;
  const initialPlaceId = route.params?.initialPlaceId;
  const initialPlace = initialPlaceId
    ? [...placeCatalog, ...customPlaces, ...livePlaces].find(
        (place) => place.id === initialPlaceId
      )
    : undefined;
  const existingTrip = tripId
    ? trips.find((trip) => trip.id === tripId)
    : undefined;

  function save(input: CreateTripInput) {
    if (existingTrip) {
      updateTrip(existingTrip.id, input);
      navigation.goBack();
      return;
    }

    if (initialPlace) {
      const mismatchMessage = placeTripMismatchMessage(initialPlace, input);

      if (mismatchMessage) {
        Alert.alert(
          "Different destination",
          `${initialPlace.name} is in ${initialPlace.city}, ${initialPlace.country}. ${mismatchMessage}`
        );
        return;
      }
    }

    const trip = addTrip(input);

    if (initialPlaceId) {
      setTripSelectedPlaceIds(trip.id, [initialPlaceId]);
    }

    navigation.replace("TripDetail", { tripId: trip.id });
  }

  if (tripId && !existingTrip) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StackScreenHeader title="Trip not found" onBack={navigation.goBack} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>
            This trip is no longer available in your travel data.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StackScreenHeader
        eyebrow="TRAVEL PLANNER"
        title={existingTrip ? "Edit trip" : "Create trip"}
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
            {existingTrip
              ? "Update the details and preferences for this journey."
              : "Start with the essentials. Everything except destination and dates can be adjusted later."}
          </Text>
          <TripForm
            initialTrip={existingTrip}
            submitLabel={existingTrip ? "Save changes" : "Create trip"}
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
