import React from "react";
import { StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FriendsScreen() {
  return (
    <SafeAreaView
      style={styles.screen}
      edges={["top", "left", "right"]}
    >
      <Text style={styles.title}>Friends</Text>
      <Text style={styles.subtitle}>
        Plan journeys together.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingTop: 20,
  },

  title: {
    fontSize: 34,
    fontWeight: "700",
    color: "#111111",
  },

  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: "#777777",
  },
});
