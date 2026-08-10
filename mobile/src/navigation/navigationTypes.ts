import type { NavigatorScreenParams } from "@react-navigation/native";

import type { DiscoverStackParamList } from "./DiscoverStack";

export type FriendsStackParamList = {
  FriendsMain: undefined;
  FriendProfile: {
    friendId: string;
  };
  SharedTripDetail: {
    tripId: string;
  };
  AddPlaceToSharedTrip: {
    tripId: string;
  };
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  TripDetail: {
    tripId: string;
  };
  AddTrip:
    | {
        tripId?: string;
        initialPlaceId?: string;
      }
    | undefined;
  TripPlaces: {
    tripId: string;
  };
  AddCustomPlace: {
    tripId: string;
  };
  FlightDetail: {
    flightId: string;
  };
  AddFlight:
    | {
        tripId?: string;
        flightId?: string;
      }
    | undefined;
};

export type RootTabParamList = {
  Home: undefined;
  Discover:
    | NavigatorScreenParams<DiscoverStackParamList>
    | undefined;
  Friends:
    | NavigatorScreenParams<FriendsStackParamList>
    | undefined;
  Profile:
    | NavigatorScreenParams<ProfileStackParamList>
    | undefined;
};
