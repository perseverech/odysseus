import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import ProfileSectionHeader from "./ProfileSectionHeader";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export default function ProfileFooter() {
  return (
    <>
      <ProfileSectionHeader title="Travel personality" />
      <View style={styles.comingSoonCard}>
        <View style={styles.personalityIcon}>
          <Ionicons name="sparkles-outline" size={21} color="#765FD2" />
        </View>
        <View style={styles.personalityTextArea}>
          <Text style={styles.personalityTitle}>Your travel style</Text>
          <Text style={styles.personalityText}>
            Personal insights are being prepared.
          </Text>
        </View>
        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>COMING SOON</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <MenuItem icon="settings-outline" label="Settings" />
        <MenuItem icon="help-circle-outline" label="Help & Support" />
        <MenuItem icon="information-circle-outline" label="About ODYSSEUS" />
      </View>
    </>
  );
}

function MenuItem({ icon, label }: { icon: IoniconName; label: string }) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={20} color="#111111" />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#AAAAAA" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  comingSoonCard: {
    minHeight: 84,
    borderRadius: 19,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F6F3FF",
  },
  personalityIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEE8FF",
  },
  personalityTextArea: { flex: 1, marginLeft: 12, paddingRight: 8 },
  personalityTitle: { fontSize: 13, fontWeight: "700", color: "#111111" },
  personalityText: { marginTop: 3, fontSize: 10, lineHeight: 14, color: "#777777" },
  comingSoonBadge: { borderRadius: 10, paddingHorizontal: 7, paddingVertical: 5, backgroundColor: "#E8E1FF" },
  comingSoonText: { fontSize: 7, fontWeight: "800", letterSpacing: 0.6, color: "#765FD2" },
  menu: { marginTop: 18, overflow: "hidden", borderRadius: 19, borderWidth: 1, borderColor: "#ECECEC" },
  menuItem: { minHeight: 60, paddingHorizontal: 13, flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#EAEAEA", backgroundColor: "#FFFFFF" },
  menuIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: "#F3F3F3" },
  menuLabel: { flex: 1, marginLeft: 11, fontSize: 13, fontWeight: "600", color: "#111111" },
});
