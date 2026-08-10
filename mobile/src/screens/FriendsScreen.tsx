import React, { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import FriendCard from "../components/friends/FriendCard";
import FriendsSectionHeader from "../components/friends/FriendsSectionHeader";
import InvitationCard from "../components/friends/InvitationCard";
import SharedTripCard from "../components/friends/SharedTripCard";
import { useFriends } from "../context/FriendsContext";
import type { FriendsStackParamList } from "../navigation/navigationTypes";

type Props = NativeStackScreenProps<FriendsStackParamList, "FriendsMain">;

export default function FriendsScreen({ navigation }: Props) {
  const {
    friends,
    sharedTrips,
    tripIdeas,
    invitations,
    acceptInvitation,
    declineInvitation,
    getPerson,
  } = useFriends();
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredFriends = useMemo(
    () =>
      normalizedSearch
        ? friends.filter((friend) =>
            `${friend.name} ${friend.username ?? ""}`
              .toLocaleLowerCase()
              .includes(normalizedSearch)
          )
        : friends,
    [friends, normalizedSearch]
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.content}
      >
        <Text style={styles.logo}>ODYSSEUS</Text>
        <Text style={styles.title}>Friends</Text>
        <Text style={styles.subtitle}>Plan journeys together.</Text>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={19} color="#8E8791" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholder="Search friends..."
            placeholderTextColor="#A39DA7"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearch("")}
              accessibilityRole="button"
              accessibilityLabel="Clear friend search"
            >
              <Ionicons name="close-circle" size={18} color="#A39DA7" />
            </TouchableOpacity>
          )}
        </View>

        <FriendsSectionHeader title="Your friends" count={filteredFriends.length} />
        {filteredFriends.length === 0 ? (
          <View style={styles.noResults}>
            <Text style={styles.noResultsText}>No friends found.</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.friendRow}
          >
            {filteredFriends.map((friend) => (
              <FriendCard
                key={friend.id}
                friend={friend}
                onPress={() =>
                  navigation.navigate("FriendProfile", {
                    friendId: friend.id,
                  })
                }
              />
            ))}
          </ScrollView>
        )}

        <FriendsSectionHeader title="Shared trips" count={sharedTrips.length} />
        {sharedTrips.map((trip) => (
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
        ))}

        <FriendsSectionHeader title="Invitations" count={invitations.length} />
        {invitations.length === 0 ? (
          <View style={styles.emptyInvitations}>
            <Ionicons name="mail-open-outline" size={20} color="#8D8493" />
            <Text style={styles.emptyInvitationText}>
              No pending invitations.
            </Text>
          </View>
        ) : (
          invitations.map((invitation) => {
            const sender = getPerson(invitation.fromFriendId);

            if (!sender) return null;

            return (
              <InvitationCard
                key={invitation.id}
                invitation={invitation}
                sender={sender}
                onDecline={() => declineInvitation(invitation.id)}
                onAccept={() => {
                  const trip = acceptInvitation(invitation.id);

                  if (trip) {
                    navigation.navigate("SharedTripDetail", {
                      tripId: trip.id,
                    });
                  }
                }}
              />
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 20, paddingBottom: 42 },
  logo: {
    marginTop: 8,
    fontSize: 19,
    fontWeight: "600",
    letterSpacing: 4.5,
    color: "#111111",
  },
  title: { marginTop: 22, fontSize: 31, fontWeight: "700", color: "#111111" },
  subtitle: { marginTop: 4, fontSize: 13, color: "#777077" },
  searchBar: {
    height: 49,
    marginTop: 21,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E2E7",
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F7F9",
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14, color: "#111111" },
  clearButton: { width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  friendRow: { paddingRight: 20, gap: 10 },
  noResults: { borderRadius: 16, padding: 18, alignItems: "center", backgroundColor: "#F8F7F9" },
  noResultsText: { fontSize: 12, color: "#817A83" },
  emptyInvitations: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7E3E9",
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
  },
  emptyInvitationText: { marginLeft: 9, fontSize: 11, color: "#777077" },
});
