import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import {
  Camera,
  GeoJSONSource,
  Layer,
  Map,
  Marker,
  type LngLat,
  type StyleSpecification,
} from "@maplibre/maplibre-react-native";

import type { Place } from "../../models/place";
import type { RouteDay } from "../../models/travel";

const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {},
  layers: [
    {
      id: "trip-background",
      type: "background",
      paint: { "background-color": "#F1EFF7" },
    },
  ],
};

type MappedStop = {
  id: string;
  order: number;
  name: string;
  coordinate: LngLat;
};

export default function RouteMap({
  routeDays,
  places,
}: {
  routeDays: RouteDay[];
  places: Place[];
}) {
  const [activeDayId, setActiveDayId] = useState(routeDays[0]?.id);
  const placeById = useMemo(
    () => new globalThis.Map(places.map((place) => [place.id, place])),
    [places]
  );
  const activeDay =
    routeDays.find((day) => day.id === activeDayId) ?? routeDays[0];
  const allStops = activeDay?.stops ?? [];
  const mappedStops: MappedStop[] = allStops.flatMap((stop, index) => {
    const place = placeById.get(stop.placeId);

    if (place?.latitude === undefined || place.longitude === undefined) return [];

    return [
      {
        id: stop.id,
        order: index + 1,
        name: place.name,
        coordinate: [place.longitude, place.latitude],
      },
    ];
  });

  const center = mappedStops.reduce<LngLat>(
    (sum, stop) => [
      sum[0] + stop.coordinate[0] / mappedStops.length,
      sum[1] + stop.coordinate[1] / mappedStops.length,
    ],
    [0, 0]
  );
  const longitudeSpan = Math.max(
    ...mappedStops.map((stop) => Math.abs(stop.coordinate[0] - center[0]))
  );
  const latitudeSpan = Math.max(
    ...mappedStops.map((stop) => Math.abs(stop.coordinate[1] - center[1]))
  );
  const largestSpan = Math.max(longitudeSpan, latitudeSpan);
  const zoom = largestSpan < 0.02 ? 12.2 : largestSpan < 0.08 ? 10.8 : 8.5;
  const line: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
    type: "FeatureCollection",
    features:
      mappedStops.length > 1
        ? [
            {
              type: "Feature",
              properties: {},
              geometry: {
                type: "LineString",
                coordinates: mappedStops.map((stop) => stop.coordinate),
              },
            },
          ]
        : [],
  };
  const missingCount = allStops.length - mappedStops.length;

  return (
    <View>
      <View style={styles.daySwitcher}>
        {routeDays.map((day) => {
          const selected = day.id === activeDay?.id;

          return (
            <TouchableOpacity
              key={day.id}
              style={[styles.dayButton, selected && styles.dayButtonActive]}
              onPress={() => setActiveDayId(day.id)}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  selected && styles.dayButtonTextActive,
                ]}
              >
                Day {day.dayNumber}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {mappedStops.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No coordinates for this day</Text>
          <Text style={styles.emptyText}>
            Add latitude and longitude to manual places to show them on the map.
          </Text>
        </View>
      ) : (
        <View style={styles.mapFrame}>
          <Map key={activeDay?.id} style={styles.map} mapStyle={MAP_STYLE}>
            <Camera initialViewState={{ center, zoom }} minZoom={1} maxZoom={18} />
            <GeoJSONSource data={line}>
              <Layer
                id="trip-route-line"
                type="line"
                paint={{
                  "line-color": "#765FD2",
                  "line-width": 3,
                  "line-opacity": 0.78,
                  "line-dasharray": [2, 1.5],
                }}
              />
            </GeoJSONSource>
            {mappedStops.map((stop) => (
              <Marker
                key={stop.id}
                id={`route-marker-${stop.id}`}
                lngLat={stop.coordinate}
                anchor="center"
              >
                <View style={styles.marker} accessibilityLabel={`${stop.order}. ${stop.name}`}>
                  <Text style={styles.markerText}>{stop.order}</Text>
                </View>
              </Marker>
            ))}
          </Map>
        </View>
      )}
      <Text style={styles.previewNote}>
        Route preview · straight connections, not street directions.
      </Text>
      {missingCount > 0 && (
        <Text style={styles.mapNote}>
          {missingCount} {missingCount === 1 ? "stop is" : "stops are"} hidden
          because coordinates are missing.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  daySwitcher: { marginBottom: 10, flexDirection: "row", flexWrap: "wrap", gap: 7 },
  dayButton: { minHeight: 34, borderRadius: 12, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#ECE8F0" },
  dayButtonActive: { backgroundColor: "#765FD2" },
  dayButtonText: { fontSize: 10, fontWeight: "700", color: "#716878" },
  dayButtonTextActive: { color: "#FFFFFF" },
  mapFrame: { height: 370, borderRadius: 21, borderWidth: 1, borderColor: "#DDD6EA", overflow: "hidden", backgroundColor: "#F1EFF7" },
  map: { flex: 1 },
  marker: { width: 30, height: 30, borderRadius: 15, borderWidth: 3, borderColor: "#FFFFFF", alignItems: "center", justifyContent: "center", backgroundColor: "#765FD2", shadowColor: "#342762", shadowOpacity: 0.18, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  markerText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },
  previewNote: { marginTop: 8, fontSize: 10, fontWeight: "600", color: "#6F6578" },
  mapNote: { marginTop: 8, fontSize: 10, lineHeight: 15, color: "#867D8B" },
  empty: { minHeight: 190, borderRadius: 20, borderWidth: 1, borderColor: "#E1DCE8", padding: 24, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F1FA" },
  emptyTitle: { fontSize: 14, fontWeight: "700", color: "#3E3743" },
  emptyText: { marginTop: 6, maxWidth: 260, textAlign: "center", fontSize: 11, lineHeight: 17, color: "#817986" },
});
