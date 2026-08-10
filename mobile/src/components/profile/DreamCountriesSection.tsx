import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTravelData } from "../../context/TravelDataContext";
import { getCountryFlagEmoji } from "../../data/travelCatalog";
import ProfileSectionHeader from "./ProfileSectionHeader";

const FLAG_PREVIEW_LIMIT = 5;

export default function DreamCountriesSection() {
  const { dreamCountries, addDreamCountry, removeDreamCountry } =
    useTravelData();
  const [visible, setVisible] = useState(false);
  const [listVisible, setListVisible] = useState(false);
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
      <View style={styles.compactCard}>
        {dreamCountries.length === 0 ? (
          <View style={styles.emptyPreview}>
            <View style={styles.emptyIcon}>
              <Ionicons name="flag-outline" size={20} color="#765FD2" />
            </View>
            <View style={styles.previewCopy}>
              <Text style={styles.previewTitle}>No dream countries yet</Text>
              <Text style={styles.previewSubtitle}>
                Keep the places you would love to visit here.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.previewRow}>
            <View style={styles.flagStack}>
              {dreamCountries
                .slice(0, FLAG_PREVIEW_LIMIT)
                .map((country, index) => (
                  <View
                    key={country.id}
                    style={[
                      styles.flagBubble,
                      index > 0 && styles.flagBubbleOverlapping,
                    ]}
                  >
                    <Text style={styles.flagEmoji}>
                      {getCountryFlagEmoji(country.countryName)}
                    </Text>
                  </View>
                ))}
              {dreamCountries.length > FLAG_PREVIEW_LIMIT && (
                <View style={[styles.flagBubble, styles.flagBubbleOverlapping]}>
                  <Text style={styles.moreFlagsText}>
                    +{dreamCountries.length - FLAG_PREVIEW_LIMIT}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.previewCopy}>
              <Text style={styles.previewTitle}>
                {dreamCountries.length === 1
                  ? "1 country in your dream list"
                  : `${dreamCountries.length} countries in your dream list`}
              </Text>
              <Text style={styles.previewSubtitle} numberOfLines={1}>
                {dreamCountries
                  .slice(0, 3)
                  .map((country) => country.countryName)
                  .join(" · ")}
                {dreamCountries.length > 3 ? ` · +${dreamCountries.length - 3}` : ""}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.compactActions}>
          {dreamCountries.length > 0 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => setListVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="View all dream countries"
            >
              <Text style={styles.viewAllText}>View all</Text>
              <Ionicons name="chevron-forward" size={15} color="#765FD2" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setVisible(true)}
            accessibilityRole="button"
            accessibilityLabel="Add dream country"
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add country</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={listVisible}
        transparent
        animationType="slide"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setListVisible(false)}
      >
        <View style={styles.modalRoot}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={() => setListVisible(false)}
            accessibilityRole="button"
            accessibilityLabel="Close dream countries list"
          />
          <SafeAreaView style={styles.listSheet} edges={["bottom"]}>
            <View style={styles.handle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Dream countries</Text>
                <Text style={styles.modalSubtitle}>
                  {dreamCountries.length} saved
                </Text>
              </View>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setListVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Ionicons name="close" size={21} color="#111111" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.countryScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.countryList}
            >
              {dreamCountries.map((country) => (
                <View key={country.id} style={styles.countryRow}>
                  <View style={styles.countryFlag}>
                    <Text style={styles.countryFlagEmoji}>
                      {getCountryFlagEmoji(country.countryName)}
                    </Text>
                  </View>
                  <Text style={styles.countryName} numberOfLines={1}>
                    {country.countryName}
                  </Text>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeDreamCountry(country.id)}
                    accessibilityRole="button"
                    accessibilityLabel={`Remove ${country.countryName}`}
                  >
                    <Ionicons name="trash-outline" size={17} color="#B5535B" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

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
  compactCard: { borderRadius: 20, borderWidth: 1, borderColor: "#E5E0ED", overflow: "hidden", backgroundColor: "#FBFAFE" },
  previewRow: { minHeight: 76, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" },
  emptyPreview: { minHeight: 76, paddingHorizontal: 14, flexDirection: "row", alignItems: "center" },
  emptyIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#EEE9FF" },
  flagStack: { flexDirection: "row", alignItems: "center" },
  flagBubble: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center", backgroundColor: "#F0ECF7" },
  flagBubbleOverlapping: { marginLeft: -10 },
  flagEmoji: { fontSize: 20 },
  moreFlagsText: { fontSize: 9, fontWeight: "800", color: "#6651B1" },
  previewCopy: { flex: 1, marginLeft: 12 },
  previewTitle: { fontSize: 12, fontWeight: "700", color: "#302A34" },
  previewSubtitle: { marginTop: 4, fontSize: 9, lineHeight: 13, color: "#817986" },
  compactActions: { minHeight: 51, borderTopWidth: 1, borderTopColor: "#EAE6EF", paddingHorizontal: 11, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", backgroundColor: "#FFFFFF" },
  viewAllButton: { minHeight: 35, borderRadius: 13, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 2 },
  viewAllText: { fontSize: 11, fontWeight: "700", color: "#765FD2" },
  addButton: { minHeight: 36, marginLeft: 7, borderRadius: 14, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#171419" },
  addButtonText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },
  listSheet: { maxHeight: "78%", minHeight: 280, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, backgroundColor: "#FFFFFF" },
  countryScroll: { flexShrink: 1 },
  countryList: { paddingTop: 15, paddingBottom: 16 },
  countryRow: { minHeight: 61, borderBottomWidth: 1, borderBottomColor: "#EEEAF1", flexDirection: "row", alignItems: "center" },
  countryFlag: { width: 39, height: 39, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#F1EDF7" },
  countryFlagEmoji: { fontSize: 21 },
  countryName: { flex: 1, marginLeft: 11, fontSize: 13, fontWeight: "700", color: "#302A34" },
  removeButton: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF3F3" },
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
