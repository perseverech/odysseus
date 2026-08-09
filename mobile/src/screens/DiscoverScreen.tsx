import React, { useState } from "react";

import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

function normalizeSearchValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .trim();
}

export default function DiscoverScreen({ navigation }: Props) {
  const [activeFilter, setActiveFilter] =
    useState("For you");
  const [searchQuery, setSearchQuery] =
    useState("");

  const { isSaved, toggleWishlist } =
    useWishlist();

  const normalizedQuery =
    normalizeSearchValue(searchQuery);

  const searchTerms = normalizedQuery
    .split(/\s+/)
    .filter(Boolean);

  const searchResults = discoverItems.filter((item) => {
    const searchableText = normalizeSearchValue(
      [
        item.title,
        item.location,
        item.country,
        item.category,
        item.description,
        item.note ?? "",
        item.keywords.join(" "),
      ].join(" ")
    );

    return searchTerms.every((term) =>
      searchableText.includes(term)
    );
  });

  const visibleSections = normalizedQuery
    ? [
        {
          title: "Search results",
          category: "SearchResults",
          items: searchResults,
        },
      ]
    : recommendationSections
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
        keyboardShouldPersistTaps="handled"
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

        <View style={styles.searchContainer}>
          <Ionicons
            name="search-outline"
            size={19}
            color="#777777"
          />

          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholder="Search places, events, routes"
            placeholderTextColor="#999999"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />

          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearSearch}
              onPress={() => setSearchQuery("")}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
            >
              <Ionicons
                name="close-circle"
                size={19}
                color="#A0A0A0"
              />
            </TouchableOpacity>
          )}
        </View>

        {!normalizedQuery && (
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
        )}

        {visibleSections.map((section) => (
          <View
            key={section.category}
            style={[
              styles.section,
              normalizedQuery && styles.searchSection,
            ]}
          >
            <Text style={styles.sectionTitle}>
              {section.title}
            </Text>

            {normalizedQuery && (
              <Text style={styles.resultCount}>
                {section.items.length === 1
                  ? "1 suggestion"
                  : `${section.items.length} suggestions`}
              </Text>
            )}

            {section.items.length > 0 ? (
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
            ) : (
              <View style={styles.emptySearch}>
                <Ionicons
                  name="search-outline"
                  size={28}
                  color="#A0A0A0"
                />

                <Text style={styles.emptySearchTitle}>
                  No suggestions found
                </Text>

                <Text style={styles.emptySearchText}>
                  Try a country, activity or event name.
                </Text>
              </View>
            )}
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

  searchContainer: {
    height: 48,
    marginTop: 18,
    marginHorizontal: 20,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E3E3E3",
    borderRadius: 16,
    backgroundColor: "#F8F8F8",
  },

  searchInput: {
    flex: 1,
    height: "100%",
    marginLeft: 9,
    paddingVertical: 0,
    fontSize: 15,
    color: "#111111",
  },

  clearSearch: {
    paddingLeft: 9,
    paddingVertical: 8,
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

  searchSection: {
    marginTop: 20,
  },

  sectionTitle: {
    marginBottom: 12,
    paddingHorizontal: 20,
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
  },

  resultCount: {
    marginTop: -7,
    marginBottom: 12,
    paddingHorizontal: 20,
    fontSize: 13,
    color: "#777777",
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

  emptySearch: {
    marginHorizontal: 20,
    paddingHorizontal: 24,
    paddingVertical: 34,
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: "#F7F7F7",
  },

  emptySearchTitle: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: "600",
    color: "#222222",
  },

  emptySearchText: {
    marginTop: 5,
    fontSize: 13,
    color: "#777777",
    textAlign: "center",
  },
});
