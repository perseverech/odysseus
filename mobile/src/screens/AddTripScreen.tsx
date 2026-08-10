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

import StackScreenHeader from "../components/profile/StackScreenHeader";
import TripForm from "../components/profile/TripForm";
import { useTravelData } from "../context/TravelDataContext";
import type { CreateTripInput } from "../models/travel";
import type { ProfileStackParamList } from "../navigation/navigationTypes";

type Props = NativeStackScreenProps<ProfileStackParamList, "AddTrip">;

export default function AddTripScreen({ navigation, route }: Props) {
  const { trips, addTrip, updateTrip } = useTravelData();
  const tripId = route.params?.tripId;
  const existingTrip = tripId
    ? trips.find((trip) => trip.id === tripId)
    : undefined;

  function save(input: CreateTripInput) {
    if (existingTrip) {
      updateTrip(existingTrip.id, input);
      navigation.goBack();
      return;
    }

    const trip = addTrip(input);
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
        title={existingTrip ? "Edit trip" : "Add trip"}
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
              ? "Update the essentials for this journey."
              : "Keep dates, plans and flights together in one place."}
          </Text>
          <TripForm
            initialTrip={existingTrip}
            submitLabel={existingTrip ? "Save changes" : "Save trip"}
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
