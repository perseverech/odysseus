import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import FriendAvatar from "../components/friends/FriendAvatar";
import FriendsStackHeader from "../components/friends/FriendsStackHeader";
import TripIdeaCard from "../components/friends/TripIdeaCard";
import { useFriends } from "../context/FriendsContext";
import { CURRENT_USER_ID, type Friend } from "../models/collaboration";
import type { FriendsStackParamList } from "../navigation/navigationTypes";
import { formatSharedTripDates } from "../utils/collaborationDates";

type Props = NativeStackScreenProps<
  FriendsStackParamList,
  "SharedTripDetail"
>;

const ROUTE_COPY = {
  not_started: {
    title: "Not generated yet",
    text: "Vote for your favourite ideas, then build a first route draft.",
  },
  in_progress: {
    title: "Route in progress",
    text: "The group is still choosing places and shaping the day plan.",
  },
  ready: {
    title: "Route ready",
    text: "Your collaborative day plan is ready to explore.",
  },
} as const;

export default function SharedTripDetailScreen({ route, navigation }: Props) {
  const {
    friends,
    sharedTrips,
    tripIdeas,
    toggleVote,
    removeTripIdea,
    addFriendToTrip,
    removeFriendFromTrip,
    buildRoute,
    getPerson,
  } = useFriends();
  const trip = sharedTrips.find((item) => item.id === route.params.tripId);

  if (!trip) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <FriendsStackHeader title="Trip not found" onBack={navigation.goBack} />
        <View style={styles.notFound}>
          <Ionicons name="people-outline" size={30} color="#9B91A2" />
          <Text style={styles.notFoundTitle}>Shared trip not found</Text>
          <Text style={styles.notFoundText}>
            It may no longer be available in collaboration data.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const tripId = trip.id;
  const ideas = tripIdeas.filter((idea) => idea.tripId === tripId);
  const participants = trip.participantIds
    .map(getPerson)
    .filter((person): person is Friend => Boolean(person));
  const availableFriends = friends.filter(
    (friend) => !trip.participantIds.includes(friend.id)
  );
  const routeCopy = ROUTE_COPY[trip.routeStatus];

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <FriendsStackHeader
        eyebrow="SHARED TRIP"
        title={trip.city}
        onBack={navigation.goBack}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>{trip.title.toLocaleUpperCase()}</Text>
          <Text style={styles.heroDates}>
            {formatSharedTripDates(trip.startDate, trip.endDate)}
          </Text>
          <Text style={styles.heroCountry}>{trip.country}</Text>
        </View>

        <SectionTitle title="Participants" count={participants.length} />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.participantsRow}
        >
          {participants.map((participant) => (
            <Participant
              key={participant.id}
              participant={participant}
              isCurrentUser={participant.id === CURRENT_USER_ID}
              onOpen={() =>
                participant.id !== CURRENT_USER_ID &&
                navigation.navigate("FriendProfile", {
                  friendId: participant.id,
                })
              }
              onRemove={() => removeFriendFromTrip(tripId, participant.id)}
            />
          ))}
        </ScrollView>

        {availableFriends.length > 0 && (
          <View style={styles.addFriendsArea}>
            <Text style={styles.addFriendsLabel}>ADD FRIEND TO TRIP</Text>
            <View style={styles.addFriendsRow}>
              {availableFriends.map((friend) => (
                <TouchableOpacity
                  key={friend.id}
                  style={styles.addFriendChip}
                  onPress={() => addFriendToTrip(tripId, friend.id)}
                  accessibilityRole="button"
                  accessibilityLabel={`Add ${friend.name} to trip`}
                >
                  <Ionicons name="add" size={14} color="#765FD2" />
                  <Text style={styles.addFriendText}>{friend.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View style={styles.ideasHeader}>
          <SectionTitle title="Ideas" count={ideas.length} compact />
          <TouchableOpacity
            style={styles.addPlaceButton}
            onPress={() =>
              navigation.navigate("AddPlaceToSharedTrip", { tripId })
            }
            accessibilityRole="button"
            accessibilityLabel="Add place to shared trip"
          >
            <Ionicons name="add" size={15} color="#111111" />
            <Text style={styles.addPlaceText}>Add place</Text>
          </TouchableOpacity>
        </View>

        {ideas.length === 0 ? (
          <TouchableOpacity
            style={styles.emptyIdeas}
            onPress={() =>
              navigation.navigate("AddPlaceToSharedTrip", { tripId })
            }
          >
            <Ionicons name="bulb-outline" size={22} color="#8D8493" />
            <Text style={styles.emptyIdeasText}>
              No ideas yet. Add the first place for this trip.
            </Text>
          </TouchableOpacity>
        ) : (
          ideas.map((idea) => (
            <TripIdeaCard
              key={idea.id}
              idea={idea}
              addedBy={getPerson(idea.addedByFriendId)}
              onVote={() => toggleVote(idea.id)}
              onRemove={
                idea.addedByFriendId === CURRENT_USER_ID
                  ? () => removeTripIdea(idea.id)
                  : undefined
              }
            />
          ))
        )}

        <SectionTitle title="Route" />
        <View style={styles.routeCard}>
          <View style={styles.routeHeader}>
            <View style={styles.dayBadge}>
              <Text style={styles.dayText}>DAY 1</Text>
            </View>
            <View
              style={[
                styles.routeStatusDot,
                trip.routeStatus === "ready" && styles.routeStatusReady,
              ]}
            />
          </View>
          <Text style={styles.routeTitle}>{routeCopy.title}</Text>
          <Text style={styles.routeText}>{routeCopy.text}</Text>
          <TouchableOpacity
            style={[
              styles.buildButton,
              trip.routeStatus !== "not_started" && styles.buildButtonStarted,
            ]}
            onPress={() => buildRoute(tripId)}
            disabled={trip.routeStatus !== "not_started"}
            accessibilityRole="button"
            accessibilityLabel="Build route"
          >
            <Ionicons
              name={trip.routeStatus === "not_started" ? "map-outline" : "hourglass-outline"}
              size={17}
              color={trip.routeStatus === "not_started" ? "#FFFFFF" : "#765FD2"}
            />
            <Text
              style={[
                styles.buildButtonText,
                trip.routeStatus !== "not_started" &&
                  styles.buildButtonTextStarted,
              ]}
            >
              {trip.routeStatus === "not_started"
                ? "Build route"
                : trip.routeStatus === "ready"
                  ? "Route ready"
                  : "Route in progress"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionTitle({
  title,
  count,
  compact = false,
}: {
  title: string;
  count?: number;
  compact?: boolean;
}) {
  return (
    <View style={[styles.sectionTitleRow, compact && styles.sectionTitleCompact]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {typeof count === "number" && <Text style={styles.sectionCount}>{count}</Text>}
    </View>
  );
}

function Participant({
  participant,
  isCurrentUser,
  onOpen,
  onRemove,
}: {
  participant: Friend;
  isCurrentUser: boolean;
  onOpen: () => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.participant}>
      <TouchableOpacity
        activeOpacity={isCurrentUser ? 1 : 0.75}
        onPress={onOpen}
        disabled={isCurrentUser}
      >
        <FriendAvatar friend={participant} size={48} lavender={isCurrentUser} />
      </TouchableOpacity>
      <Text style={styles.participantName} numberOfLines={1}>
        {participant.name}
      </Text>
      {!isCurrentUser && (
        <TouchableOpacity
          style={styles.removeParticipant}
          onPress={onRemove}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${participant.name} from trip`}
        >
          <Ionicons name="close" size={11} color="#7D7185" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9F8FC" },
  content: { paddingHorizontal: 18, paddingTop: 7, paddingBottom: 42 },
  hero: { borderRadius: 23, borderWidth: 1, borderColor: "#E4DDF4", padding: 18, backgroundColor: "#FFFFFF" },
  heroTitle: { fontSize: 27, fontWeight: "700", letterSpacing: 1.5, color: "#111111" },
  heroDates: { marginTop: 8, fontSize: 15, fontWeight: "700", color: "#765FD2" },
  heroCountry: { marginTop: 4, fontSize: 11, color: "#89818D" },
  sectionTitleRow: { marginTop: 28, marginBottom: 13, flexDirection: "row", alignItems: "center" },
  sectionTitleCompact: { marginTop: 0, marginBottom: 0 },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111111" },
  sectionCount: { marginLeft: 7, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2, overflow: "hidden", fontSize: 10, fontWeight: "700", color: "#765FD2", backgroundColor: "#EEE9FF" },
  participantsRow: { paddingRight: 18, gap: 13 },
  participant: { width: 58, alignItems: "center" },
  participantName: { width: 58, marginTop: 6, textAlign: "center", fontSize: 9, fontWeight: "600", color: "#5F5862" },
  removeParticipant: { position: "absolute", top: -3, right: 1, width: 19, height: 19, borderRadius: 10, borderWidth: 1, borderColor: "#DFD8E4", alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  addFriendsArea: { marginTop: 16, borderRadius: 15, padding: 11, backgroundColor: "#F0ECFA" },
  addFriendsLabel: { fontSize: 8, fontWeight: "700", letterSpacing: 1, color: "#8B8192" },
  addFriendsRow: { marginTop: 8, flexDirection: "row", flexWrap: "wrap", gap: 7 },
  addFriendChip: { height: 31, borderRadius: 16, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FFFFFF" },
  addFriendText: { fontSize: 10, fontWeight: "700", color: "#6653B0" },
  ideasHeader: { marginTop: 29, marginBottom: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  addPlaceButton: { height: 34, borderRadius: 17, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#EDEDED" },
  addPlaceText: { fontSize: 11, fontWeight: "700", color: "#111111" },
  emptyIdeas: { borderRadius: 18, borderWidth: 1, borderColor: "#E6E2E8", padding: 15, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFFFFF" },
  emptyIdeasText: { flex: 1, fontSize: 11, lineHeight: 17, color: "#777077" },
  routeCard: { borderRadius: 20, borderWidth: 1, borderColor: "#E4DDF4", padding: 16, backgroundColor: "#FFFFFF" },
  routeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  dayBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: "#EEE9FF" },
  dayText: { fontSize: 8, fontWeight: "800", letterSpacing: 0.8, color: "#765FD2" },
  routeStatusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#C9B8FF" },
  routeStatusReady: { backgroundColor: "#72AE83" },
  routeTitle: { marginTop: 14, fontSize: 15, fontWeight: "700", color: "#111111" },
  routeText: { marginTop: 5, fontSize: 11, lineHeight: 17, color: "#777077" },
  buildButton: { height: 47, marginTop: 16, borderRadius: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: "#111111" },
  buildButtonStarted: { backgroundColor: "#EEE9FF" },
  buildButtonText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  buildButtonTextStarted: { color: "#765FD2" },
  notFound: { flex: 1, paddingHorizontal: 40, alignItems: "center", justifyContent: "center" },
  notFoundTitle: { marginTop: 13, fontSize: 20, fontWeight: "700", color: "#111111" },
  notFoundText: { marginTop: 7, textAlign: "center", fontSize: 12, color: "#777077" },
});
