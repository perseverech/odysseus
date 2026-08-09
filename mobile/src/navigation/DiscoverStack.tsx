import React from "react";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import DiscoverScreen from "../screens/DiscoverScreen";

import DiscoverDetailScreen from "../screens/DiscoverDetailScreen";

export type DiscoverStackParamList = {
  DiscoverMain: undefined;
  DiscoverDetail: {
    itemId: string;
  };
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
        name="DiscoverDetail"
        component={DiscoverDetailScreen}
      />
    </Stack.Navigator>
  );
}
