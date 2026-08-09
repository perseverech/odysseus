import React, { type ComponentProps } from "react";

import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import { SafeAreaView } from "react-native-safe-area-context";

import { discoverItems } from "../data/discoverItems";

import { useWishlist } from "../context/WishlistContext";
import type { DiscoverStackParamList } from "../navigation/DiscoverStack";

type Props = NativeStackScreenProps<
  DiscoverStackParamList,
  "DiscoverDetail"
>;

export default function DiscoverDetailScreen({
  route,
  navigation,
}: Props) {
  const { itemId } = route.params;

  const item = discoverItems.find(
    (entry) => entry.id === itemId
  );

  const { isSaved, toggleWishlist } =
    useWishlist();

  if (!item) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text>Item not found.</Text>
      </SafeAreaView>
    );
  }

  const saved = isSaved(item.id);

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

  wishlistButton: {
    height: 57,

    marginTop: 28,

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
});
