import React from "react";

import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { getFocusedRouteNameFromRoute } from "@react-navigation/native";

import { Ionicons } from "@expo/vector-icons";

import HomeScreen from "../screens/HomeScreen";

import DiscoverStack from "./DiscoverStack";

import FriendsStack from "./FriendsStack";
import type { RootTabParamList } from "./navigationTypes";
import ProfileStack from "./ProfileStack";

const Tab = createBottomTabNavigator<RootTabParamList>();
type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const nestedRoute = getFocusedRouteNameFromRoute(route);
        const hideTabBar =
          (route.name === "Profile" &&
            Boolean(nestedRoute && nestedRoute !== "ProfileMain")) ||
          (route.name === "Friends" &&
            Boolean(nestedRoute && nestedRoute !== "FriendsMain"));

        return {
          headerShown: false,

          tabBarActiveTintColor: "#111111",

          tabBarInactiveTintColor: "#A0A0A0",

          tabBarStyle: hideTabBar
            ? { display: "none" }
            : {
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

          tabBarIcon: ({ color, size, focused }) => {
            let iconName: IoniconName;

            if (route.name === "Home") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Discover") {
              iconName = focused ? "compass" : "compass-outline";
            } else if (route.name === "Friends") {
              iconName = focused ? "people" : "people-outline";
            } else {
              iconName = focused ? "person" : "person-outline";
            }

            return (
              <Ionicons name={iconName} size={size} color={color} />
            );
          },
        };
      }}
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
        component={FriendsStack}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileStack}
      />
    </Tab.Navigator>
  );
}
