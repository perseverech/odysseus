import React, { useState } from "react";
import {
  Alert,
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

import StackScreenHeader from "../components/profile/StackScreenHeader";
import { useTravelData } from "../context/TravelDataContext";
import type { PackingCategory } from "../models/travel";
import type { ProfileStackParamList } from "../navigation/navigationTypes";

type Props = NativeStackScreenProps<
  ProfileStackParamList,
  "PackingChecklist"
>;

const CATEGORY_ORDER: PackingCategory[] = [
  "documents",
  "essentials",
  "clothing",
  "health",
  "tech",
  "other",
];

const CATEGORY_META: Record<
  PackingCategory,
  { label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }
> = {
  documents: { label: "Documents", icon: "document-text-outline" },
  essentials: { label: "Essentials", icon: "key-outline" },
  clothing: { label: "Clothing", icon: "shirt-outline" },
  health: { label: "Health & care", icon: "medical-outline" },
  tech: { label: "Tech", icon: "phone-portrait-outline" },
  other: { label: "My items", icon: "add-circle-outline" },
};

export default function PackingChecklistScreen({ route, navigation }: Props) {
  const {
    trips,
    toggleTripPackingItem,
    addTripPackingItem,
    deleteTripPackingItem,
    resetTripPackingChecklist,
  } = useTravelData();
  const [newItem, setNewItem] = useState("");
  const trip = trips.find((item) => item.id === route.params.tripId);

  if (!trip) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StackScreenHeader title="Packing list" onBack={navigation.goBack} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Trip not found</Text>
          <Text style={styles.notFoundText}>
            This packing list is no longer available.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const items = trip.packingItems ?? [];
  const tripId = trip.id;
  const destinationCity = trip.destinationCity;
  const packedCount = items.filter((item) => item.isPacked).length;
  const progress = items.length > 0 ? packedCount / items.length : 0;
  const complete = items.length > 0 && packedCount === items.length;

  function addItem() {
    const label = newItem.trim();
    if (!label) return;

    addTripPackingItem(tripId, label);
    setNewItem("");
  }

  function confirmReset() {
    if (packedCount === 0) return;

    Alert.alert(
      "Clear all checks?",
      `All ${destinationCity} items will be marked as not packed.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear checks",
          style: "destructive",
          onPress: () => resetTripPackingChecklist(tripId),
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <StackScreenHeader
        eyebrow="PACKING CHECKLIST"
        title={trip.destinationCity}
        onBack={navigation.goBack}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <View style={[styles.progressCard, complete && styles.progressCardComplete]}>
            <View style={styles.progressHeader}>
              <View>
                <Text style={styles.progressEyebrow}>
                  {complete ? "READY TO GO" : "PACKING PROGRESS"}
                </Text>
                <Text style={styles.progressTitle}>
                  {packedCount} of {items.length} packed
                </Text>
              </View>
              <View style={[styles.progressCircle, complete && styles.progressCircleComplete]}>
                <Text style={[styles.progressPercent, complete && styles.progressPercentComplete]}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  complete && styles.progressFillComplete,
                  { width: `${Math.round(progress * 100)}%` },
                ]}
              />
            </View>
            {packedCount > 0 && (
              <TouchableOpacity onPress={confirmReset} style={styles.resetButton}>
                <Ionicons name="refresh-outline" size={14} color="#746B7A" />
                <Text style={styles.resetText}>Clear checks</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.addCard}>
            <Text style={styles.addTitle}>Add your own item</Text>
            <View style={styles.addRow}>
              <TextInput
                value={newItem}
                onChangeText={setNewItem}
                onSubmitEditing={addItem}
                style={styles.input}
                placeholder="Camera, book, umbrella…"
                placeholderTextColor="#9A929D"
                returnKeyType="done"
                maxLength={80}
              />
              <TouchableOpacity
                style={[styles.addButton, !newItem.trim() && styles.addButtonDisabled]}
                onPress={addItem}
                disabled={!newItem.trim()}
                accessibilityRole="button"
                accessibilityLabel="Add packing item"
              >
                <Ionicons name="add" size={21} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {CATEGORY_ORDER.map((category) => {
            const categoryItems = items.filter(
              (item) => item.category === category
            );
            if (categoryItems.length === 0) return null;

            const meta = CATEGORY_META[category];

            return (
              <View key={category} style={styles.section}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionIcon}>
                    <Ionicons name={meta.icon} size={16} color="#765FD2" />
                  </View>
                  <Text style={styles.sectionTitle}>{meta.label}</Text>
                  <Text style={styles.sectionCount}>
                    {categoryItems.filter((item) => item.isPacked).length}/
                    {categoryItems.length}
                  </Text>
                </View>

                <View style={styles.listCard}>
                  {categoryItems.map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        styles.itemRow,
                        index < categoryItems.length - 1 && styles.itemBorder,
                      ]}
                    >
                      <TouchableOpacity
                        style={styles.itemToggle}
                        onPress={() => toggleTripPackingItem(trip.id, item.id)}
                        accessibilityRole="checkbox"
                        accessibilityState={{ checked: item.isPacked }}
                        accessibilityLabel={item.label}
                      >
                        <View style={[styles.checkbox, item.isPacked && styles.checkboxPacked]}>
                          {item.isPacked && (
                            <Ionicons name="checkmark" size={15} color="#FFFFFF" />
                          )}
                        </View>
                        <Text
                          style={[
                            styles.itemLabel,
                            item.isPacked && styles.itemLabelPacked,
                          ]}
                        >
                          {item.label}
                        </Text>
                      </TouchableOpacity>

                      {!item.isDefault && (
                        <TouchableOpacity
                          style={styles.deleteItem}
                          onPress={() => deleteTripPackingItem(trip.id, item.id)}
                          accessibilityRole="button"
                          accessibilityLabel={`Delete ${item.label}`}
                        >
                          <Ionicons name="close" size={17} color="#A49CA7" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            );
          })}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F8F7FC" },
  flex: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 6, paddingBottom: 46 },
  progressCard: { borderRadius: 22, borderWidth: 1, borderColor: "#DED6F3", padding: 17, backgroundColor: "#F2EEFF" },
  progressCardComplete: { borderColor: "#CDE8D7", backgroundColor: "#ECF7F0" },
  progressHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  progressEyebrow: { fontSize: 8, fontWeight: "800", letterSpacing: 1.2, color: "#7D7194" },
  progressTitle: { marginTop: 5, fontSize: 21, fontWeight: "700", color: "#1E1922" },
  progressCircle: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  progressCircleComplete: { backgroundColor: "#D8F0E1" },
  progressPercent: { fontSize: 11, fontWeight: "800", color: "#765FD2" },
  progressPercentComplete: { color: "#3E7C5A" },
  progressTrack: { height: 7, marginTop: 16, overflow: "hidden", borderRadius: 4, backgroundColor: "rgba(118,95,210,0.14)" },
  progressFill: { height: "100%", borderRadius: 4, backgroundColor: "#765FD2" },
  progressFillComplete: { backgroundColor: "#57A678" },
  resetButton: { alignSelf: "flex-start", marginTop: 13, flexDirection: "row", alignItems: "center", gap: 5 },
  resetText: { fontSize: 10, fontWeight: "600", color: "#746B7A" },
  addCard: { marginTop: 14, borderRadius: 19, borderWidth: 1, borderColor: "#E4DFE8", padding: 14, backgroundColor: "#FFFFFF" },
  addTitle: { marginBottom: 9, fontSize: 11, fontWeight: "700", color: "#4A424E" },
  addRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  input: { flex: 1, height: 45, borderRadius: 14, paddingHorizontal: 12, fontSize: 13, color: "#171419", backgroundColor: "#F5F3F6" },
  addButton: { width: 45, height: 45, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#765FD2" },
  addButtonDisabled: { backgroundColor: "#C8C2CD" },
  section: { marginTop: 25 },
  sectionHeader: { marginBottom: 9, flexDirection: "row", alignItems: "center" },
  sectionIcon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", backgroundColor: "#EEE9FF" },
  sectionTitle: { flex: 1, marginLeft: 9, fontSize: 16, fontWeight: "700", color: "#1D1920" },
  sectionCount: { fontSize: 10, fontWeight: "700", color: "#81778B" },
  listCard: { overflow: "hidden", borderRadius: 18, borderWidth: 1, borderColor: "#E4DFE8", backgroundColor: "#FFFFFF" },
  itemRow: { minHeight: 57, flexDirection: "row", alignItems: "center" },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: "#EEEAF0" },
  itemToggle: { flex: 1, minHeight: 57, paddingHorizontal: 13, flexDirection: "row", alignItems: "center" },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 1.5, borderColor: "#BDB5C3", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  checkboxPacked: { borderColor: "#765FD2", backgroundColor: "#765FD2" },
  itemLabel: { flex: 1, marginLeft: 11, fontSize: 13, color: "#312B34" },
  itemLabelPacked: { color: "#918A94", textDecorationLine: "line-through" },
  deleteItem: { width: 46, height: 57, alignItems: "center", justifyContent: "center" },
  notFound: { flex: 1, paddingHorizontal: 40, alignItems: "center", justifyContent: "center" },
  notFoundTitle: { fontSize: 20, fontWeight: "700", color: "#111111" },
  notFoundText: { marginTop: 7, textAlign: "center", fontSize: 12, color: "#777077" },
});
