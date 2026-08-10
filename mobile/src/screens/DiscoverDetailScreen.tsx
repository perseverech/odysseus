import React, { type ComponentProps, useState } from "react";

import {
  Image,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { SafeAreaView } from "react-native-safe-area-context";

import { discoverItems } from "../data/discoverItems";

import { useWishlist } from "../context/WishlistContext";
import { useTravelData } from "../context/TravelDataContext";
import type { DiscoverStackParamList } from "../navigation/DiscoverStack";
import type { RootTabParamList } from "../navigation/navigationTypes";
import { formatTripDateRange } from "../utils/travelDates";

type Props = NativeStackScreenProps<
  DiscoverStackParamList,
  "DiscoverDetail"
>;

export default function DiscoverDetailScreen({
  route,
  navigation,
}: Props) {
  const { itemId } = route.params;
  const [tripModalVisible, setTripModalVisible] = useState(false);

  const item = discoverItems.find(
    (entry) => entry.id === itemId
  );

  const { isSaved, toggleWishlist } =
    useWishlist();
  const { trips, setTripSelectedPlaceIds } = useTravelData();

  if (!item) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text>Item not found.</Text>
      </SafeAreaView>
    );
  }

  const discoverItemId = item.id;
  const saved = isSaved(discoverItemId);
  const availableTrips = trips.filter((trip) => trip.status !== "completed");
  const addedTrips = availableTrips.filter((trip) =>
    trip.selectedPlaceIds.includes(discoverItemId)
  );
  const addedLabel =
    addedTrips.length === 1
      ? `Added to ${addedTrips[0].destinationCity} ✓`
      : addedTrips.length > 1
        ? `Added to ${addedTrips.length} trips ✓`
        : "Add to trip";

  function addToTrip(tripId: string) {
    const trip = trips.find((entry) => entry.id === tripId);

    if (!trip) return;

    setTripSelectedPlaceIds(trip.id, [
      ...trip.selectedPlaceIds,
      discoverItemId,
    ]);
    setTripModalVisible(false);
  }

  function createTripWithPlace() {
    setTripModalVisible(false);
    const tabNavigation = navigation.getParent<
      BottomTabNavigationProp<RootTabParamList>
    >();

    tabNavigation?.navigate("Profile", {
      screen: "AddTrip",
      params: { initialPlaceId: discoverItemId },
    });
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Image
            source={{
              uri: item.image,
            }}
            style={styles.heroImage}
          />

          <SafeAreaView
            style={styles.heroControls}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={styles.circleButton}
              onPress={() =>
                navigation.goBack()
              }
            >
              <Ionicons
                name="chevron-back"
                size={23}
                color="#111111"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.circleButton}
              onPress={() =>
                toggleWishlist(item.id)
              }
            >
              <Ionicons
                name={
                  saved
                    ? "heart"
                    : "heart-outline"
                }
                size={22}
                color={
                  saved
                    ? "#B49CFF"
                    : "#111111"
                }
              />
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        <View style={styles.content}>
          <Text style={styles.category}>
            {item.category.toUpperCase()}
          </Text>

          <Text style={styles.title}>
            {item.title}
          </Text>

          <View style={styles.locationRow}>
            <Ionicons
              name="location-outline"
              size={17}
              color="#777777"
            />

            <Text style={styles.location}>
              {item.location},{" "}
              {item.country}
            </Text>
          </View>

          {item.isDemoData && (
            <View style={styles.demoNotice}>
              <Ionicons
                name="flask-outline"
                size={17}
                color="#765FD2"
              />
              <Text style={styles.demoNoticeText}>
                Local demo data for testing. Prices, schedules and availability
                are not live.
              </Text>
            </View>
          )}

          <View style={styles.infoGrid}>
            <Info
              icon="cash-outline"
              label="Price"
              value={item.price}
            />

            <Info
              icon="wallet-outline"
              label="Access"
              value={item.paymentType}
            />

            <Info
              icon="calendar-outline"
              label="Opening hours"
              value={item.openingHours}
            />

            <Info
              icon="time-outline"
              label="Duration"
              value={item.duration}
            />

            <Info
              icon="sunny-outline"
              label="Best season"
              value={item.bestSeason}
            />

            <Info
              icon="ticket-outline"
              label="Tickets"
              value={item.ticketInfo}
            />
          </View>

          <Text style={styles.sectionTitle}>
            Why go
          </Text>

          <Text style={styles.description}>
            {item.description}
          </Text>

          {item.note && (
            <View style={styles.noteCard}>
              <Ionicons
                name="information-circle-outline"
                size={21}
                color="#765FD2"
              />

              <View style={styles.noteTextArea}>
                <Text style={styles.noteTitle}>
                  Good to know
                </Text>

                <Text style={styles.noteText}>
                  {item.note}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.tripButton,
              addedTrips.length > 0 && styles.tripButtonAdded,
            ]}
            onPress={() => setTripModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={addedLabel}
          >
            <Ionicons
              name={addedTrips.length > 0 ? "checkmark-circle" : "add-circle-outline"}
              size={20}
              color={addedTrips.length > 0 ? "#765FD2" : "#FFFFFF"}
            />
            <Text
              style={[
                styles.tripButtonText,
                addedTrips.length > 0 && styles.tripButtonTextAdded,
              ]}
            >
              {addedLabel}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.wishlistButton,
              saved &&
                styles.wishlistButtonSaved,
            ]}
            onPress={() =>
              toggleWishlist(item.id)
            }
          >
            <Ionicons
              name={
                saved
                  ? "heart"
                  : "heart-outline"
              }
              size={20}
              color={
                saved
                  ? "#765FD2"
                  : "#FFFFFF"
              }
            />

            <Text
              style={[
                styles.wishlistText,
                saved &&
                  styles.wishlistTextSaved,
              ]}
            >
              {saved
                ? "Saved to Wishlist"
                : "Save to Wishlist"}
            </Text>
          </TouchableOpacity>

          <ExternalLinkButton
            icon="globe-outline"
            label="Official website"
            url={item.officialSiteUrl}
          />

          {item.ticketsUrl && (
            <ExternalLinkButton
              icon="ticket-outline"
              label="Ticket information"
              url={item.ticketsUrl}
            />
          )}

          <ExternalLinkButton
            icon="map-outline"
            label="Open in Google Maps"
            url={item.mapsUrl}
          />
        </View>
      </ScrollView>

      <Modal
        visible={tripModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTripModalVisible(false)}
      >
        <View style={styles.modalRoot}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setTripModalVisible(false)}
            accessibilityLabel="Close add to trip"
          />
          <SafeAreaView style={styles.tripSheet} edges={["bottom"]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Add to trip</Text>
            <Text style={styles.sheetSubtitle}>{item.title}</Text>

            {availableTrips.length === 0 ? (
              <View style={styles.noTripsCard}>
                <Text style={styles.noTripsTitle}>No trips yet</Text>
                <Text style={styles.noTripsText}>
                  Create a trip first and this place will be added automatically.
                </Text>
              </View>
            ) : (
              availableTrips.map((trip) => {
                const added = trip.selectedPlaceIds.includes(item.id);

                return (
                  <TouchableOpacity
                    key={trip.id}
                    style={styles.tripOption}
                    onPress={() => addToTrip(trip.id)}
                  >
                    <View style={[styles.radio, added && styles.radioAdded]}>
                      {added && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                    </View>
                    <View style={styles.tripOptionBody}>
                      <Text style={styles.tripOptionCity}>{trip.destinationCity}</Text>
                      <Text style={styles.tripOptionDates}>
                        {formatTripDateRange(trip.startDate, trip.endDate)}
                      </Text>
                    </View>
                    {added && <Text style={styles.addedText}>Added</Text>}
                  </TouchableOpacity>
                );
              })
            )}

            <TouchableOpacity style={styles.createTripButton} onPress={createTripWithPlace}>
              <Ionicons name="add" size={18} color="#765FD2" />
              <Text style={styles.createTripText}>Create new trip</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

type IoniconName = ComponentProps<typeof Ionicons>["name"];

function Info({
  icon,
  label,
  value,
}: {
  icon: IoniconName;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.info}>
      <Ionicons
        name={icon}
        size={19}
        color="#111111"
      />

      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

function ExternalLinkButton({
  icon,
  label,
  url,
}: {
  icon: IoniconName;
  label: string;
  url: string;
}) {
  return (
    <TouchableOpacity
      style={styles.linkButton}
      onPress={() => void Linking.openURL(url)}
      activeOpacity={0.72}
    >
      <Ionicons
        name={icon}
        size={20}
        color="#111111"
      />

      <Text style={styles.linkButtonText}>
        {label}
      </Text>

      <Ionicons
        name="open-outline"
        size={17}
        color="#777777"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,

    backgroundColor: "#FFFFFF",
  },

  safeArea: {
    flex: 1,

    backgroundColor: "#FFFFFF",

    padding: 20,
  },

  hero: {
    height: 390,

    backgroundColor: "#F3F3F3",
  },

  heroImage: {
    width: "100%",

    height: "100%",
  },

  heroControls: {
    position: "absolute",

    top: 0,

    left: 16,

    right: 16,

    flexDirection: "row",

    justifyContent:
      "space-between",
  },

  circleButton: {
    width: 42,

    height: 42,

    borderRadius: 21,

    backgroundColor:
      "rgba(255,255,255,0.93)",

    alignItems: "center",

    justifyContent: "center",
  },

  content: {
    padding: 20,

    paddingBottom: 45,
  },

  category: {
    fontSize: 10,

    fontWeight: "700",

    letterSpacing: 1.5,

    color: "#999999",
  },

  title: {
    marginTop: 7,

    fontSize: 31,

    lineHeight: 36,

    fontWeight: "700",

    color: "#111111",
  },

  locationRow: {
    marginTop: 9,

    flexDirection: "row",

    alignItems: "center",
  },

  location: {
    marginLeft: 5,

    fontSize: 14,

    color: "#777777",
  },

  demoNotice: {
    marginTop: 16,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F1EDFF",
  },

  demoNoticeText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: "#65558E",
  },

  infoGrid: {
    marginTop: 25,

    flexDirection: "row",

    flexWrap: "wrap",

    gap: 10,
  },

  info: {
    width: "48%",

    minHeight: 105,

    borderRadius: 18,

    borderWidth: 1,

    borderColor: "#E8E8E8",

    padding: 14,
  },

  infoLabel: {
    marginTop: 9,

    fontSize: 11,

    color: "#888888",
  },

  infoValue: {
    marginTop: 3,

    fontSize: 14,

    fontWeight: "600",

    color: "#111111",
  },

  sectionTitle: {
    marginTop: 30,

    fontSize: 21,

    fontWeight: "700",

    color: "#111111",
  },

  description: {
    marginTop: 10,

    fontSize: 15,

    lineHeight: 23,

    color: "#4E4E4E",
  },

  noteCard: {
    marginTop: 23,

    borderRadius: 18,

    padding: 16,

    backgroundColor: "#F6F3FF",

    flexDirection: "row",
  },

  noteTextArea: {
    flex: 1,

    marginLeft: 10,
  },

  noteTitle: {
    fontSize: 14,

    fontWeight: "700",

    color: "#111111",
  },

  noteText: {
    marginTop: 5,

    fontSize: 13,

    lineHeight: 19,

    color: "#666666",
  },

  tripButton: {
    height: 57,
    marginTop: 28,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: "#765FD2",
  },

  tripButtonAdded: {
    borderWidth: 1,
    borderColor: "#D9CFF8",
    backgroundColor: "#F0ECFF",
  },

  tripButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  tripButtonTextAdded: {
    color: "#765FD2",
  },

  wishlistButton: {
    height: 57,

    marginTop: 10,

    borderRadius: 18,

    backgroundColor: "#111111",

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 9,
  },

  wishlistButtonSaved: {
    backgroundColor: "#EEE9FF",
  },

  wishlistText: {
    fontSize: 15,

    fontWeight: "600",

    color: "#FFFFFF",
  },

  wishlistTextSaved: {
    color: "#765FD2",
  },

  linkButton: {
    height: 57,

    marginTop: 10,

    borderRadius: 18,

    borderWidth: 1,

    borderColor: "#E1E1E1",

    flexDirection: "row",

    alignItems: "center",

    gap: 9,

    paddingHorizontal: 17,
  },

  linkButtonText: {
    flex: 1,

    fontSize: 15,

    fontWeight: "600",

    color: "#111111",
  },

  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },

  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(18, 15, 22, 0.42)",
  },

  tripSheet: {
    maxHeight: "78%",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
  },

  sheetHandle: {
    width: 42,
    height: 4,
    marginBottom: 17,
    borderRadius: 2,
    alignSelf: "center",
    backgroundColor: "#D5D0D8",
  },

  sheetTitle: {
    fontSize: 23,
    fontWeight: "700",
    color: "#151217",
  },

  sheetSubtitle: {
    marginTop: 4,
    marginBottom: 15,
    fontSize: 12,
    color: "#817985",
  },

  tripOption: {
    minHeight: 70,
    borderBottomWidth: 1,
    borderBottomColor: "#ECE8EF",
    flexDirection: "row",
    alignItems: "center",
  },

  radio: {
    width: 23,
    height: 23,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#AFA7B5",
    alignItems: "center",
    justifyContent: "center",
  },

  radioAdded: {
    borderColor: "#765FD2",
    backgroundColor: "#765FD2",
  },

  tripOptionBody: {
    flex: 1,
    marginLeft: 12,
  },

  tripOptionCity: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1D1920",
  },

  tripOptionDates: {
    marginTop: 3,
    fontSize: 10,
    color: "#827A86",
  },

  addedText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#765FD2",
  },

  noTripsCard: {
    borderRadius: 17,
    padding: 15,
    backgroundColor: "#F5F2FA",
  },

  noTripsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2C2630",
  },

  noTripsText: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
    color: "#817985",
  },

  createTripButton: {
    height: 52,
    marginTop: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D9CFF8",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    backgroundColor: "#F5F2FF",
  },

  createTripText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#765FD2",
  },
});
