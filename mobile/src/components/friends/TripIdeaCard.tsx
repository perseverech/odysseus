import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { CURRENT_USER_ID, type Friend, type TripIdea } from "../../models/collaboration";

export default function TripIdeaCard({
  idea,
  addedBy,
  onVote,
  onRemove,
}: {
  idea: TripIdea;
  addedBy?: Friend;
  onVote: () => void;
  onRemove?: () => void;
}) {
  const voted = idea.votes.includes(CURRENT_USER_ID);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.icon}>
          <Ionicons name="location-outline" size={17} color="#765FD2" />
        </View>
        <View style={styles.titleArea}>
          <Text style={styles.title}>{idea.title}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {[idea.category, idea.location].filter(Boolean).join(" · ") ||
              "Place idea"}
          </Text>
        </View>
        {onRemove && (
          <TouchableOpacity
            style={styles.removeButton}
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel={`Remove ${idea.title}`}
          >
            <Ionicons name="trash-outline" size={15} color="#938A98" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottomRow}>
        <Text style={styles.addedBy}>
          Added by {addedBy?.name ?? "Traveller"}
        </Text>
        <TouchableOpacity
          style={[styles.voteButton, voted && styles.voteButtonActive]}
          onPress={onVote}
          accessibilityRole="button"
          accessibilityState={{ selected: voted }}
          accessibilityLabel={`${voted ? "Remove vote from" : "Vote for"} ${
            idea.title
          }`}
        >
          <Ionicons
            name={voted ? "heart" : "heart-outline"}
            size={15}
            color={voted ? "#FFFFFF" : "#765FD2"}
          />
          <Text style={[styles.voteCount, voted && styles.voteCountActive]}>
            {idea.votes.length}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8E5EB",
    padding: 13,
    backgroundColor: "#FFFFFF",
  },
  topRow: { flexDirection: "row", alignItems: "center" },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F0ECFC",
  },
  titleArea: { flex: 1, marginLeft: 10 },
  title: { fontSize: 14, fontWeight: "700", color: "#111111" },
  meta: { marginTop: 3, fontSize: 10, color: "#817983" },
  removeButton: {
    width: 31,
    height: 31,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F3F6",
  },
  bottomRow: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#EFEDEF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  addedBy: { fontSize: 9, color: "#918A92" },
  voteButton: {
    minWidth: 49,
    height: 31,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#C9B8FF",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#FFFFFF",
  },
  voteButtonActive: { borderColor: "#9B82EA", backgroundColor: "#9B82EA" },
  voteCount: { fontSize: 11, fontWeight: "700", color: "#765FD2" },
  voteCountActive: { color: "#FFFFFF" },
});
