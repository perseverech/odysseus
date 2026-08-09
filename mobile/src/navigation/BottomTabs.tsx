import React from "react";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";

import DiscoverStack from "./DiscoverStack";

import FriendsScreen from "../screens/FriendsScreen";

import ProfileScreen from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor: "#111111",

        tabBarInactiveTintColor: "#A0A0A0",

        tabBarStyle: {
          backgroundColor: "#FFFFFF",

          borderTopWidth: 0.5,

          borderTopColor: "#E8E8E8",

          height: 82,

          paddingTop: 7,
        },

        tabBarLabelStyle: {
          fontSize: 11,

          fontWeight: "500",

          marginBottom: 5,
        },

        tabBarIcon: ({
          color,
          size,
          focused,
        }) => {
          let iconName: any;

          if (route.name === "Home") {
            iconName = focused
              ? "home"
              : "home-outline";
          } else if (route.name === "Discover") {
            iconName = focused
              ? "compass"
              : "compass-outline";
          } else if (route.name === "Friends") {
            iconName = focused
              ? "people"
              : "people-outline";
          } else {
            iconName = focused
              ? "person"
              : "person-outline";
          }

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
      />

      <Tab.Screen
        name="Discover"
        component={DiscoverStack}
      />

      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
}