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

export default function App() {
  return (
    <GestureHandlerRootView
      style={{ flex: 1 }}
    >
      <SafeAreaProvider>
        <WishlistProvider>
          <NavigationContainer>
            <BottomTabs />
          </NavigationContainer>
        </WishlistProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
