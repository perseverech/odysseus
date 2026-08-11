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

export function usePlacesCatalog(customPlaces: Place[], livePlaces: Place[] = []) {
  const provider = useMemo(
    () => createLocalPlacesProvider([...livePlaces, ...customPlaces]),
    [customPlaces, livePlaces]
  );

  return usePlacesProvider(provider);
}

export function usePlacesQuery(
  provider: PlacesProvider,
  query: Parameters<PlacesProvider["getPlaces"]>[0],
  enabled = true
) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const city = query?.city;
  const country = query?.country;
  const search = query?.search;

  useEffect(() => {
    if (!enabled) {
      setPlaces([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    let isActive = true;

    setIsLoading(true);
    setError(null);
    provider
      .getPlaces({ city, country, search })
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
  }, [city, country, enabled, provider, reloadToken, search]);

  return {
    places,
    isLoading,
    error,
    reload: () => setReloadToken((current) => current + 1),
  };
}
