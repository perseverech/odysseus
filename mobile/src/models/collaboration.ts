export const CURRENT_USER_ID = "me";

export type Friend = {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  countriesVisited?: number;
};

export type SharedTripRouteStatus =
  | "not_started"
  | "in_progress"
  | "ready";

export type SharedTrip = {
  id: string;
  title: string;
  city: string;
  country: string;
  startDate?: string;
  endDate?: string;
  participantIds: string[];
  ideaIds: string[];
  routeStatus: SharedTripRouteStatus;
};

export type TripIdea = {
  id: string;
  tripId: string;
  title: string;
  location?: string;
  category?: string;
  addedByFriendId: string;
  votes: string[];
};

export type Invitation = {
  id: string;
  fromFriendId: string;
  city: string;
  country: string;
  startDate?: string;
  endDate?: string;
};

export type CollaborationData = {
  friends: Friend[];
  sharedTrips: SharedTrip[];
  tripIdeas: TripIdea[];
  invitations: Invitation[];
};

export type CreateTripIdeaInput = Pick<
  TripIdea,
  "title" | "location" | "category"
>;
