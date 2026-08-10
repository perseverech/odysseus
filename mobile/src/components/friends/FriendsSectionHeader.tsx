import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function FriendsSectionHeader({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {typeof count === "number" && <Text style={styles.count}>{count}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 28,
    marginBottom: 13,
    flexDirection: "row",
    alignItems: "center",
  },
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
});
