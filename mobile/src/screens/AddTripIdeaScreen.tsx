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
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import FriendsStackHeader from "../components/friends/FriendsStackHeader";
import { useFriends } from "../context/FriendsContext";
import type { FriendsStackParamList } from "../navigation/navigationTypes";

type Props = NativeStackScreenProps<
  FriendsStackParamList,
  "AddPlaceToSharedTrip"
>;

export default function AddTripIdeaScreen({ route, navigation }: Props) {
  const { sharedTrips, addTripIdea } = useFriends();
  const trip = sharedTrips.find((item) => item.id === route.params.tripId);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!trip || !title.trim()) {
      setError("Enter a place name.");
      return;
    }

    addTripIdea(trip.id, { title, location, category });
    navigation.goBack();
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <FriendsStackHeader title="Trip not found" onBack={navigation.goBack} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>
            This shared trip is no longer available.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <FriendsStackHeader
        eyebrow="SHARED TRIP IDEA"
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
          <View style={styles.tripContext}>
            <View style={styles.tripIcon}>
              <Ionicons name="paper-plane-outline" size={18} color="#765FD2" />
            </View>
            <View>
              <Text style={styles.contextLabel}>ADDING TO</Text>
              <Text style={styles.contextTrip}>{trip.title}</Text>
            </View>
          </View>

          <FormField
            label="Place name"
            value={title}
            onChangeText={(value) => {
              setTitle(value);
              setError(null);
            }}
            placeholder="Hagia Sophia"
            autoFocus
          />
          <FormField
            label="Location"
            value={location}
            onChangeText={setLocation}
            placeholder="Sultanahmet"
            optional
          />
          <FormField
            label="Category"
            value={category}
            onChangeText={setCategory}
            placeholder="Historic site"
            optional
          />

          {error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            style={[styles.saveButton, !title.trim() && styles.saveDisabled]}
            activeOpacity={0.82}
            onPress={save}
            disabled={!title.trim()}
            accessibilityRole="button"
            accessibilityLabel="Add place to trip"
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.saveText}>Add to trip</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  optional,
  autoFocus,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  optional?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {optional ? " · Optional" : ""}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#A19AA4"
        autoFocus={autoFocus}
        autoCapitalize="words"
        autoCorrect={false}
        maxLength={100}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9F8FC" },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 9, paddingBottom: 40 },
  tripContext: { marginBottom: 24, borderRadius: 17, borderWidth: 1, borderColor: "#E4DDF4", padding: 13, flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF" },
  tripIcon: { width: 38, height: 38, marginRight: 11, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#EEE9FF" },
  contextLabel: { fontSize: 8, fontWeight: "700", letterSpacing: 1, color: "#948A9B" },
  contextTrip: { marginTop: 4, fontSize: 14, fontWeight: "700", color: "#111111" },
  field: { marginBottom: 17 },
  label: { marginBottom: 7, fontSize: 12, fontWeight: "600", color: "#555055" },
  input: { height: 50, borderRadius: 15, borderWidth: 1, borderColor: "#DEDAE1", paddingHorizontal: 14, fontSize: 15, color: "#111111", backgroundColor: "#FFFFFF" },
  error: { marginBottom: 12, fontSize: 12, color: "#C75353" },
  saveButton: { height: 52, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: "#111111" },
  saveDisabled: { opacity: 0.35 },
  saveText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },
  notFound: { flex: 1, padding: 30, alignItems: "center", justifyContent: "center" },
  notFoundText: { textAlign: "center", fontSize: 13, color: "#777077" },
});
