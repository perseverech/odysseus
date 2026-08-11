import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type KeyboardTypeOptions,
} from "react-native";

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import StackScreenHeader from "../components/profile/StackScreenHeader";
import { useTravelData } from "../context/TravelDataContext";
import type { ProfileStackParamList } from "../navigation/navigationTypes";
import { placeTripMismatchMessage } from "../utils/placeCompatibility";

type Props = NativeStackScreenProps<ProfileStackParamList, "AddCustomPlace">;

type FormState = {
  name: string;
  city: string;
  country: string;
  address: string;
  category: string;
  visitMinutes: string;
  price: string;
  currency: string;
  isFree: boolean;
  openingHours: string;
  latitude: string;
  longitude: string;
  notes: string;
};

const initialForm: FormState = {
  name: "",
  city: "",
  country: "",
  address: "",
  category: "place",
  visitMinutes: "90",
  price: "",
  currency: "EUR",
  isFree: false,
  openingHours: "",
  latitude: "",
  longitude: "",
  notes: "",
};

export default function AddCustomPlaceScreen({ route, navigation }: Props) {
  const { trips, addCustomPlace, setTripSelectedPlaceIds } = useTravelData();
  const trip = trips.find((item) => item.id === route.params.tripId);
  const [form, setForm] = useState<FormState>(() => ({
    ...initialForm,
    city: trip?.destinationCity ?? "",
    country: trip?.destinationCountry ?? "",
  }));
  const [error, setError] = useState<string | null>(null);

  function update<Key extends keyof FormState>(field: Key, value: FormState[Key]) {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function save() {
    if (!trip) {
      setError("The trip is no longer available.");
      return;
    }

    const visitMinutes = Number(form.visitMinutes);
    const price =
      form.isFree || !form.price.trim()
        ? undefined
        : Number(form.price.replace(",", "."));
    const latitude = form.latitude.trim() ? Number(form.latitude) : undefined;
    const longitude = form.longitude.trim() ? Number(form.longitude) : undefined;

    if (!form.name.trim() || !form.city.trim() || !form.country.trim()) {
      setError("Name, city and country are required.");
      return;
    }

    const mismatchMessage = placeTripMismatchMessage(form, trip);
    if (mismatchMessage) {
      setError(mismatchMessage);
      return;
    }

    if (!Number.isFinite(visitMinutes) || visitMinutes < 15) {
      setError("Visit duration must be at least 15 minutes.");
      return;
    }

    if (price !== undefined && (!Number.isFinite(price) || price < 0)) {
      setError("Enter a valid price or leave it empty.");
      return;
    }

    if (
      (latitude !== undefined && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) ||
      (longitude !== undefined && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180))
    ) {
      setError("Coordinates are outside the valid range.");
      return;
    }

    const place = addCustomPlace({
      name: form.name,
      city: form.city,
      country: form.country,
      address: form.address,
      category: form.category || "place",
      estimatedVisitMinutes: visitMinutes,
      price,
      currency: form.currency || "EUR",
      isFree: form.isFree,
      openingHours: form.openingHours.trim()
        ? { summary: form.openingHours.trim() }
        : undefined,
      latitude,
      longitude,
      notes: form.notes,
    });

    setTripSelectedPlaceIds(trip.id, [...trip.selectedPlaceIds, place.id]);
    navigation.goBack();
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StackScreenHeader
        eyebrow="MANUAL PLACE"
        title="Add place"
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
            Coordinates are optional. Add them when you want the place to appear
            on the route map and improve travel-time estimates.
          </Text>
          <Field label="Place name" value={form.name} onChangeText={(value) => update("name", value)} placeholder="Small coffee shop" autoFocus />
          <View style={styles.row}>
            <View style={styles.rowField}><Field label="City" value={form.city} onChangeText={(value) => update("city", value)} placeholder="Barcelona" /></View>
            <View style={styles.rowField}><Field label="Country" value={form.country} onChangeText={(value) => update("country", value)} placeholder="Spain" /></View>
          </View>
          <Field label="Address / location · Optional" value={form.address} onChangeText={(value) => update("address", value)} placeholder="Sultan Ahmet, Ayasofya Meydanı" />
          <Field label="Category" value={form.category} onChangeText={(value) => update("category", value)} placeholder="Food, museum, viewpoint…" />
          <View style={styles.row}>
            <View style={styles.rowField}><Field label="Estimated visit · minutes" value={form.visitMinutes} onChangeText={(value) => update("visitMinutes", value)} placeholder="90" keyboardType="number-pad" /></View>
          </View>
          <TouchableOpacity
            style={styles.freeToggle}
            onPress={() => update("isFree", !form.isFree)}
            accessibilityRole="switch"
            accessibilityState={{ checked: form.isFree }}
          >
            <View style={[styles.toggleTrack, form.isFree && styles.toggleTrackActive]}>
              <View style={[styles.toggleThumb, form.isFree && styles.toggleThumbActive]} />
            </View>
            <View style={styles.freeToggleBody}>
              <Text style={styles.freeToggleTitle}>Free place</Text>
              <Text style={styles.freeToggleText}>No admission cost</Text>
            </View>
          </TouchableOpacity>
          {!form.isFree && (
            <View style={styles.row}>
              <View style={styles.rowField}><Field label="Price · Optional" value={form.price} onChangeText={(value) => update("price", value)} placeholder="15" keyboardType="decimal-pad" /></View>
              <View style={styles.currencyField}><Field label="Currency" value={form.currency} onChangeText={(value) => update("currency", value.toLocaleUpperCase().slice(0, 3))} placeholder="EUR" maxLength={3} /></View>
            </View>
          )}
          <Field label="Opening hours · Optional" value={form.openingHours} onChangeText={(value) => update("openingHours", value)} placeholder="09:00–18:00 or Open all day" />
          <View style={styles.row}>
            <View style={styles.rowField}><Field label="Latitude · Optional" value={form.latitude} onChangeText={(value) => update("latitude", value)} placeholder="41.3851" keyboardType="numbers-and-punctuation" /></View>
            <View style={styles.rowField}><Field label="Longitude · Optional" value={form.longitude} onChangeText={(value) => update("longitude", value)} placeholder="2.1734" keyboardType="numbers-and-punctuation" /></View>
          </View>
          <Field label="Notes · Optional" value={form.notes} onChangeText={(value) => update("notes", value)} placeholder="Reservation, opening times or reminders" multiline />
          {error && <Text style={styles.error}>{error}</Text>}
          <TouchableOpacity style={styles.saveButton} onPress={save}>
            <Text style={styles.saveText}>Save and select</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType = "default", maxLength = 100, autoFocus, multiline }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: KeyboardTypeOptions; maxLength?: number; autoFocus?: boolean; multiline?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} style={[styles.input, multiline && styles.multiline]} placeholder={placeholder} placeholderTextColor="#A19AA6" keyboardType={keyboardType} maxLength={multiline ? 400 : maxLength} autoFocus={autoFocus} autoCorrect={false} multiline={multiline} textAlignVertical={multiline ? "top" : "center"} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8F7FC" }, flex: { flex: 1 },
  content: { paddingHorizontal: 19, paddingTop: 6, paddingBottom: 40 },
  intro: { marginBottom: 20, fontSize: 12, lineHeight: 18, color: "#746D78" },
  field: { marginBottom: 16 }, label: { marginBottom: 7, fontSize: 11, fontWeight: "600", color: "#5F5863" },
  input: { height: 49, borderRadius: 15, borderWidth: 1, borderColor: "#DFDAE5", paddingHorizontal: 13, fontSize: 14, color: "#111111", backgroundColor: "#FFFFFF" },
  multiline: { height: 92, paddingTop: 12, paddingBottom: 12 }, row: { flexDirection: "row", gap: 8 }, rowField: { flex: 1 }, currencyField: { width: 78 },
  freeToggle: { minHeight: 61, marginBottom: 16, borderRadius: 16, borderWidth: 1, borderColor: "#DFDAE5", paddingHorizontal: 13, flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF" },
  toggleTrack: { width: 42, height: 24, borderRadius: 12, padding: 2, justifyContent: "center", backgroundColor: "#D8D4DC" },
  toggleTrackActive: { backgroundColor: "#765FD2" },
  toggleThumb: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#FFFFFF" },
  toggleThumbActive: { alignSelf: "flex-end" },
  freeToggleBody: { marginLeft: 11 },
  freeToggleTitle: { fontSize: 12, fontWeight: "700", color: "#302A34" },
  freeToggleText: { marginTop: 2, fontSize: 10, color: "#867E8A" },
  error: { marginBottom: 12, fontSize: 12, lineHeight: 17, color: "#C75353" },
  saveButton: { height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#111111" },
  saveText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
});
