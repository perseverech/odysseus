import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Ionicons } from "@expo/vector-icons";

import type { Place } from "../../models/place";
import type { RouteDay } from "../../models/travel";
import { formatTravelDate } from "../../utils/travelDates";

function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours === 0) return `${remainder} min`;
  if (remainder === 0) return `${hours} hr`;

  return `${hours} hr ${remainder} min`;
}

const WEEKDAYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function openingHoursLabel(place: Place, date: string) {
  const parsedDate = new Date(`${date}T00:00:00.000Z`);
  const weekday = Number.isNaN(parsedDate.getTime())
    ? undefined
    : WEEKDAYS[parsedDate.getUTCDay()];
  const periods = weekday ? place.openingHours?.weekly?.[weekday] : undefined;

  if (periods) {
    if (periods.length === 0) return "Closed";

    return periods
      .map((period) => `${period.opensAt}–${period.closesAt}`)
      .join(", ");
  }

  if (place.openingHours?.summary?.trim()) {
    return place.openingHours.summary.trim();
  }

  if (place.openingHours?.weekly) return "Hours available";

  return "Hours unknown";
}

export default function RouteTimeline({
  routeDays,
  places,
  onMove,
  onOpenActions,
}: {
  routeDays: RouteDay[];
  places: Place[];
  onMove: (dayId: string, stopId: string, direction: -1 | 1) => void;
  onOpenActions: (dayId: string, stopId: string) => void;
}) {
  const placeById = new Map(places.map((place) => [place.id, place]));
  const allStops = routeDays.flatMap((day) => day.stops);
  const totalMinutes = allStops.reduce(
    (sum, stop) =>
      sum +
      stop.visitMinutes +
      stop.travelMinutesFromPrevious +
      (stop.breakMinutesBefore ?? 0) +
      (stop.waitingMinutesBefore ?? 0),
    0
  );
  const walkingDistance = routeDays.reduce(
    (sum, day) => sum + (day.walkingDistanceKm ?? 0),
    0
  );
  const estimatedCost = routeDays.reduce(
    (sum, day) => sum + day.estimatedCost,
    0
  );

  return (
    <View style={styles.days}>
      {routeDays.map((day) => (
        <View key={day.id} style={styles.dayCard}>
          <View style={styles.dayHeader}>
            <View>
              <Text style={styles.dayEyebrow}>DAY {day.dayNumber}</Text>
              <Text style={styles.dayDate}>{formatTravelDate(day.date)}</Text>
            </View>
            <View style={styles.daySummary}>
              <Text style={styles.daySummaryText}>
                {durationLabel(
                  day.totalVisitMinutes +
                    day.totalTravelMinutes +
                    day.stops.reduce(
                      (sum, stop) =>
                        sum +
                        (stop.breakMinutesBefore ?? 0) +
                        (stop.waitingMinutesBefore ?? 0),
                      0
                    )
                )}
              </Text>
              <Text style={styles.dayCost}>
                ≈ {day.estimatedCost.toFixed(0)} {day.currency}
              </Text>
            </View>
          </View>

          {day.stops.length === 0 ? (
            <View style={styles.freeDay}>
              <Ionicons name="cafe-outline" size={18} color="#8B8391" />
              <Text style={styles.freeDayText}>Free day — no places assigned.</Text>
            </View>
          ) : (
            day.stops.map((stop, index) => {
              const place = placeById.get(stop.placeId);

              if (!place) return null;

              return (
                <View key={stop.id}>
                  {stop.breakMinutesBefore !== undefined && (
                    <View style={styles.breakRow}>
                      <View style={styles.legLine} />
                      <Ionicons name="cafe-outline" size={14} color="#8B6A22" />
                      <View style={styles.breakBody}>
                        <Text style={styles.breakTitle}>
                          {stop.breakLabel ?? "Free time"}
                        </Text>
                        <Text style={styles.breakTime}>
                          {durationLabel(stop.breakMinutesBefore)}
                        </Text>
                      </View>
                    </View>
                  )}
                  {stop.travelMinutesFromPrevious > 0 && (
                    <View style={styles.travelLeg}>
                      <View style={styles.legLine} />
                      <Ionicons
                        name={
                          stop.travelModeFromPrevious === "transit"
                            ? "bus-outline"
                            : "walk-outline"
                        }
                        size={14}
                        color="#776A89"
                      />
                      <Text style={styles.travelText}>
                        Estimated {stop.travelMinutesFromPrevious} min {stop.travelModeFromPrevious ?? "travel"}
                        {stop.travelDistanceKm !== undefined
                          ? ` · ${stop.travelDistanceKm} km`
                          : ""}
                      </Text>
                    </View>
                  )}
                  {stop.waitingMinutesBefore !== undefined && (
                    <View style={styles.waitRow}>
                      <View style={styles.legLine} />
                      <Ionicons name="time-outline" size={14} color="#776A89" />
                      <View style={styles.breakBody}>
                        <Text style={styles.waitTitle}>
                          {stop.waitingLabel ?? "Free time until opening"}
                        </Text>
                        <Text style={styles.waitTime}>
                          {durationLabel(stop.waitingMinutesBefore)}
                        </Text>
                      </View>
                    </View>
                  )}
                  <View style={styles.stopRow}>
                    <View style={styles.timelineColumn}>
                      <View style={styles.stopNumber}>
                        <Text style={styles.stopNumberText}>{index + 1}</Text>
                      </View>
                    </View>
                    <View style={styles.stopCard}>
                      <View style={styles.stopTop}>
                        <View style={styles.stopTitleArea}>
                          <Text style={styles.stopTime}>
                            {stop.arrivalTime}–{stop.departureTime}
                          </Text>
                          <Text style={styles.stopName}>{place.name}</Text>
                          {stop.isPriority && (
                            <View style={styles.priorityBadge}>
                              <Ionicons name="star" size={10} color="#8B6A22" />
                              <Text style={styles.priorityText}>Must see</Text>
                            </View>
                          )}
                          <Text style={styles.stopMeta}>
                            {place.category} · {durationLabel(stop.visitMinutes)}
                          </Text>
                          {place.isDemoData && (
                            <Text style={styles.demoText}>Local demo estimate</Text>
                          )}
                          <View style={styles.hoursRow}>
                            <Ionicons name="time-outline" size={11} color="#8B8391" />
                            <Text style={styles.hoursText} numberOfLines={1}>
                              {openingHoursLabel(place, day.date)}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.stopCost}>
                          {stop.estimatedCost === 0
                            ? "Free"
                            : `≈ ${stop.estimatedCost.toFixed(0)} ${stop.currency}`}
                        </Text>
                      </View>
                      <View style={styles.stopActions}>
                        <TouchableOpacity
                          style={[styles.action, index === 0 && styles.actionDisabled]}
                          disabled={index === 0}
                          onPress={() => onMove(day.id, stop.id, -1)}
                          accessibilityLabel={`Move ${place.name} earlier`}
                        >
                          <Ionicons name="arrow-up" size={15} color="#665676" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.action,
                            index === day.stops.length - 1 && styles.actionDisabled,
                          ]}
                          disabled={index === day.stops.length - 1}
                          onPress={() => onMove(day.id, stop.id, 1)}
                          accessibilityLabel={`Move ${place.name} later`}
                        >
                          <Ionicons name="arrow-down" size={15} color="#665676" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.action}
                          onPress={() => onOpenActions(day.id, stop.id)}
                          accessibilityLabel={`Edit ${place.name} route stop`}
                        >
                          <Ionicons name="ellipsis-horizontal" size={16} color="#665676" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>
      ))}
      <View style={styles.routeTotals}>
        <RouteTotal value={allStops.length} label="Places" />
        <RouteTotal value={durationLabel(totalMinutes)} label="Total time" />
        <RouteTotal value={`${walkingDistance.toFixed(1)} km`} label="Walking" />
        <RouteTotal
          value={`≈ ${estimatedCost.toFixed(0)} ${routeDays[0]?.currency ?? "EUR"}`}
          label="Estimated"
        />
      </View>
    </View>
  );
}

function RouteTotal({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.routeTotal}>
      <Text style={styles.routeTotalValue}>{value}</Text>
      <Text style={styles.routeTotalLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  days: { gap: 13 },
  dayCard: { borderRadius: 21, borderWidth: 1, borderColor: "#E3DDEB", padding: 15, backgroundColor: "#FFFFFF" },
  dayHeader: { paddingBottom: 13, borderBottomWidth: 1, borderBottomColor: "#EEEAF2", flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  dayEyebrow: { fontSize: 8, fontWeight: "800", letterSpacing: 1.1, color: "#8E7DAE" },
  dayDate: { marginTop: 3, fontSize: 16, fontWeight: "700", color: "#171419" },
  daySummary: { alignItems: "flex-end" },
  daySummaryText: { fontSize: 10, color: "#746D78" },
  dayCost: { marginTop: 3, fontSize: 11, fontWeight: "700", color: "#6651B1" },
  freeDay: { minHeight: 74, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  freeDayText: { fontSize: 11, color: "#817986" },
  travelLeg: { height: 34, marginLeft: 15, flexDirection: "row", alignItems: "center" },
  breakRow: { minHeight: 48, marginLeft: 15, flexDirection: "row", alignItems: "center" },
  waitRow: { minHeight: 42, marginLeft: 15, flexDirection: "row", alignItems: "center" },
  breakBody: { marginLeft: 6 },
  breakTitle: { fontSize: 10, fontWeight: "700", color: "#725B2A" },
  breakTime: { marginTop: 2, fontSize: 9, color: "#8B7443" },
  waitTitle: { fontSize: 10, fontWeight: "700", color: "#665676" },
  waitTime: { marginTop: 2, fontSize: 9, color: "#817986" },
  legLine: { width: 1, height: 34, marginRight: 13, backgroundColor: "#D5CDE0" },
  travelText: { marginLeft: 5, fontSize: 9, fontWeight: "600", color: "#776F7B" },
  stopRow: { flexDirection: "row", alignItems: "stretch" },
  timelineColumn: { width: 31, alignItems: "center", paddingTop: 13 },
  stopNumber: { width: 27, height: 27, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#7963CB" },
  stopNumberText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },
  stopCard: { flex: 1, borderRadius: 16, borderWidth: 1, borderColor: "#E9E5ED", padding: 12, backgroundColor: "#FCFBFD" },
  stopTop: { flexDirection: "row", alignItems: "flex-start" },
  stopTitleArea: { flex: 1, paddingRight: 8 },
  stopTime: { fontSize: 9, fontWeight: "700", color: "#765FD2" },
  stopName: { marginTop: 3, fontSize: 14, fontWeight: "700", color: "#1A171B" },
  priorityBadge: { alignSelf: "flex-start", marginTop: 5, borderRadius: 9, paddingHorizontal: 7, paddingVertical: 3, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#FFF3D8" },
  priorityText: { fontSize: 8, fontWeight: "700", color: "#8B6A22" },
  stopMeta: { marginTop: 4, fontSize: 9, color: "#827A86" },
  demoText: { marginTop: 3, fontSize: 8, fontWeight: "700", color: "#826BD2" },
  hoursRow: { marginTop: 5, flexDirection: "row", alignItems: "center", gap: 4 },
  hoursText: { flex: 1, fontSize: 9, color: "#817986" },
  stopCost: { fontSize: 9, fontWeight: "700", color: "#5F5564" },
  stopActions: { marginTop: 11, paddingTop: 9, borderTopWidth: 1, borderTopColor: "#ECE8EF", flexDirection: "row", justifyContent: "flex-end", gap: 7 },
  action: { width: 31, height: 28, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#EEEAF5" },
  actionDisabled: { opacity: 0.32 },
  routeTotals: { borderRadius: 19, paddingVertical: 14, flexDirection: "row", backgroundColor: "#EEE9F8" },
  routeTotal: { flex: 1, alignItems: "center", paddingHorizontal: 3 },
  routeTotalValue: { fontSize: 11, fontWeight: "800", textAlign: "center", color: "#33294C" },
  routeTotalLabel: { marginTop: 4, fontSize: 8, textAlign: "center", color: "#7F7588" },
});
