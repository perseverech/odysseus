import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import {
  Camera,
  type CameraRef,
  GeoJSONSource,
  Images,
  Layer,
  Marker,
  type LngLat,
  Map,
  type MapProps,
} from "@maplibre/maplibre-react-native";

import worldGeoJson from "../data/world.json";
import {
  getMapCountryId,
  normalizeCountryName,
} from "../data/travelCatalog";
import {
  getLocationFocusZoom,
  type LocationSearchResult,
} from "../services/locationSearch";
const sourceWorldData =
  worldGeoJson as unknown as CountryMapData;

type Props = {
  visitedCountries: string[];
  plannedCountries: string[];
  onVisitedCountriesChange: (countries: string[]) => void;
  onPlannedCountriesChange: (countries: string[]) => void;
  focusedCountryName?: string;
  focusedLocation?: LocationSearchResult | null;
};

type SelectedCountry = {
  id: string;
  name: string;
  labelCoordinate: LngLat;
} | null;

type SourceCountryProperties = {
  [key: string]: unknown;
  ISO_A2?: string;
  iso_a2?: string;
  "ISO3166-1-Alpha-2"?: string;
  ADMIN?: string;
  NAME?: string;
  name?: string;
};

type CountryGeometry =
  | GeoJSON.Polygon
  | GeoJSON.MultiPolygon;

type SourceCountryMapData = GeoJSON.FeatureCollection<
  CountryGeometry,
  SourceCountryProperties
>;

type CountryProperties = SourceCountryProperties & {
  countryId: string;
  countryName: string;
};

type CountryMapData = GeoJSON.FeatureCollection<
  CountryGeometry,
  CountryProperties
>;

type CountryLabelData = GeoJSON.FeatureCollection<
  GeoJSON.Point,
  { countryName: string }
>;

type MapPressEvent = Parameters<
  NonNullable<MapProps["onPress"]>
>[0];

type RegionChangeEvent = Parameters<
  NonNullable<MapProps["onRegionDidChange"]>
>[0];

type CountryBounds = {
  minLongitude: number;
  minLatitude: number;
  maxLongitude: number;
  maxLatitude: number;
};

const sourceWorldGeoJson =
  worldGeoJson as SourceCountryMapData;

const WATER_COLOR = "#EAF4FB";
const LAND_COLOR = "#FFFFFF";
const MAP_BORDER_COLOR = "#C9B29B";

const MAP_STYLE =
  process.env.EXPO_PUBLIC_MAP_STYLE_URL ??
  "https://demotiles.maplibre.org/style.json";

const SELECTED_COLOR = "#A8DADC";
const VISITED_COLOR = "#A78BFA";
const PLANNED_COLOR = "#F4A261";
const LABEL_BACKGROUND_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGN49+brJQAJPQOiRN1XSAAAAABJRU5ErkJggg==";
const MAP_IMAGES = {
  selectedCountryLabelBackground: LABEL_BACKGROUND_IMAGE,
};
const INITIAL_ZOOM = 1.2;
const SMALL_COUNTRY_MAX_SPAN = 2;
const SMALL_COUNTRY_HIT_RADIUS = 24;

function getCountryFocusZoom(bounds: CountryBounds) {
  const longitudeSpan =
    bounds.maxLongitude - bounds.minLongitude;
  const latitudeSpan =
    bounds.maxLatitude - bounds.minLatitude;
  const largestSpan = Math.max(longitudeSpan, latitudeSpan);

  if (largestSpan <= 1) {
    return 6;
  }

  if (largestSpan <= 5) {
    return 4.8;
  }

  if (largestSpan <= 15) {
    return 3.8;
  }

  if (largestSpan <= 40) {
    return 3;
  }

  return 2.2;
}

function getCountryBounds(
  geometry: CountryGeometry
): CountryBounds {
  const bounds: CountryBounds = {
    minLongitude: Infinity,
    minLatitude: Infinity,
    maxLongitude: -Infinity,
    maxLatitude: -Infinity,
  };

  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.coordinates;

  for (const polygon of polygons) {
    for (const ring of polygon) {
      for (const [longitude, latitude] of ring) {
        bounds.minLongitude = Math.min(
          bounds.minLongitude,
          longitude
        );
        bounds.minLatitude = Math.min(
          bounds.minLatitude,
          latitude
        );
        bounds.maxLongitude = Math.max(
          bounds.maxLongitude,
          longitude
        );
        bounds.maxLatitude = Math.max(
          bounds.maxLatitude,
          latitude
        );
      }
    }
  }

  return bounds;
}

function isPointInRing(
  [longitude, latitude]: GeoJSON.Position,
  ring: GeoJSON.Position[]
) {
  let inside = false;

  for (
    let current = 0, previous = ring.length - 1;
    current < ring.length;
    previous = current++
  ) {
    const [currentLongitude, currentLatitude] = ring[current];
    const [previousLongitude, previousLatitude] = ring[previous];

    const crossesLatitude =
      currentLatitude > latitude !==
      previousLatitude > latitude;

    const intersectionLongitude =
      ((previousLongitude - currentLongitude) *
        (latitude - currentLatitude)) /
        (previousLatitude - currentLatitude) +
      currentLongitude;

    if (
      crossesLatitude &&
      longitude < intersectionLongitude
    ) {
      inside = !inside;
    }
  }

  return inside;
}

function isPointInCountry(
  point: GeoJSON.Position,
  geometry: CountryGeometry
) {
  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.coordinates;

  return polygons.some(([outerRing, ...holes]) => {
    if (!outerRing || !isPointInRing(point, outerRing)) {
      return false;
    }

    return !holes.some((hole) => isPointInRing(point, hole));
  });
}

function getRingArea(ring: GeoJSON.Position[]) {
  let twiceArea = 0;

  for (
    let current = 0, previous = ring.length - 1;
    current < ring.length;
    previous = current++
  ) {
    twiceArea +=
      ring[previous][0] * ring[current][1] -
      ring[current][0] * ring[previous][1];
  }

  return twiceArea / 2;
}

function getRingCentroid(
  ring: GeoJSON.Position[]
): LngLat | null {
  let twiceArea = 0;
  let longitude = 0;
  let latitude = 0;

  for (
    let current = 0, previous = ring.length - 1;
    current < ring.length;
    previous = current++
  ) {
    const cross =
      ring[previous][0] * ring[current][1] -
      ring[current][0] * ring[previous][1];

    twiceArea += cross;
    longitude +=
      (ring[previous][0] + ring[current][0]) * cross;
    latitude +=
      (ring[previous][1] + ring[current][1]) * cross;
  }

  if (Math.abs(twiceArea) < Number.EPSILON) {
    return null;
  }

  return [
    longitude / (3 * twiceArea),
    latitude / (3 * twiceArea),
  ];
}

function getCountryLabelCoordinate(
  geometry: CountryGeometry,
  bounds: CountryBounds
): LngLat {
  const polygons =
    geometry.type === "Polygon"
      ? [geometry.coordinates]
      : geometry.coordinates;
  const largestPolygon = polygons.reduce(
    (largest, polygon) => {
      const largestArea = Math.abs(
        getRingArea(largest[0] ?? [])
      );
      const polygonArea = Math.abs(
        getRingArea(polygon[0] ?? [])
      );

      return polygonArea > largestArea
        ? polygon
        : largest;
    },
    polygons[0]
  );
  const outerRing = largestPolygon?.[0] ?? [];
  const centroid = getRingCentroid(outerRing);

  if (centroid && isPointInCountry(centroid, geometry)) {
    return centroid;
  }

  const boundsCenter: LngLat = [
    (bounds.minLongitude + bounds.maxLongitude) / 2,
    (bounds.minLatitude + bounds.maxLatitude) / 2,
  ];

  if (isPointInCountry(boundsCenter, geometry)) {
    return boundsCenter;
  }

  const firstPoint = outerRing[0];

  return firstPoint
    ? [firstPoint[0], firstPoint[1]]
    : boundsCenter;
}

function getMercatorPosition(
  [longitude, latitude]: GeoJSON.Position
) {
  const clampedLatitude = Math.max(
    -85.051129,
    Math.min(85.051129, latitude)
  );
  const latitudeRadians =
    (clampedLatitude * Math.PI) / 180;

  return [
    (longitude + 180) / 360,
    (1 -
      Math.log(
        Math.tan(latitudeRadians) +
          1 / Math.cos(latitudeRadians)
      ) /
        Math.PI) /
      2,
  ] as const;
}

function getPixelDistance(
  firstPoint: GeoJSON.Position,
  secondPoint: GeoJSON.Position,
  zoom: number
) {
  const [firstX, firstY] = getMercatorPosition(firstPoint);
  const [secondX, secondY] = getMercatorPosition(secondPoint);
  const horizontalDistance = Math.abs(firstX - secondX);
  const wrappedHorizontalDistance = Math.min(
    horizontalDistance,
    1 - horizontalDistance
  );
  const worldSize = 512 * 2 ** zoom;

  return (
    Math.hypot(
      wrappedHorizontalDistance,
      Math.abs(firstY - secondY)
    ) * worldSize
  );
}

export default function WorldMap({
  visitedCountries,
  plannedCountries,
  onVisitedCountriesChange,
  onPlannedCountriesChange,
  focusedCountryName,
  focusedLocation,
}: Props) {
  const [selectedCountry, setSelectedCountry] =
    useState<SelectedCountry>(null);
  const zoomRef = useRef(INITIAL_ZOOM);
  const cameraRef = useRef<CameraRef>(null);
  const pinDrop = useRef(new Animated.Value(0)).current;
  const locationPinDrop = useRef(new Animated.Value(0)).current;

  const normalizedVisited = useMemo(
    () => visitedCountries.map((id) => id.toLowerCase()),
    [visitedCountries]
  );

  const normalizedPlanned = useMemo(
    () => plannedCountries.map((id) => id.toLowerCase()),
    [plannedCountries]
  );

  const selectedCountryId =
    selectedCountry?.id.toLowerCase() ?? "";

  const selectedCountryLabelData = useMemo<CountryLabelData>(
    () => ({
      type: "FeatureCollection",
      features: selectedCountry
        ? [
            {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: selectedCountry.labelCoordinate,
              },
              properties: {
                countryName: selectedCountry.name,
              },
            },
          ]
        : [],
    }),
    [selectedCountry]
  );

  const mapData = useMemo<CountryMapData>(() => {
    return {
      ...sourceWorldGeoJson,
      type: "FeatureCollection",

      features: sourceWorldGeoJson.features.map((feature) => {
        const properties = feature.properties;

        const iso =
          properties.ISO_A2 ??
          properties.iso_a2 ??
          properties["ISO3166-1-Alpha-2"] ??
          "";

        const name =
          properties.ADMIN ??
          properties.NAME ??
          properties.name ??
          "Unknown";

        const countryId = getMapCountryId(
          String(iso),
          String(name)
        );

        return {
          ...feature,
          type: "Feature",

          properties: {
            ...properties,
            countryId,
            countryName: String(name),
          },
        };
      }),
    };
  }, []);

  const countriesWithBounds = useMemo(
    () =>
      mapData.features.map((feature) => {
        const bounds = getCountryBounds(feature.geometry);

        return {
          feature,
          bounds,
          labelCoordinate: getCountryLabelCoordinate(
            feature.geometry,
            bounds
          ),
        };
      }),
    [mapData]
  );

  useEffect(() => {
    if (!focusedCountryName) {
      return;
    }

    const normalizedFocusedName =
      normalizeCountryName(focusedCountryName);
    const country = countriesWithBounds.find(
      ({ feature }) =>
        normalizeCountryName(
          feature.properties.countryName
        ) === normalizedFocusedName
    );

    if (!country) {
      return;
    }

    const { feature, bounds, labelCoordinate } = country;

    setSelectedCountry({
      id: feature.properties.countryId,
      name: feature.properties.countryName,
      labelCoordinate,
    });

    cameraRef.current?.flyTo({
      center: labelCoordinate,
      zoom: getCountryFocusZoom(bounds),
      duration: 950,
    });

    pinDrop.stopAnimation();
    pinDrop.setValue(0);

    const pinAnimation = Animated.sequence([
      Animated.delay(280),
      Animated.spring(pinDrop, {
        toValue: 1,
        damping: 11,
        stiffness: 145,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]);

    pinAnimation.start();

    return () => pinAnimation.stop();
  }, [countriesWithBounds, focusedCountryName, pinDrop]);

  useEffect(() => {
    if (!focusedLocation) return;

    setSelectedCountry(null);
    cameraRef.current?.flyTo({
      center: [focusedLocation.longitude, focusedLocation.latitude],
      zoom: getLocationFocusZoom(focusedLocation),
      duration: 1050,
    });

    locationPinDrop.stopAnimation();
    locationPinDrop.setValue(0);
    const animation = Animated.spring(locationPinDrop, {
      toValue: 1,
      damping: 11,
      stiffness: 145,
      mass: 0.8,
      useNativeDriver: true,
    });

    animation.start();

    return () => animation.stop();
  }, [focusedLocation, locationPinDrop]);

  const showFocusedCountryPin =
    selectedCountry !== null &&
    focusedCountryName !== undefined &&
    !focusedLocation &&
    normalizeCountryName(selectedCountry.name) ===
      normalizeCountryName(focusedCountryName);

  function isVisited(id: string) {
    return normalizedVisited.includes(id.toLowerCase());
  }

  function isPlanned(id: string) {
    return normalizedPlanned.includes(id.toLowerCase());
  }

  function handleCountryPress(event: MapPressEvent) {
    const point = event.nativeEvent.lngLat;

    const exactCountry = countriesWithBounds.find(
      ({ feature, bounds }) =>
        point[0] >= bounds.minLongitude &&
        point[0] <= bounds.maxLongitude &&
        point[1] >= bounds.minLatitude &&
        point[1] <= bounds.maxLatitude &&
        isPointInCountry(point, feature.geometry)
    );

    const nearbySmallCountry = exactCountry
      ? undefined
      : countriesWithBounds
          .map((country) => {
            const { bounds } = country;
            const longitudeSpan =
              bounds.maxLongitude - bounds.minLongitude;
            const latitudeSpan =
              bounds.maxLatitude - bounds.minLatitude;

            if (
              longitudeSpan > SMALL_COUNTRY_MAX_SPAN ||
              latitudeSpan > SMALL_COUNTRY_MAX_SPAN
            ) {
              return null;
            }

            return {
              ...country,
              distance: getPixelDistance(
                point,
                country.labelCoordinate,
                zoomRef.current
              ),
            };
          })
          .filter(
            (country): country is NonNullable<typeof country> =>
              country !== null &&
              country.distance <= SMALL_COUNTRY_HIT_RADIUS
          )
          .sort((first, second) =>
            first.distance - second.distance
          )[0];

    const country = exactCountry ?? nearbySmallCountry;

    if (!country) {
      return;
    }

    const properties = country.feature.properties;

    const id = properties?.countryId;

    const name = properties?.countryName;

    if (!id || !name) {
      return;
    }

    setSelectedCountry({
      id: String(id),
      name: String(name),
      labelCoordinate: country.labelCoordinate,
    });
  }

  function handleRegionDidChange(event: RegionChangeEvent) {
    zoomRef.current = event.nativeEvent.zoom;
  }

  function toggleVisited() {
    if (!selectedCountry) {
      return;
    }

    const id =
      selectedCountry.id.toLowerCase();

    if (isVisited(id)) {
      onVisitedCountriesChange(
        visitedCountries.filter(
          (countryId) =>
            countryId.toLowerCase() !== id
        )
      );
    } else {
      onPlannedCountriesChange(
        plannedCountries.filter(
          (countryId) =>
            countryId.toLowerCase() !== id
        )
      );
      onVisitedCountriesChange([
        ...visitedCountries,
        id,
      ]);
    }
  }

  function togglePlanned() {
    if (!selectedCountry || isVisited(selectedCountry.id)) {
      return;
    }

    const id = selectedCountry.id.toLowerCase();

    if (isPlanned(id)) {
      onPlannedCountriesChange(
        plannedCountries.filter(
          (countryId) =>
            countryId.toLowerCase() !== id
        )
      );
    } else {
      onPlannedCountriesChange([
        ...plannedCountries,
        id,
      ]);
    }
  }

  return (
    <View>
      <View style={styles.mapContainer}>
        <Map
          style={styles.map}
          mapStyle={MAP_STYLE}
          onPress={handleCountryPress}
          onRegionDidChange={handleRegionDidChange}
        >
          <Camera
            ref={cameraRef}
            initialViewState={{
              center: [15, 25],
              zoom: INITIAL_ZOOM,
            }}
            minZoom={0.8}
            maxZoom={18}
          />

          <Images images={MAP_IMAGES} />

          {showFocusedCountryPin && selectedCountry && (
            <Marker
              id="random-destination-pin"
              lngLat={selectedCountry.labelCoordinate}
              anchor="bottom"
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.focusPin,
                  {
                    opacity: pinDrop,
                    transform: [
                      {
                        translateY: pinDrop.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-90, 0],
                        }),
                      },
                      {
                        scale: pinDrop.interpolate({
                          inputRange: [0, 0.75, 1],
                          outputRange: [0.55, 1.12, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Ionicons
                  name="location-sharp"
                  size={23}
                  color="#E53935"
                />
              </Animated.View>
            </Marker>
          )}

          {focusedLocation && (
            <Marker
              id="map-search-result-pin"
              lngLat={[focusedLocation.longitude, focusedLocation.latitude]}
              anchor="bottom"
            >
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.locationMarker,
                  {
                    opacity: locationPinDrop,
                    transform: [
                      {
                        translateY: locationPinDrop.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-80, 0],
                        }),
                      },
                      {
                        scale: locationPinDrop.interpolate({
                          inputRange: [0, 0.75, 1],
                          outputRange: [0.65, 1.08, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={styles.locationLabel}>
                  <Text style={styles.locationLabelText} numberOfLines={1}>
                    {focusedLocation.name}
                  </Text>
                </View>
                <Ionicons name="location-sharp" size={30} color="#E53935" />
              </Animated.View>
            </Marker>
          )}

          <GeoJSONSource
            data={mapData}
          >
            <Layer
              id="visited-country-fill"
              type="fill"
              paint={{
                "fill-color": [
                  "case",
                  [
                    "in",
                    ["get", "countryId"],
                    ["literal", normalizedVisited],
                  ],
                  VISITED_COLOR,
                  [
                    "in",
                    ["get", "countryId"],
                    ["literal", normalizedPlanned],
                  ],
                  PLANNED_COLOR,
                  [
                    "==",
                    ["get", "countryId"],
                    selectedCountryId,
                  ],
                  SELECTED_COLOR,
                  LAND_COLOR,
                ],

                "fill-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  1,
                  0.85,
                  5,
                  0.32,
                  8,
                  0,
                ],
              }}
            />

            <Layer
              id="country-borders"
              type="line"
              paint={{
                "line-color": "rgba(95,95,105,0.28)",
                "line-width": 0.9,
                "line-opacity": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  1,
                  1,
                  6,
                  0.25,
                  8,
                  0,
                ],
              }}
            />

          </GeoJSONSource>

          <GeoJSONSource
            id="selected-country-label-source"
            data={selectedCountryLabelData}
          >
            <Layer
              id="selected-country-label"
              type="symbol"
              layout={{
                "text-field": ["get", "countryName"],
                "text-font": ["Open Sans Semibold"],
                "text-size": [
                  "interpolate",
                  ["linear"],
                  ["zoom"],
                  1,
                  7,
                  3,
                  9,
                  6,
                  12,
                  10,
                  15,
                ],
                "text-max-width": 8,
                "text-allow-overlap": true,
                "icon-image": "selectedCountryLabelBackground",
                "icon-text-fit": "both",
                "icon-text-fit-padding": [1, 3, 1, 3],
                "icon-allow-overlap": true,
              }}
              paint={{
                "text-color": "#353047",
                "text-opacity": 0.95,
                "icon-opacity": 0.55,
              }}
            />
          </GeoJSONSource>
        </Map>
      </View>

      <View style={styles.mapFooter}>
        <View style={styles.legends}>
          <View style={styles.legend}>
            <View style={styles.visitedDot} />

            <Text style={styles.footerText}>
              Visited
            </Text>
          </View>

          <View style={styles.legend}>
            <View style={styles.plannedDot} />

            <Text style={styles.footerText}>
              Planned
            </Text>
          </View>
        </View>

        <Text style={styles.footerText}>
          {visitedCountries.length} visited ·{" "}
          {plannedCountries.length} planned
        </Text>
      </View>

      <TouchableOpacity
        style={styles.mapAttribution}
        onPress={() =>
          void Linking.openURL("https://www.openstreetmap.org/copyright")
        }
        accessibilityRole="link"
        accessibilityLabel="OpenStreetMap copyright and attribution"
      >
        <Text style={styles.attributionText}>
          Search and map data © OpenStreetMap contributors
        </Text>
      </TouchableOpacity>

      {selectedCountry && (
        <View style={styles.countryCard}>
          <View style={styles.countryInfo}>
            <Text style={styles.countryName}>
              {selectedCountry.name}
            </Text>

            <Text
              style={[
                styles.countryStatus,
                isPlanned(selectedCountry.id) &&
                  styles.plannedStatus,
              ]}
            >
              {isVisited(selectedCountry.id)
                ? "Visited"
                : isPlanned(selectedCountry.id)
                  ? "Planned"
                  : "Not visited"}
            </Text>
          </View>

          <View style={styles.countryActions}>
            {!isVisited(selectedCountry.id) && (
              <TouchableOpacity
                style={[
                  styles.plannedButton,
                  isPlanned(selectedCountry.id) &&
                    styles.removeButton,
                ]}
                onPress={togglePlanned}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.actionText,
                    isPlanned(selectedCountry.id) &&
                      styles.removeText,
                  ]}
                >
                  {isPlanned(selectedCountry.id)
                    ? "Unplan"
                    : "Plan"}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.actionButton,
                isVisited(selectedCountry.id) &&
                  styles.removeButton,
              ]}
              onPress={toggleVisited}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.actionText,
                  isVisited(selectedCountry.id) &&
                    styles.removeText,
                ]}
              >
                {isVisited(selectedCountry.id)
                  ? "Remove"
                  : "Mark visited"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() =>
              setSelectedCountry(null)
            }
            activeOpacity={0.65}
          >
            <Text style={styles.closeText}>
              ×
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    height: 300,
    borderRadius: 26,
    overflow: "hidden",
    backgroundColor: WATER_COLOR,
    borderWidth: 1,
    borderColor: MAP_BORDER_COLOR,
  },

  map: {
    flex: 1,
  },

  focusPin: {
    width: 24,
    height: 27,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  locationMarker: {
    maxWidth: 190,
    alignItems: "center",
  },

  locationLabel: {
    maxWidth: 190,
    marginBottom: 2,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(17,17,17,0.12)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: "rgba(255,255,255,0.96)",
  },

  locationLabelText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#111111",
  },

  mapFooter: {
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  legend: {
    flexDirection: "row",
    alignItems: "center",
  },

  legends: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  visitedDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 7,
    backgroundColor: VISITED_COLOR,
  },

  plannedDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    marginRight: 7,
    backgroundColor: PLANNED_COLOR,
  },

  footerText: {
    fontSize: 12,
    color: "#777777",
  },

  mapAttribution: {
    alignSelf: "flex-end",
    marginTop: 5,
  },

  attributionText: {
    fontSize: 8,
    color: "#8D8691",
    textDecorationLine: "underline",
  },

  countryCard: {
    minHeight: 68,
    marginTop: 11,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    backgroundColor: "#FFFFFF",
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  countryInfo: {
    flex: 1,
  },

  countryName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#111111",
  },

  countryStatus: {
    marginTop: 3,
    fontSize: 12,
    color: "#777777",
  },

  plannedStatus: {
    color: "#C76F2B",
  },

  countryActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  actionButton: {
    borderRadius: 15,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: VISITED_COLOR,
  },

  plannedButton: {
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 9,
    backgroundColor: PLANNED_COLOR,
  },

  actionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111111",
  },

  removeButton: {
    backgroundColor: "#F2F2F2",
  },

  removeText: {
    color: "#777777",
  },

  closeButton: {
    width: 31,
    height: 36,
    marginLeft: 3,
    justifyContent: "center",
    alignItems: "center",
  },

  closeText: {
    fontSize: 24,
    fontWeight: "300",
    color: "#999999",
  },
});
