import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import type { Friend } from "../../models/collaboration";

type Props = {
  friend: Friend;
  size?: number;
  lavender?: boolean;
};

export default function FriendAvatar({
  friend,
  size = 48,
  lavender = false,
}: Props) {
  const initials = friend.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toLocaleUpperCase())
    .join("");

  if (friend.avatar) {
    return (
      <Image
        source={{ uri: friend.avatar }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        accessibilityLabel={`${friend.name} avatar`}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: lavender ? "#EAE3FF" : "#F0F0F0",
        },
      ]}
      accessibilityLabel={`${friend.name} avatar`}
    >
      <Text style={[styles.initials, { fontSize: Math.max(12, size * 0.3) }]}>
        {initials || "?"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { alignItems: "center", justifyContent: "center" },
  initials: { fontWeight: "700", color: "#4D3C82" },
});
