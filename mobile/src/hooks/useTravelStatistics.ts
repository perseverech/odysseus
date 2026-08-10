import { useMemo } from "react";

import { useTravelData } from "../context/TravelDataContext";
import { calculateTravelStatistics } from "../utils/travelStatistics";

export function useTravelStatistics(wishlistItemCount = 0) {
  const { travelData } = useTravelData();

  return useMemo(
    () =>
      calculateTravelStatistics(travelData, wishlistItemCount),
    [travelData, wishlistItemCount]
  );
}
