import React from "react";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DiscoverScreen from "../screens/DiscoverScreen";

import DiscoverDetailScreen from "../screens/DiscoverDetailScreen";
import DiscoverPlacesAlbumScreen from "../screens/DiscoverPlacesAlbumScreen";

export type DiscoverStackParamList = {
  DiscoverMain: undefined;
  DiscoverDetail: {
    itemId: string;
  };
  DiscoverPlacesAlbum: undefined;
};

const Stack =
  createNativeStackNavigator<DiscoverStackParamList>();

export default function DiscoverStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: "#FFFFFF",
        },
      }}
    >
      <Stack.Screen
        name="DiscoverMain"
        component={DiscoverScreen}
      />

      <Stack.Screen
        name="DiscoverPlacesAlbum"
        component={DiscoverPlacesAlbumScreen}
      />

      <Stack.Screen
        name="DiscoverDetail"
        component={DiscoverDetailScreen}
      />
    </Stack.Navigator>
  );
}
