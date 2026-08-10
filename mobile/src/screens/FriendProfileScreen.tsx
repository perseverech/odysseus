import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import FriendAvatar from "../components/friends/FriendAvatar";
import FriendsSectionHeader from "../components/friends/FriendsSectionHeader";
import FriendsStackHeader from "../components/friends/FriendsStackHeader";
import SharedTripCard from "../components/friends/SharedTripCard";
import { useFriends } from "../context/FriendsContext";
import type { FriendsStackParamList } from "../navigation/navigationTypes";

type Props = NativeStackScreenProps<FriendsStackParamList, "FriendProfile">;

export default function FriendProfileScreen({ route, navigation }: Props) {
  const { friends, sharedTrips, tripIdeas } = useFriends();
  const friend = friends.find((item) => item.id === route.params.friendId);

  if (!friend) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <FriendsStackHeader title="Friend not found" onBack={navigation.goBack} />
        <View style={styles.notFound}>
          <Ionicons name="person-outline" size={30} color="#9B91A2" />
          <Text style={styles.notFoundTitle}>Friend not found</Text>
          <Text style={styles.notFoundText}>
            This profile is no longer available.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const tripsTogether = sharedTrips.filter((trip) =>
    trip.participantIds.includes(friend.id)
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <FriendsStackHeader
        eyebrow="TRAVEL FRIEND"
        title={friend.name}
        onBack={navigation.goBack}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.profileCard}>
          <FriendAvatar friend={friend} size={82} lavender />
          <Text style={styles.name}>{friend.name}</Text>
          {friend.username && (
            <Text style={styles.username}>{friend.username}</Text>
          )}
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{friend.countriesVisited ?? 0}</Text>
              <Text style={styles.statLabel}>COUNTRIES VISITED</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>{tripsTogether.length}</Text>
              <Text style={styles.statLabel}>SHARED TRIPS</Text>
            </View>
          </View>
        </View>

        <View style={styles.visibilityCard}>
          <View style={styles.visibilityIcon}>
            <Ionicons name="globe-outline" size={18} color="#765FD2" />
          </View>
          <View style={styles.visibilityTextArea}>
            <Text style={styles.visibilityLabel}>TRAVEL MAP VISIBILITY</Text>
            <Text style={styles.visibilityValue}>Public</Text>
          </View>
          <View style={styles.placeholderBadge}>
            <Text style={styles.placeholderText}>MAP COMING LATER</Text>
          </View>
        </View>

        <FriendsSectionHeader
          title="Shared trips together"
          count={tripsTogether.length}
        />
        {tripsTogether.length === 0 ? (
          <View style={styles.emptyTrips}>
            <Text style={styles.emptyTripsText}>
              You do not have a shared trip together yet.
            </Text>
          </View>
        ) : (
          tripsTogether.map((trip) => (
            <SharedTripCard
              key={trip.id}
              trip={trip}
              ideaCount={
                tripIdeas.filter((idea) => idea.tripId === trip.id).length
              }
              onPress={() =>
                navigation.navigate("SharedTripDetail", { tripId: trip.id })
              }
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9F8FC" },
  content: { paddingHorizontal: 18, paddingTop: 8, paddingBottom: 42 },
  profileCard: { borderRadius: 23, borderWidth: 1, borderColor: "#E4DDF4", padding: 20, alignItems: "center", backgroundColor: "#FFFFFF" },
  name: { marginTop: 13, fontSize: 24, fontWeight: "700", color: "#111111" },
  username: { marginTop: 3, fontSize: 12, color: "#817983" },
  statsRow: { width: "100%", marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#EEEAEF", flexDirection: "row", alignItems: "center" },
  stat: { flex: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "700", color: "#392C68" },
  statLabel: { marginTop: 4, fontSize: 7, fontWeight: "700", letterSpacing: 0.7, color: "#938A98" },
  statDivider: { width: 1, height: 31, backgroundColor: "#E8E3EB" },
  visibilityCard: { marginTop: 12, borderRadius: 18, borderWidth: 1, borderColor: "#E5E1E8", padding: 13, flexDirection: "row", alignItems: "center", backgroundColor: "#FFFFFF" },
  visibilityIcon: { width: 39, height: 39, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#EEE9FF" },
  visibilityTextArea: { flex: 1, marginLeft: 10 },
  visibilityLabel: { fontSize: 7, fontWeight: "700", letterSpacing: 0.8, color: "#958D9A" },
  visibilityValue: { marginTop: 4, fontSize: 13, fontWeight: "700", color: "#111111" },
  placeholderBadge: { borderRadius: 9, paddingHorizontal: 7, paddingVertical: 5, backgroundColor: "#F0EDF3" },
  placeholderText: { fontSize: 6, fontWeight: "800", letterSpacing: 0.5, color: "#8A818E" },
  emptyTrips: { borderRadius: 17, padding: 18, alignItems: "center", backgroundColor: "#FFFFFF" },
  emptyTripsText: { textAlign: "center", fontSize: 11, color: "#777077" },
  notFound: { flex: 1, paddingHorizontal: 40, alignItems: "center", justifyContent: "center" },
  notFoundTitle: { marginTop: 13, fontSize: 20, fontWeight: "700", color: "#111111" },
  notFoundText: { marginTop: 7, textAlign: "center", fontSize: 12, color: "#777077" },
});
