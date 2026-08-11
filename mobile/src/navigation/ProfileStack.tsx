import React from "react";

import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AddFlightScreen from "../screens/AddFlightScreen";
import AddTripScreen from "../screens/AddTripScreen";
import AddCustomPlaceScreen from "../screens/AddCustomPlaceScreen";
import FlightDetailScreen from "../screens/FlightDetailScreen";
import PackingChecklistScreen from "../screens/PackingChecklistScreen";
import ProfileScreen from "../screens/ProfileScreen";
import TripDetailScreen from "../screens/TripDetailScreen";
import TripPlacesScreen from "../screens/TripPlacesScreen";
import type { ProfileStackParamList } from "./navigationTypes";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#FFFFFF" },
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
      />
      <Stack.Screen
        name="TripDetail"
        component={TripDetailScreen}
      />
      <Stack.Screen
        name="AddTrip"
        component={AddTripScreen}
      />
      <Stack.Screen
        name="TripPlaces"
        component={TripPlacesScreen}
      />
      <Stack.Screen
        name="PackingChecklist"
        component={PackingChecklistScreen}
      />
      <Stack.Screen
        name="AddCustomPlace"
        component={AddCustomPlaceScreen}
      />
      <Stack.Screen
        name="FlightDetail"
        component={FlightDetailScreen}
      />
      <Stack.Screen
        name="AddFlight"
        component={AddFlightScreen}
      />
    </Stack.Navigator>
  );
}
