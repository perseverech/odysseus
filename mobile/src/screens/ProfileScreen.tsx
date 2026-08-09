import React from "react";

import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import { SafeAreaView } from "react-native-safe-area-context";

import { useWishlist } from "../context/WishlistContext";
import { discoverItems } from "../data/discoverItems";

const VISITED_COUNTRIES = [
  "Latvia",
  "Spain",
  "Turkey",
];

const SAVED_TRIPS = [
  {
    id: "1",
    city: "Istanbul",
    country: "Turkey",
    meta: "1 day · 6 stops",
  },
  {
    id: "2",
    city: "Barcelona",
    country: "Spain",
    meta: "3 days · draft",
  },
];

export default function ProfileScreen() {
  const { wishlist } = useWishlist();

  const savedItems = discoverItems.filter((item) =>
    wishlist.includes(item.id)
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.logo}>ODYSSEUS</Text>

        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Ionicons
              name="person-outline"
              size={34}
              color="#111111"
            />
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.name}>Ana</Text>

            <Text style={styles.username}>
              Traveller
            </Text>
          </View>

          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons
              name="settings-outline"
              size={21}
              color="#111111"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.statsCard}>
          <Stat
            value={VISITED_COUNTRIES.length}
            label="Countries"
          />

          <View style={styles.statDivider} />

          <Stat
            value={2}
            label="Continents"
          />

          <View style={styles.statDivider} />

          <Stat
            value={savedItems.length}
            label="Wishlist"
          />
        </View>

        <SectionHeader
          title="Wishlist"
          count={savedItems.length}
        />

        {savedItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="heart-outline"
                size={24}
                color="#777777"
              />
            </View>

            <View style={styles.emptyTextArea}>
              <Text style={styles.emptyTitle}>
                Nothing saved yet
              </Text>

              <Text style={styles.emptyText}>
                Save experiences and places from Discover.
              </Text>
            </View>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.wishlistRow}
          >
            {savedItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.wishlistCard}
                activeOpacity={0.8}
              >
                <Image
                  source={{
                    uri: item.image,
                  }}
                  style={styles.wishlistImage}
                />

                <View style={styles.wishlistOverlay}>
                  <Text style={styles.wishlistTitle}>
                    {item.title}
                  </Text>

                  <Text style={styles.wishlistLocation}>
                    {item.country}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <SectionHeader
          title="Visited countries"
          count={VISITED_COUNTRIES.length}
        />

        <View style={styles.countryGrid}>
          {VISITED_COUNTRIES.map((country) => (
            <TouchableOpacity
              key={country}
              style={styles.countryChip}
            >
              <View style={styles.countryDot} />

              <Text style={styles.countryText}>
                {country}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.addCountryChip}>
            <Ionicons
              name="add"
              size={17}
              color="#777777"
            />

            <Text style={styles.addCountryText}>
              Add
            </Text>
          </TouchableOpacity>
        </View>

        <SectionHeader
          title="Saved trips"
          count={SAVED_TRIPS.length}
        />

        {SAVED_TRIPS.map((trip) => (
          <TouchableOpacity
            key={trip.id}
            style={styles.tripCard}
            activeOpacity={0.75}
          >
            <View style={styles.tripIcon}>
              <Ionicons
                name="airplane-outline"
                size={20}
                color="#111111"
              />
            </View>

            <View style={styles.tripInfo}>
              <Text style={styles.tripCity}>
                {trip.city}
              </Text>

              <Text style={styles.tripMeta}>
                {trip.country} · {trip.meta}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={20}
              color="#999999"
            />
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>
          More
        </Text>

        <TouchableOpacity
          style={styles.personalityCard}
          activeOpacity={0.75}
        >
          <View style={styles.personalityIcon}>
            <Ionicons
              name="sparkles-outline"
              size={21}
              color="#765FD2"
            />
          </View>

          <View style={styles.personalityTextArea}>
            <Text style={styles.personalityTitle}>
              Travel personality
            </Text>

            <Text style={styles.personalityText}>
              Discover your travel style
            </Text>
          </View>

          <View style={styles.comingSoon}>
            <Text style={styles.comingSoonText}>
              Soon
            </Text>
          </View>
        </TouchableOpacity>

        <MenuItem
          icon="settings-outline"
          title="Settings"
        />

        <MenuItem
          icon="help-circle-outline"
          title="Help & support"
        />

        <MenuItem
          icon="information-circle-outline"
          title="About ODYSSEUS"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>
        {value}
      </Text>

      <Text style={styles.statLabel}>
        {label}
      </Text>
    </View>
  );
}

function SectionHeader({
  title,
  count,
}: {
  title: string;
  count?: number;
}) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>
        {title}
      </Text>

      {typeof count === "number" && (
        <Text style={styles.sectionCount}>
          {count}
        </Text>
      )}
    </View>
  );
}

function MenuItem({
  icon,
  title,
}: {
  icon: any;
  title: string;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      activeOpacity={0.7}
    >
      <View style={styles.menuIcon}>
        <Ionicons
          name={icon}
          size={20}
          color="#111111"
        />
      </View>

      <Text style={styles.menuTitle}>
        {title}
      </Text>

      <Ionicons
        name="chevron-forward"
        size={19}
        color="#AAAAAA"
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    paddingHorizontal: 20,
    paddingBottom: 45,
  },

  logo: {
    marginTop: 8,

    fontSize: 21,
    fontWeight: "600",
    letterSpacing: 5,

    color: "#111111",
  },

  profileHeader: {
    marginTop: 23,

    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 72,
    height: 72,

    borderRadius: 36,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F5F5F5",

    borderWidth: 1,
    borderColor: "#E8E8E8",
  },

  profileInfo: {
    flex: 1,
    marginLeft: 15,
  },

  name: {
    fontSize: 26,
    fontWeight: "700",
    color: "#111111",
  },

  username: {
    marginTop: 3,

    fontSize: 13,
    color: "#888888",
  },

  settingsButton: {
    width: 42,
    height: 42,

    borderRadius: 21,

    borderWidth: 1,
    borderColor: "#E8E8E8",

    alignItems: "center",
    justifyContent: "center",
  },

  statsCard: {
    minHeight: 86,

    marginTop: 23,

    borderRadius: 20,

    borderWidth: 1,
    borderColor: "#E8E8E8",

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#FFFFFF",
  },

  stat: {
    flex: 1,
    alignItems: "center",
  },

  statValue: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
  },

  statLabel: {
    marginTop: 3,

    fontSize: 11,
    color: "#888888",
  },

  statDivider: {
    width: 1,
    height: 34,
    backgroundColor: "#ECECEC",
  },

  sectionHeader: {
    marginTop: 29,
    marginBottom: 13,

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  sectionTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#111111",
  },

  sectionCount: {
    fontSize: 12,
    color: "#999999",
  },

  emptyCard: {
    minHeight: 84,

    borderRadius: 18,

    borderWidth: 1,
    borderColor: "#E8E8E8",

    paddingHorizontal: 15,

    flexDirection: "row",
    alignItems: "center",
  },

  emptyIcon: {
    width: 43,
    height: 43,

    borderRadius: 22,

    backgroundColor: "#F5F5F5",

    alignItems: "center",
    justifyContent: "center",
  },

  emptyTextArea: {
    flex: 1,
    marginLeft: 13,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
  },

  emptyText: {
    marginTop: 4,

    fontSize: 12,
    lineHeight: 17,

    color: "#888888",
  },

  wishlistRow: {
    gap: 10,
    paddingRight: 5,
  },

  wishlistCard: {
    width: 180,
    height: 220,

    borderRadius: 20,

    overflow: "hidden",

    backgroundColor: "#F4F4F4",
  },

  wishlistImage: {
    width: "100%",
    height: "100%",
  },

  wishlistOverlay: {
    position: "absolute",

    left: 0,
    right: 0,
    bottom: 0,

    padding: 13,

    backgroundColor: "rgba(0,0,0,0.28)",
  },

  wishlistTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  wishlistLocation: {
    marginTop: 3,

    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
  },

  countryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",

    gap: 8,
  },

  countryChip: {
    height: 38,

    borderRadius: 19,

    borderWidth: 1,
    borderColor: "#E7E7E7",

    paddingHorizontal: 13,

    flexDirection: "row",
    alignItems: "center",
  },

  countryDot: {
    width: 8,
    height: 8,

    borderRadius: 4,

    backgroundColor: "#C9B8FF",

    marginRight: 7,
  },

  countryText: {
    fontSize: 13,
    fontWeight: "500",

    color: "#111111",
  },

  addCountryChip: {
    height: 38,

    borderRadius: 19,

    paddingHorizontal: 12,

    flexDirection: "row",
    alignItems: "center",

    backgroundColor: "#F6F6F6",
  },

  addCountryText: {
    marginLeft: 4,

    fontSize: 13,

    color: "#777777",
  },

  tripCard: {
    minHeight: 76,

    marginBottom: 9,

    borderRadius: 18,

    borderWidth: 1,
    borderColor: "#E8E8E8",

    paddingHorizontal: 13,

    flexDirection: "row",
    alignItems: "center",
  },

  tripIcon: {
    width: 43,
    height: 43,

    borderRadius: 22,

    backgroundColor: "#F5F5F5",

    alignItems: "center",
    justifyContent: "center",
  },

  tripInfo: {
    flex: 1,
    marginLeft: 12,
  },

  tripCity: {
    fontSize: 16,
    fontWeight: "600",

    color: "#111111",
  },

  tripMeta: {
    marginTop: 3,

    fontSize: 12,

    color: "#888888",
  },

  personalityCard: {
    minHeight: 78,

    marginTop: 13,

    borderRadius: 18,

    backgroundColor: "#F6F3FF",

    paddingHorizontal: 13,

    flexDirection: "row",
    alignItems: "center",
  },

  personalityIcon: {
    width: 43,
    height: 43,

    borderRadius: 22,

    backgroundColor: "#EEE8FF",

    alignItems: "center",
    justifyContent: "center",
  },

  personalityTextArea: {
    flex: 1,
    marginLeft: 12,
  },

  personalityTitle: {
    fontSize: 15,
    fontWeight: "600",

    color: "#111111",
  },

  personalityText: {
    marginTop: 3,

    fontSize: 12,

    color: "#777777",
  },

  comingSoon: {
    borderRadius: 12,

    backgroundColor: "#E7DFFF",

    paddingHorizontal: 9,
    paddingVertical: 5,
  },

  comingSoonText: {
    fontSize: 10,
    fontWeight: "600",

    color: "#765FD2",
  },

  menuItem: {
    minHeight: 62,

    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",

    flexDirection: "row",
    alignItems: "center",
  },

  menuIcon: {
    width: 37,
    alignItems: "flex-start",
  },

  menuTitle: {
    flex: 1,

    fontSize: 14,
    fontWeight: "500",

    color: "#111111",
  },
});