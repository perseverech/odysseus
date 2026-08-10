import AsyncStorage from "@react-native-async-storage/async-storage";

import type { CollaborationData } from "../models/collaboration";

const COLLABORATION_STORAGE_KEY = "odysseus_collaboration_v1";

export type CollaborationStorage = {
  load: () => Promise<unknown | null>;
  save: (data: CollaborationData) => Promise<void>;
};

export const asyncCollaborationStorage: CollaborationStorage = {
  async load() {
    const stored = await AsyncStorage.getItem(COLLABORATION_STORAGE_KEY);

    return stored ? JSON.parse(stored) : null;
  },

  async save(data) {
    await AsyncStorage.setItem(
      COLLABORATION_STORAGE_KEY,
      JSON.stringify(data)
    );
  },
};
