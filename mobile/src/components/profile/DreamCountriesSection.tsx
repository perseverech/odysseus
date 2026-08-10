import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTravelData } from "../../context/TravelDataContext";
import ProfileSectionHeader from "./ProfileSectionHeader";

export default function DreamCountriesSection() {
  const { dreamCountries, addDreamCountry, removeDreamCountry } =
    useTravelData();
  const [visible, setVisible] = useState(false);
  const [countryName, setCountryName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function close() {
    setVisible(false);
    setCountryName("");
    setError(null);
  }

  function save() {
    const result = addDreamCountry(countryName);

    if (result === "invalid") {
      setError("Enter a country name.");
      return;
    }
    if (result === "duplicate") {
      setError("This country is already in your dream list.");
      return;
    }
    if (result === "visited") {
      setError("This country is already marked as visited.");
      return;
    }

    close();
  }

  return (
    <>
      <ProfileSectionHeader title="Dream countries" count={dreamCountries.length} />
      <View style={styles.grid}>
        {dreamCountries.map((country) => (
          <View key={country.id} style={styles.chip}>
            <Text style={styles.countryName} numberOfLines={1}>
              {country.countryName}
            </Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeDreamCountry(country.id)}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${country.countryName}`}
            >
              <Ionicons name="close" size={14} color="#765FD2" />
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={styles.addChip}
          onPress={() => setVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Add dream country"
        >
          <Ionicons name="add" size={16} color="#111111" />
          <Text style={styles.addText}>Add</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={close}
      >
        <View style={styles.modalRoot}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={close}
            accessibilityRole="button"
            accessibilityLabel="Close dream country form"
          />
          <KeyboardAvoidingView
            style={styles.keyboardArea}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            pointerEvents="box-none"
          >
            <SafeAreaView style={styles.sheet} edges={["bottom"]}>
              <View style={styles.handle} />
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Add dream country</Text>
                  <Text style={styles.modalSubtitle}>
                    Where would you love to go?
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={close}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={21} color="#111111" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Country</Text>
              <TextInput
                value={countryName}
                onChangeText={(value) => {
                  setCountryName(value);
                  setError(null);
                }}
                style={[styles.input, error && styles.inputError]}
                placeholder="e.g. Portugal"
                placeholderTextColor="#A0A0A0"
                autoFocus
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={save}
              />
              {error && <Text style={styles.error}>{error}</Text>}

              <TouchableOpacity
                style={[
                  styles.saveButton,
                  !countryName.trim() && styles.saveButtonDisabled,
                ]}
                onPress={save}
                disabled={!countryName.trim()}
                accessibilityRole="button"
                accessibilityLabel="Save dream country"
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    maxWidth: "100%",
    minHeight: 37,
    borderRadius: 19,
    paddingLeft: 13,
    paddingRight: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEE9FF",
  },
  countryName: { maxWidth: 145, fontSize: 12, fontWeight: "600", color: "#392C68" },
  removeButton: {
    width: 27,
    height: 27,
    marginLeft: 4,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  addChip: {
    minHeight: 37,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
  },
  addText: { fontSize: 12, fontWeight: "600", color: "#111111" },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(17,17,17,0.38)" },
  keyboardArea: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  handle: {
    width: 38,
    height: 4,
    marginBottom: 18,
    alignSelf: "center",
    borderRadius: 2,
    backgroundColor: "#D8D8D8",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between" },
  modalTitle: { fontSize: 22, fontWeight: "700", color: "#111111" },
  modalSubtitle: { marginTop: 4, fontSize: 13, color: "#777777" },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F3F3",
  },
  inputLabel: { marginTop: 23, marginBottom: 7, fontSize: 12, fontWeight: "600", color: "#555555" },
  input: {
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DEDEDE",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#111111",
    backgroundColor: "#F8F8F8",
  },
  inputError: { borderColor: "#C75353" },
  error: { marginTop: 8, fontSize: 12, color: "#C75353" },
  saveButton: {
    height: 51,
    marginTop: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111111",
  },
  saveButtonDisabled: { opacity: 0.35 },
  saveText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
