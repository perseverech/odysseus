import React, {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

import { createInitialCollaborationData } from "../data/initialCollaborationData";
import {
  CURRENT_USER_ID,
  type CollaborationData,
  type CreateTripIdeaInput,
  type Friend,
  type SharedTrip,
  type TripIdea,
} from "../models/collaboration";
import {
  asyncCollaborationStorage,
  type CollaborationStorage,
} from "../storage/collaborationStorage";

export const CURRENT_USER: Friend = {
  id: CURRENT_USER_ID,
  name: "Nazar",
  username: "@nazar",
  countriesVisited: 12,
};

type FriendsContextValue = {
  currentUser: Friend;
  friends: Friend[];
  sharedTrips: SharedTrip[];
  tripIdeas: TripIdea[];
  invitations: CollaborationData["invitations"];
  acceptInvitation: (invitationId: string) => SharedTrip | null;
  declineInvitation: (invitationId: string) => void;
  addTripIdea: (tripId: string, input: CreateTripIdeaInput) => TripIdea;
  removeTripIdea: (ideaId: string) => void;
  toggleVote: (ideaId: string) => void;
  addFriendToTrip: (tripId: string, friendId: string) => void;
  removeFriendFromTrip: (tripId: string, friendId: string) => void;
  buildRoute: (tripId: string) => void;
  getPerson: (personId: string) => Friend | undefined;
};

const FriendsContext = createContext<FriendsContextValue | undefined>(
  undefined
);

function migrateCollaborationData(value: unknown): CollaborationData {
  const fallback = createInitialCollaborationData();

  if (!value || typeof value !== "object") return fallback;

  const stored = value as Partial<CollaborationData>;

  return {
    friends: Array.isArray(stored.friends) ? stored.friends : fallback.friends,
    sharedTrips: Array.isArray(stored.sharedTrips)
      ? stored.sharedTrips
      : fallback.sharedTrips,
    tripIdeas: Array.isArray(stored.tripIdeas)
      ? stored.tripIdeas
      : fallback.tripIdeas,
    invitations: Array.isArray(stored.invitations)
      ? stored.invitations
      : fallback.invitations,
  };
}

function optionalText(value: string | undefined) {
  const trimmed = value?.trim();

  return trimmed || undefined;
}

export function FriendsProvider({
  children,
  storage = asyncCollaborationStorage,
}: {
  children: ReactNode;
  storage?: CollaborationStorage;
}) {
  const [data, setData] = useState<CollaborationData>(() =>
    createInitialCollaborationData()
  );
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const stored = await storage.load();

        if (stored) setData(migrateCollaborationData(stored));
      } catch (error) {
        console.log("Friends data load error:", error);
      } finally {
        setIsHydrated(true);
      }
    }

    loadData();
  }, [storage]);

  useEffect(() => {
    if (!isHydrated) return;

    storage.save(data).catch((error) => {
      console.log("Friends data save error:", error);
    });
  }, [data, isHydrated, storage]);

  function acceptInvitation(invitationId: string) {
    const invitation = data.invitations.find(
      (item) => item.id === invitationId
    );

    if (!invitation) return null;

    const trip: SharedTrip = {
      id: `shared-${invitation.city
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      title: invitation.city,
      city: invitation.city,
      country: invitation.country,
      startDate: invitation.startDate,
      endDate: invitation.endDate,
      participantIds: [CURRENT_USER_ID, invitation.fromFriendId],
      ideaIds: [],
      routeStatus: "not_started",
    };

    setData((current) => ({
      ...current,
      sharedTrips: [...current.sharedTrips, trip],
      invitations: current.invitations.filter(
        (item) => item.id !== invitationId
      ),
    }));

    return trip;
  }

  function declineInvitation(invitationId: string) {
    setData((current) => ({
      ...current,
      invitations: current.invitations.filter(
        (item) => item.id !== invitationId
      ),
    }));
  }

  function addTripIdea(tripId: string, input: CreateTripIdeaInput) {
    const idea: TripIdea = {
      id: `idea-${input.title
        .trim()
        .toLocaleLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
      tripId,
      title: input.title.trim(),
      location: optionalText(input.location),
      category: optionalText(input.category),
      addedByFriendId: CURRENT_USER_ID,
      votes: [],
    };

    setData((current) => ({
      ...current,
      tripIdeas: [...current.tripIdeas, idea],
      sharedTrips: current.sharedTrips.map((trip) =>
        trip.id === tripId
          ? { ...trip, ideaIds: [...trip.ideaIds, idea.id] }
          : trip
      ),
    }));

    return idea;
  }

  function removeTripIdea(ideaId: string) {
    setData((current) => ({
      ...current,
      tripIdeas: current.tripIdeas.filter((idea) => idea.id !== ideaId),
      sharedTrips: current.sharedTrips.map((trip) => ({
        ...trip,
        ideaIds: trip.ideaIds.filter((id) => id !== ideaId),
      })),
    }));
  }

  function toggleVote(ideaId: string) {
    setData((current) => ({
      ...current,
      tripIdeas: current.tripIdeas.map((idea) => {
        if (idea.id !== ideaId) return idea;

        const hasVoted = idea.votes.includes(CURRENT_USER_ID);

        return {
          ...idea,
          votes: hasVoted
            ? idea.votes.filter((id) => id !== CURRENT_USER_ID)
            : [...idea.votes, CURRENT_USER_ID],
        };
      }),
    }));
  }

  function addFriendToTrip(tripId: string, friendId: string) {
    setData((current) => {
      if (!current.friends.some((friend) => friend.id === friendId)) {
        return current;
      }

      return {
        ...current,
        sharedTrips: current.sharedTrips.map((trip) =>
          trip.id === tripId
            ? {
                ...trip,
                participantIds: Array.from(
                  new Set([...trip.participantIds, friendId])
                ),
              }
            : trip
        ),
      };
    });
  }

  function removeFriendFromTrip(tripId: string, friendId: string) {
    if (friendId === CURRENT_USER_ID) return;

    setData((current) => ({
      ...current,
      sharedTrips: current.sharedTrips.map((trip) =>
        trip.id === tripId
          ? {
              ...trip,
              participantIds: trip.participantIds.filter(
                (id) => id !== friendId
              ),
            }
          : trip
      ),
    }));
  }

  function buildRoute(tripId: string) {
    setData((current) => ({
      ...current,
      sharedTrips: current.sharedTrips.map((trip) =>
        trip.id === tripId
          ? { ...trip, routeStatus: "in_progress" }
          : trip
      ),
    }));
  }

  function getPerson(personId: string) {
    return personId === CURRENT_USER_ID
      ? CURRENT_USER
      : data.friends.find((friend) => friend.id === personId);
  }

  return (
    <FriendsContext.Provider
      value={{
        currentUser: CURRENT_USER,
        friends: data.friends,
        sharedTrips: data.sharedTrips,
        tripIdeas: data.tripIdeas,
        invitations: data.invitations,
        acceptInvitation,
        declineInvitation,
        addTripIdea,
        removeTripIdea,
        toggleVote,
        addFriendToTrip,
        removeFriendFromTrip,
        buildRoute,
        getPerson,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
}

export function useFriends() {
  const context = useContext(FriendsContext);

  if (!context) {
    throw new Error("useFriends must be used inside FriendsProvider");
  }

  return context;
}
