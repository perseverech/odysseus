import React from "react";

import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useWishlist } from "../context/WishlistContext";

import { discoverItems } from "../data/discoverItems";

export default function ProfileScreen() {
  const { wishlist } =
    useWishlist();

  const savedItems =
    discoverItems.filter((item) =>
      wishlist.includes(item.id)
    );

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
          Profile
        </Text>

        <Text style={styles.section}>
          Wishlist
        </Text>

        {savedItems.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              Your wishlist is empty
            </Text>

            <Text style={styles.emptyText}>
              Save places and experiences from Discover.
            </Text>
          </View>
        ) : (
          savedItems.map((item) => (
            <View
              key={item.id}
              style={styles.card}
            >
              <Image
                source={{
                  uri: item.image,
                }}
                style={styles.image}
              />

              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>
                  {item.title}
                </Text>

                <Text style={styles.location}>
                  {item.location},{" "}
                  {item.country}
                </Text>

                <Text style={styles.price}>
                  {item.price}
                </Text>
              </View>
            </View>
          ))
        )}
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
    paddingHorizontal: 20,

    paddingBottom: 40,
  },

  logo: {
    marginTop: 8,

    fontSize: 21,

    fontWeight: "600",

    letterSpacing: 5,

    color: "#111111",
  },

  title: {
    marginTop: 14,

    fontSize: 34,

    fontWeight: "700",

    color: "#111111",
  },

  section: {
    marginTop: 30,

    marginBottom: 14,

    fontSize: 22,

    fontWeight: "700",

    color: "#111111",
  },

  empty: {
    borderRadius: 20,

    borderWidth: 1,

    borderColor: "#E8E8E8",

    padding: 20,
  },

  emptyTitle: {
    fontSize: 17,

    fontWeight: "600",

    color: "#111111",
  },

  emptyText: {
    marginTop: 6,

    fontSize: 13,

    lineHeight: 19,

    color: "#777777",
  },

  card: {
    minHeight: 95,

    marginBottom: 11,

    borderRadius: 18,

    borderWidth: 1,

    borderColor: "#E8E8E8",

    overflow: "hidden",

    flexDirection: "row",
  },

  image: {
    width: 105,

    backgroundColor: "#F3F3F3",
  },

  cardContent: {
    flex: 1,

    padding: 13,

    justifyContent: "center",
  },

  cardTitle: {
    fontSize: 16,

    fontWeight: "600",

    color: "#111111",
  },

  location: {
    marginTop: 4,

    fontSize: 12,

    color: "#777777",
  },

  price: {
    marginTop: 7,

    fontSize: 12,

    fontWeight: "600",

    color: "#111111",
  },
});
