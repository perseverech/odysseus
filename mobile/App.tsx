import React from "react";

import {
  NavigationContainer,
} from "@react-navigation/native";

import {
  GestureHandlerRootView,
} from "react-native-gesture-handler";

import {
  SafeAreaProvider,
} from "react-native-safe-area-context";

import BottomTabs from "./src/navigation/BottomTabs";
import { WishlistProvider } from "./src/context/WishlistContext";
import { TravelDataProvider } from "./src/context/TravelDataContext";
import { FriendsProvider } from "./src/context/FriendsContext";

export default function App() {
  return (
    <GestureHandlerRootView
      style={{ flex: 1 }}
    >
      <SafeAreaProvider>
        <WishlistProvider>
          <TravelDataProvider>
            <FriendsProvider>
              <NavigationContainer>
                <BottomTabs />
              </NavigationContainer>
            </FriendsProvider>
          </TravelDataProvider>
        </WishlistProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
