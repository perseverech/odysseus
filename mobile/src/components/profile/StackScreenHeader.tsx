import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

type Props = {
  eyebrow?: string;
  title: string;
  onBack: () => void;
};

export default function StackScreenHeader({ eyebrow, title, onBack }: Props) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={22} color="#111111" />
      </TouchableOpacity>

      <View style={styles.titleArea}>
        {eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 66,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E3E0E7",
    backgroundColor: "#FFFFFF",
  },
  titleArea: { flex: 1, alignItems: "center", paddingHorizontal: 8 },
  eyebrow: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.3,
    color: "#8B8192",
  },
  title: {
    marginTop: 3,
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
  },
  spacer: { width: 40 },
});
