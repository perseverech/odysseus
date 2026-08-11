import React from "react";
import { ScrollView, StyleSheet } from "react-native";

import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import DreamCountriesSection from "../components/profile/DreamCountriesSection";
import FlightsSection from "../components/profile/FlightsSection";
import PackingListsSection from "../components/profile/PackingListsSection";
import ProfileFooter from "../components/profile/ProfileFooter";
import ProfileHero from "../components/profile/ProfileHero";
import TravelStatsSection from "../components/profile/TravelStatsSection";
import UpcomingTripsSection from "../components/profile/UpcomingTripsSection";
import WishlistSection from "../components/profile/WishlistSection";
import { useWishlist } from "../context/WishlistContext";
import { useTravelStatistics } from "../hooks/useTravelStatistics";
import type {
  ProfileStackParamList,
  RootTabParamList,
} from "../navigation/navigationTypes";

type Props = CompositeScreenProps<
  NativeStackScreenProps<ProfileStackParamList, "ProfileMain">,
  BottomTabScreenProps<RootTabParamList, "Profile">
>;

export default function ProfileScreen({ navigation }: Props) {
  const { wishlist } = useWishlist();
  const wishlistItemCount = wishlist.length;
  const statistics = useTravelStatistics(wishlistItemCount);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <ProfileHero />
        <TravelStatsSection statistics={statistics} />
        <WishlistSection
          onOpenItem={(itemId) =>
            navigation.navigate("Discover", {
              screen: "DiscoverDetail",
              params: { itemId },
            })
          }
        />
        <DreamCountriesSection />
        <UpcomingTripsSection
          onAddTrip={() => navigation.navigate("AddTrip")}
          onOpenTrip={(tripId) =>
            navigation.navigate("TripDetail", { tripId })
          }
        />
        <PackingListsSection
          onOpenChecklist={(tripId) =>
            navigation.navigate("PackingChecklist", { tripId })
          }
        />
        <FlightsSection
          onAddFlight={() => navigation.navigate("AddFlight")}
          onOpenFlight={(flightId) =>
            navigation.navigate("FlightDetail", { flightId })
          }
        />
        <ProfileFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  content: { paddingHorizontal: 20, paddingBottom: 45 },
});
