import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import type { Friend } from "../../models/collaboration";
import FriendAvatar from "./FriendAvatar";

export default function FriendCard({
  friend,
  onPress,
}: {
  friend: Friend;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.82}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${friend.name} profile`}
    >
      <FriendAvatar friend={friend} size={49} lavender />
      <Text style={styles.name} numberOfLines={1}>
        {friend.name}
      </Text>
      {friend.username && (
        <Text style={styles.username} numberOfLines={1}>
          {friend.username}
        </Text>
      )}
      <View style={styles.bottomRow}>
        <Text style={styles.countries}>
          {friend.countriesVisited ?? 0} countries
        </Text>
        <Ionicons name="chevron-forward" size={14} color="#AAA2B0" />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 145,
    minHeight: 150,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E8E5EC",
    padding: 14,
    backgroundColor: "#FFFFFF",
  },
  name: { marginTop: 11, fontSize: 14, fontWeight: "700", color: "#111111" },
  username: { marginTop: 2, fontSize: 10, color: "#8A838E" },
  bottomRow: {
    marginTop: "auto",
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countries: { fontSize: 9, fontWeight: "600", color: "#6653B0" },
});
