import { useEffect, useMemo, useState } from "react";

import type { Place } from "../models/place";
import {
  createLocalPlacesProvider,
  type PlacesProvider,
} from "../services/placesProvider";

export function usePlacesProvider(provider: PlacesProvider) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setError(null);
    provider
      .getPlaces()
      .then((nextPlaces) => {
        if (isActive) setPlaces(nextPlaces);
      })
      .catch((reason: unknown) => {
        if (!isActive) return;

        setPlaces([]);
        setError(
          reason instanceof Error ? reason.message : "Could not load places."
        );
      })
      .finally(() => {
        if (isActive) setIsLoading(false);
      });

    return () => {
      isActive = false;
    };
  }, [provider]);

  return { places, isLoading, error };
}

export function usePlacesCatalog(customPlaces: Place[]) {
  const provider = useMemo(
    () => createLocalPlacesProvider(customPlaces),
    [customPlaces]
  );

  return usePlacesProvider(provider);
}
