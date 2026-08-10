import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import type { Friend, Invitation } from "../../models/collaboration";
import { formatSharedTripDates } from "../../utils/collaborationDates";
import FriendAvatar from "./FriendAvatar";

export default function InvitationCard({
  invitation,
  sender,
  onAccept,
  onDecline,
}: {
  invitation: Invitation;
  sender: Friend;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <FriendAvatar friend={sender} size={43} lavender />
        <View style={styles.titleArea}>
          <Text style={styles.title}>
            <Text style={styles.sender}>{sender.name}</Text>
            {` invited you to ${invitation.city}`}
          </Text>
          <Text style={styles.dates}>
            {formatSharedTripDates(invitation.startDate, invitation.endDate)}
          </Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.declineButton}
          onPress={onDecline}
          accessibilityRole="button"
          accessibilityLabel={`Decline ${invitation.city} invitation`}
        >
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.acceptButton}
          onPress={onAccept}
          accessibilityRole="button"
          accessibilityLabel={`Accept ${invitation.city} invitation`}
        >
          <Text style={styles.acceptText}>Accept</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E7E1F3",
    padding: 14,
    backgroundColor: "#F9F7FF",
  },
  header: { flexDirection: "row", alignItems: "center" },
  titleArea: { flex: 1, marginLeft: 11 },
  title: { fontSize: 13, lineHeight: 18, color: "#332E38" },
  sender: { fontWeight: "700", color: "#111111" },
  dates: { marginTop: 4, fontSize: 10, fontWeight: "600", color: "#765FD2" },
  actions: { marginTop: 14, flexDirection: "row", gap: 8 },
  declineButton: {
    flex: 1,
    height: 41,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#DEDAE2",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  declineText: { fontSize: 12, fontWeight: "700", color: "#686168" },
  acceptButton: {
    flex: 1,
    height: 41,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111111",
  },
  acceptText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
});
