import React from "react";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AddTripIdeaScreen from "../screens/AddTripIdeaScreen";
import FriendProfileScreen from "../screens/FriendProfileScreen";
import FriendsScreen from "../screens/FriendsScreen";
import SharedTripDetailScreen from "../screens/SharedTripDetailScreen";
import type { FriendsStackParamList } from "./navigationTypes";

const Stack = createNativeStackNavigator<FriendsStackParamList>();

export default function FriendsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#FFFFFF" },
      }}
    >
      <Stack.Screen name="FriendsMain" component={FriendsScreen} />
      <Stack.Screen name="FriendProfile" component={FriendProfileScreen} />
      <Stack.Screen
        name="SharedTripDetail"
        component={SharedTripDetailScreen}
      />
      <Stack.Screen
        name="AddPlaceToSharedTrip"
        component={AddTripIdeaScreen}
      />
    </Stack.Navigator>
  );
}
