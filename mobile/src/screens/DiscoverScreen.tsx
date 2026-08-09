import React, { useState } from "react";

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
import type { NativeStackScreenProps } from "@react-navigation/native-stack";

import {
  discoverItems,
  DiscoverItem,
} from "../data/discoverItems";
import type { DiscoverStackParamList } from "../navigation/DiscoverStack";

import { useWishlist } from "../context/WishlistContext";

const filters = [
  "For you",
  "Experiences",
  "Places",
  "Routes",
];

const recommendationSections: Array<{
  title: string;
  category: DiscoverItem["category"];
}> = [
  {
    title: "Experiences",
    category: "Experience",
  },
  {
    title: "Places",
    category: "Place",
  },
  {
    title: "Routes",
    category: "Route",
  },
];

type Props = NativeStackScreenProps<
  DiscoverStackParamList,
  "DiscoverMain"
>;

export default function DiscoverScreen({ navigation }: Props) {
  const [activeFilter, setActiveFilter] =
    useState("For you");

  const { isSaved, toggleWishlist } =
    useWishlist();

  const visibleSections = recommendationSections
    .filter(
      (section) =>
        activeFilter === "For you" ||
        section.title === activeFilter
    )
    .map((section) => ({
      ...section,
      items: discoverItems.filter(
        (item) => item.category === section.category
      ),
    }));

  function openItem(item: DiscoverItem) {
    navigation.navigate(
      "DiscoverDetail",
      {
        itemId: item.id,
      }
    );
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={["top", "left", "right"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        bounces={false}
        overScrollMode="never"
      >
        <Text style={styles.logo}>
          ODYSSEUS
        </Text>

        <Text style={styles.title}>
          Discover
        </Text>

        <Text style={styles.subtitle}>
          Find something worth travelling for.
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((filter) => {
            const active =
              activeFilter === filter;

            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filter,
                  active &&
                    styles.filterActive,
                ]}
                onPress={() =>
                  setActiveFilter(filter)
                }
              >
                <Text
                  style={[
                    styles.filterText,
                    active &&
                      styles.filterTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {visibleSections.map((section) => (
          <View
            key={section.category}
            style={styles.section}
          >
            <Text style={styles.sectionTitle}>
              {section.title}
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recommendations}
              decelerationRate="fast"
              snapToInterval={298}
              snapToAlignment="start"
              disableIntervalMomentum
              nestedScrollEnabled
            >
              {section.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.card}
                  activeOpacity={0.85}
                  onPress={() => openItem(item)}
                >
                  <Image
                    source={{ uri: item.image }}
                    style={styles.image}
                  />

                  <TouchableOpacity
                    style={styles.heart}
                    onPress={() =>
                      toggleWishlist(item.id)
                    }
                  >
                    <Ionicons
                      name={
                        isSaved(item.id)
                          ? "heart"
                          : "heart-outline"
                      }
                      size={20}
                      color={
                        isSaved(item.id)
                          ? "#B49CFF"
                          : "#111111"
                      }
                    />
                  </TouchableOpacity>

                  <View style={styles.cardContent}>
                    <Text style={styles.category}>
                      {item.category.toUpperCase()}
                    </Text>

                    <Text style={styles.cardTitle}>
                      {item.title}
                    </Text>

                    <Text style={styles.location}>
                      {item.location}, {item.country}
                    </Text>

                    <View style={styles.cardBottom}>
                      <Text style={styles.price}>
                        {item.price}
                      </Text>

                      <Ionicons
                        name="arrow-forward"
                        size={17}
                        color="#111111"
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  content: {
    paddingBottom: 35,
  },

  logo: {
    marginTop: 8,
    paddingHorizontal: 20,

    fontSize: 21,
    fontWeight: "600",
    letterSpacing: 5,

    color: "#111111",
  },

  title: {
    marginTop: 14,
    paddingHorizontal: 20,

    fontSize: 34,
    fontWeight: "700",

    color: "#111111",
  },

  subtitle: {
    marginTop: 5,

    paddingHorizontal: 20,

    fontSize: 14,

    color: "#777777",
  },

  filters: {
    paddingHorizontal: 20,

    paddingTop: 18,

    paddingBottom: 15,

    gap: 8,
  },

  filter: {
    borderWidth: 1,

    borderColor: "#E8E8E8",

    borderRadius: 18,

    paddingHorizontal: 14,

    paddingVertical: 9,
  },

  filterActive: {
    backgroundColor: "#111111",

    borderColor: "#111111",
  },

  filterText: {
    fontSize: 13,

    color: "#555555",
  },

  filterTextActive: {
    color: "#FFFFFF",
  },

  section: {
    marginBottom: 26,
  },

  sectionTitle: {
    marginBottom: 12,
    paddingHorizontal: 20,
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
  },

  recommendations: {
    paddingHorizontal: 20,

    paddingBottom: 4,

    gap: 12,
  },

  card: {
    width: 286,

    borderRadius: 24,

    overflow: "hidden",

    borderWidth: 1,

    borderColor: "#E8E8E8",

    backgroundColor: "#FFFFFF",
  },

  image: {
    width: "100%",

    height: 220,

    backgroundColor: "#F4F4F4",
  },

  heart: {
    position: "absolute",

    top: 12,

    right: 12,

    width: 38,

    height: 38,

    borderRadius: 19,

    backgroundColor:
      "rgba(255,255,255,0.92)",

    alignItems: "center",

    justifyContent: "center",
  },

  cardContent: {
    padding: 16,
  },

  category: {
    fontSize: 10,

    fontWeight: "700",

    letterSpacing: 1.4,

    color: "#999999",
  },

  cardTitle: {
    marginTop: 6,

    fontSize: 21,

    fontWeight: "700",

    color: "#111111",
  },

  location: {
    marginTop: 4,

    fontSize: 13,

    color: "#777777",
  },

  cardBottom: {
    marginTop: 15,

    flexDirection: "row",

    justifyContent:
      "space-between",

    alignItems: "center",
  },

  price: {
    fontSize: 14,

    fontWeight: "600",

    color: "#111111",
  },
});
