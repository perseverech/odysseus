import AsyncStorage from "@react-native-async-storage/async-storage";

import type { TravelData } from "../models/travel";

const TRAVEL_DATA_STORAGE_KEY = "odysseus_travel_data_v1";

export type TravelStorage = {
  load: () => Promise<unknown | null>;
  save: (data: TravelData) => Promise<void>;
};

export const asyncTravelStorage: TravelStorage = {
  async load() {
    const stored = await AsyncStorage.getItem(TRAVEL_DATA_STORAGE_KEY);

    return stored ? JSON.parse(stored) : null;
  },

  async save(data) {
    await AsyncStorage.setItem(
      TRAVEL_DATA_STORAGE_KEY,
      JSON.stringify(data)
    );
  },
};
