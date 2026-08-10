import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

export default function ProfileHero() {
  return (
    <>
      <Text style={styles.logo}>ODYSSEUS</Text>
      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <Ionicons name="person-outline" size={34} color="#111111" />
        </View>
        <View style={styles.profileText}>
          <Text style={styles.name}>Ana</Text>
          <Text style={styles.role}>Traveller</Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  logo: {
    marginTop: 8,
    fontSize: 21,
    fontWeight: "600",
    letterSpacing: 5,
    color: "#111111",
  },
  profileRow: { marginTop: 23, flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
  },
  profileText: { marginLeft: 15 },
  name: { fontSize: 23, fontWeight: "700", color: "#111111" },
  role: { marginTop: 3, fontSize: 13, color: "#777777" },
});
