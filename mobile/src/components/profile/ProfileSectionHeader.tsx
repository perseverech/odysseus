import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

type Props = {
  title: string;
  count?: number;
  actionLabel?: string;
  onAction?: () => void;
};

export default function ProfileSectionHeader({
  title,
  count,
  actionLabel,
  onAction,
}: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {typeof count === "number" && (
          <Text style={styles.count}>{count}</Text>
        )}
      </View>

      {actionLabel && onAction && (
        <TouchableOpacity
          style={styles.action}
          onPress={onAction}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Ionicons name="add" size={15} color="#111111" />
          <Text style={styles.actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 29,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: { flexDirection: "row", alignItems: "center" },
  title: { fontSize: 18, fontWeight: "700", color: "#111111" },
  count: {
    marginLeft: 8,
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    overflow: "hidden",
    fontSize: 10,
    fontWeight: "700",
    color: "#765FD2",
    backgroundColor: "#EEE9FF",
  },
  action: {
    minHeight: 34,
    borderRadius: 17,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F1F1",
  },
  actionText: { fontSize: 11, fontWeight: "700", color: "#111111" },
});
