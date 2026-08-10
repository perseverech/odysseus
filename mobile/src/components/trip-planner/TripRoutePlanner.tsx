import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import type { Place } from "../../models/place";
import type {
  RouteDay,
  Trip,
  UnscheduledPlaceReason,
} from "../../models/travel";
import {
  appendPlaceToRouteDay,
  localRoutingProvider,
  recalculateRouteDay,
  summarizeRouteDays,
} from "../../services/routeBuilder";
import { formatTripMoney } from "../../utils/tripFormatting";
import RouteMap from "./RouteMap";
import RouteTimeline from "./RouteTimeline";
import TripPlacesOverview from "./TripPlacesOverview";

type PlannerView = "timeline" | "map";
type ActiveStop = { dayId: string; stopId: string } | null;

const UNSCHEDULED_REASON_LABELS: Record<UnscheduledPlaceReason, string> = {
  closed: "Closed",
  too_far: "Too far",
  not_enough_time: "Not enough time",
  budget: "Budget",
  missing_coordinates: "Missing coordinates",
  removed_manually: "Removed manually",
};

function minutesLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}

export default function TripRoutePlanner({
  trip,
  places,
  onOpenPlaces,
  onBrowseDiscover,
  onAddManualPlace,
  onSaveRoute,
  onSetPriorityPlaces,
}: {
  trip: Trip;
  places: Place[];
  onOpenPlaces: () => void;
  onBrowseDiscover: () => void;
  onAddManualPlace: () => void;
  onSaveRoute: (
    days: RouteDay[],
    unscheduledPlaceIds?: string[],
    unscheduledPlaceReasons?: Partial<Record<string, UnscheduledPlaceReason>>
  ) => void;
  onSetPriorityPlaces: (placeIds: string[]) => void;
}) {
  const [view, setView] = useState<PlannerView>("timeline");
  const [isBuilding, setIsBuilding] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [activeStop, setActiveStop] = useState<ActiveStop>(null);
  const [activeUnscheduledPlaceId, setActiveUnscheduledPlaceId] = useState<
    string | null
  >(null);
  const placeById = new Map(places.map((place) => [place.id, place]));
  const selectedPlaces = trip.selectedPlaceIds.flatMap((placeId) => {
    const place = placeById.get(placeId);

    return place ? [place] : [];
  });
  const routeDays = trip.routeDays ?? [];
  const routeStopCount = routeDays.reduce((sum, day) => sum + day.stops.length, 0);
  const hasRoute = routeStopCount > 0;
  const canBuildRoute = selectedPlaces.length >= 2;
  const summary = summarizeRouteDays(routeDays);
  const plannedActivityCost = routeDays.reduce(
    (total, day) =>
      total +
      day.stops.reduce((dayTotal, stop) => {
        const place = placeById.get(stop.placeId);
        const sameCurrency =
          !place?.currency ||
          place.currency.toLocaleUpperCase() ===
            (trip.currency ?? "EUR").toLocaleUpperCase();

        if (!place || place.isFree || place.price === undefined || !sameCurrency) {
          return dayTotal;
        }

        return dayTotal + place.price;
      }, 0),
    0
  );
  const budgetRemaining =
    trip.budget === undefined ? undefined : trip.budget - plannedActivityCost;
  const activeDay = activeStop
    ? routeDays.find((day) => day.id === activeStop.dayId)
    : undefined;
  const activeRouteStop = activeDay?.stops.find(
    (stop) => stop.id === activeStop?.stopId
  );
  const activePlace = activeRouteStop
    ? placeById.get(activeRouteStop.placeId)
    : undefined;
  const unscheduledPlaces = trip.unscheduledPlaceIds.flatMap((placeId) => {
    const place = placeById.get(placeId);

    return place ? [place] : [];
  });
  const activeUnscheduledPlace = activeUnscheduledPlaceId
    ? placeById.get(activeUnscheduledPlaceId)
    : undefined;

  useEffect(() => {
    setWarnings([]);
  }, [trip.priorityPlaceIds, trip.selectedPlaceIds]);

  async function buildRoute() {
    if (selectedPlaces.length < 2) return;

    setIsBuilding(true);

    try {
      const result = await localRoutingProvider.buildRoute({
        trip,
        places: selectedPlaces,
      });
      setWarnings(result.warnings);
      onSaveRoute(
        result.days,
        result.unscheduledPlaceIds,
        result.unscheduledPlaceReasons
      );
    } finally {
      setIsBuilding(false);
    }
  }

  function removeUnscheduledReason(placeId: string) {
    return Object.fromEntries(
      Object.entries(trip.unscheduledPlaceReasons).filter(
        ([reasonPlaceId]) => reasonPlaceId !== placeId
      )
    );
  }

  function moveStop(dayId: string, stopId: string, direction: -1 | 1) {
    const nextDays = routeDays.map((day) => {
      if (day.id !== dayId) return day;

      const index = day.stops.findIndex((stop) => stop.id === stopId);
      const targetIndex = index + direction;

      if (index < 0 || targetIndex < 0 || targetIndex >= day.stops.length) {
        return day;
      }

      const nextStops = [...day.stops];
      [nextStops[index], nextStops[targetIndex]] = [
        nextStops[targetIndex],
        nextStops[index],
      ];

      return recalculateRouteDay(trip, { ...day, stops: nextStops }, places);
    });

    onSaveRoute(
      nextDays,
      trip.unscheduledPlaceIds,
      trip.unscheduledPlaceReasons
    );
  }

  function removeActiveStop() {
    if (!activeStop || !activeRouteStop || !activePlace) return;

    Alert.alert(
      "Remove from route?",
      `${activePlace.name} stays selected and moves to Unscheduled.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            const nextDays = routeDays.map((day) =>
              day.id === activeStop.dayId
                ? recalculateRouteDay(
                    trip,
                    {
                      ...day,
                      stops: day.stops.filter(
                        (stop) => stop.id !== activeStop.stopId
                      ),
                    },
                    places
                  )
                : day
            );
            onSaveRoute(
              nextDays,
              [...trip.unscheduledPlaceIds, activeRouteStop.placeId],
              {
                ...trip.unscheduledPlaceReasons,
                [activeRouteStop.placeId]: "removed_manually",
              }
            );
            setActiveStop(null);
          },
        },
      ]
    );
  }

  function moveActiveStopToDay(targetDayId: string) {
    if (!activeStop || !activeRouteStop || targetDayId === activeStop.dayId) {
      setActiveStop(null);
      return;
    }

    const changedDays = new Set([activeStop.dayId, targetDayId]);
    const movedDays = routeDays.map((day) => {
      const withoutStop = day.stops.filter(
        (stop) => stop.id !== activeStop.stopId
      );

      return day.id === targetDayId
        ? { ...day, stops: [...withoutStop, activeRouteStop] }
        : { ...day, stops: withoutStop };
    });
    const nextDays = movedDays.map((day) =>
      changedDays.has(day.id) ? recalculateRouteDay(trip, day, places) : day
    );

    onSaveRoute(
      nextDays,
      trip.unscheduledPlaceIds.filter(
        (placeId) => placeId !== activeRouteStop.placeId
      ),
      removeUnscheduledReason(activeRouteStop.placeId)
    );
    setActiveStop(null);
  }

  function changeActiveDuration(delta: number) {
    if (!activeStop || !activeRouteStop) return;

    const nextDuration = Math.max(15, activeRouteStop.visitMinutes + delta);
    const nextDays = routeDays.map((day) =>
      day.id === activeStop.dayId
        ? recalculateRouteDay(
            trip,
            {
              ...day,
              stops: day.stops.map((stop) =>
                stop.id === activeStop.stopId
                  ? { ...stop, visitMinutes: nextDuration }
                  : stop
              ),
            },
            places
          )
        : day
    );

    onSaveRoute(
      nextDays,
      trip.unscheduledPlaceIds,
      trip.unscheduledPlaceReasons
    );
  }

  function togglePriorityPlace(placeId: string) {
    const isPriority = trip.priorityPlaceIds.includes(placeId);
    const nextPriorityIds = isPriority
      ? trip.priorityPlaceIds.filter(
          (priorityPlaceId) => priorityPlaceId !== placeId
        )
      : [...trip.priorityPlaceIds, placeId];
    const nextDays = routeDays.map((day) => ({
      ...day,
      stops: day.stops.map((stop) =>
        stop.placeId === placeId
          ? { ...stop, isPriority: !isPriority }
          : stop
      ),
    }));

    onSetPriorityPlaces(nextPriorityIds);

    if (routeDays.length > 0) {
      onSaveRoute(
        nextDays,
        trip.unscheduledPlaceIds,
        trip.unscheduledPlaceReasons
      );
    }
  }

  function addUnscheduledPlaceToDay(targetDayId: string) {
    if (!activeUnscheduledPlace) return;

    const nextDays = routeDays.map((day) =>
      day.id === targetDayId
        ? appendPlaceToRouteDay(trip, day, activeUnscheduledPlace, places)
        : day
    );

    onSaveRoute(
      nextDays,
      trip.unscheduledPlaceIds.filter(
        (placeId) => placeId !== activeUnscheduledPlace.id
      ),
      removeUnscheduledReason(activeUnscheduledPlace.id)
    );
    setActiveUnscheduledPlaceId(null);
  }

  function toggleActivePriority() {
    if (!activeRouteStop) return;

    togglePriorityPlace(activeRouteStop.placeId);
  }

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <View>
          <Text style={styles.eyebrow}>ROUTE BUILDER</Text>
          <Text style={styles.title}>Route</Text>
        </View>
      </View>

      <View style={styles.constraints}>
        <Constraint icon="speedometer-outline" value={trip.pace ?? "balanced"} />
        <Constraint icon="navigate-outline" value={trip.maxTravelDistance ?? "moderate"} />
        <Constraint
          icon="time-outline"
          value={`${trip.dailyStartTime ?? "09:00"}–${trip.dailyEndTime ?? "19:00"}`}
        />
      </View>

      {trip.budget !== undefined && (
        <View style={styles.budgetCard}>
          <BudgetFact
            label="Trip budget"
            value={formatTripMoney(trip.budget, trip.currency)}
          />
          <View style={styles.budgetDivider} />
          <BudgetFact
            label="Planned activities"
            value={formatTripMoney(plannedActivityCost, trip.currency)}
          />
          <View style={styles.budgetDivider} />
          <BudgetFact
            label="Remaining"
            value={formatTripMoney(budgetRemaining ?? 0, trip.currency)}
            exceeded={(budgetRemaining ?? 0) < 0}
          />
          {(budgetRemaining ?? 0) < 0 && (
            <View style={styles.budgetWarning}>
              <Ionicons name="warning-outline" size={15} color="#A54D52" />
              <Text style={styles.budgetWarningText}>
                Estimated activities exceed your budget by{" "}
                {formatTripMoney(Math.abs(budgetRemaining ?? 0), trip.currency)}.
              </Text>
            </View>
          )}
        </View>
      )}

      {hasRoute && (
        <View style={styles.summary}>
          <SummaryFact label="Stops" value={routeStopCount} />
          <SummaryFact label="Visits" value={minutesLabel(summary.totalVisitMinutes)} />
          <SummaryFact label="Travel" value={minutesLabel(summary.totalTravelMinutes)} />
          <SummaryFact
            label="Cost"
            value={`≈ ${summary.estimatedCost.toFixed(0)} ${summary.currency}`}
          />
        </View>
      )}

      {!canBuildRoute && (
        <View style={styles.routeEmptyState}>
          <Ionicons name="git-branch-outline" size={18} color="#765FD2" />
          <View style={styles.routeEmptyCopy}>
            <Text style={styles.routeEmptyTitle}>
              Add at least 2 places to build a route.
            </Text>
            <Text style={styles.routeEmptyText}>
              {selectedPlaces.length === 1
                ? "Add one more place to create a realistic sequence."
                : "Choose places from Discover, Wishlist or add your own."}
            </Text>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.buildButton,
          (isBuilding || !canBuildRoute) && styles.buildButtonDisabled,
        ]}
        disabled={isBuilding || !canBuildRoute}
        onPress={buildRoute}
      >
        {isBuilding ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Ionicons name={hasRoute ? "refresh" : "sparkles"} size={17} color="#FFFFFF" />
        )}
        <Text style={styles.buildText}>
          {hasRoute ? "Rebuild route" : "Build realistic route"}
        </Text>
      </TouchableOpacity>

      {warnings.map((warning) => (
        <View key={warning} style={styles.warning}>
          <Ionicons name="information-circle-outline" size={15} color="#8B6A22" />
          <Text style={styles.warningText}>{warning}</Text>
        </View>
      ))}

      <TripPlacesOverview
        places={selectedPlaces}
        priorityPlaceIds={trip.priorityPlaceIds}
        onAddPlace={onOpenPlaces}
        onBrowseDiscover={onBrowseDiscover}
        onAddManualPlace={onAddManualPlace}
        onTogglePriority={togglePriorityPlace}
      />

      {hasRoute && (
        <>
          <View style={styles.tabs}>
            {(["timeline", "map"] as const).map((option) => {
              const active = view === option;

              return (
                <TouchableOpacity
                  key={option}
                  style={[styles.tab, active && styles.tabActive]}
                  onPress={() => setView(option)}
                >
                  <Ionicons
                    name={option === "timeline" ? "list-outline" : "map-outline"}
                    size={15}
                    color={active ? "#FFFFFF" : "#6E6574"}
                  />
                  <Text style={[styles.tabText, active && styles.tabTextActive]}>
                    {option === "timeline" ? "Timeline" : "Map"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {view === "timeline" ? (
            <RouteTimeline
              routeDays={routeDays}
              places={places}
              onMove={moveStop}
              onOpenActions={(dayId, stopId) =>
                setActiveStop({ dayId, stopId })
              }
            />
          ) : (
            <RouteMap routeDays={routeDays} places={places} />
          )}
          <Text style={styles.disclaimer}>
            Times and costs are local estimates. Live traffic, opening hours and
            ticket availability require future routing and places APIs.
          </Text>
        </>
      )}

      {unscheduledPlaces.length > 0 && (
        <View style={styles.unscheduledCard}>
          <View style={styles.unscheduledHeader}>
            <Ionicons name="time-outline" size={17} color="#8B6A22" />
            <Text style={styles.unscheduledTitle}>
              Couldn’t fit into your route
            </Text>
          </View>
          <Text style={styles.unscheduledText}>
            These places did not fit the available hours, budget or travel area.
          </Text>
          {unscheduledPlaces.map((place) => {
            const isPriority = trip.priorityPlaceIds.includes(place.id);

            return (
              <View key={place.id} style={styles.unscheduledPlaceRow}>
                <View style={styles.unscheduledPlaceBody}>
                  <View style={styles.unscheduledNameRow}>
                    <Ionicons
                      name={isPriority ? "star" : "ellipse"}
                      size={isPriority ? 12 : 5}
                      color={isPriority ? "#8B6A22" : "#806A3A"}
                    />
                    <Text style={styles.unscheduledPlace}>{place.name}</Text>
                    {isPriority && (
                      <Text style={styles.unscheduledPriority}>Must see</Text>
                    )}
                  </View>
                  <Text style={styles.unscheduledReason}>
                    {UNSCHEDULED_REASON_LABELS[
                      trip.unscheduledPlaceReasons[place.id] ??
                        "not_enough_time"
                    ]}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.addToDayButton}
                  onPress={() => setActiveUnscheduledPlaceId(place.id)}
                >
                  <Ionicons name="add" size={14} color="#765FD2" />
                  <Text style={styles.addToDayText}>Add to day</Text>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      <Modal
        visible={Boolean(activeStop && activeRouteStop && activePlace)}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveStop(null)}
      >
        <View style={styles.modalRoot}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setActiveStop(null)}
          />
          <View style={styles.actionSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{activePlace?.name}</Text>
            <Text style={styles.sheetSubtitle}>Edit route stop</Text>

            <View style={styles.durationEditor}>
              <View>
                <Text style={styles.actionLabel}>Visit duration</Text>
                <Text style={styles.durationValue}>
                  {activeRouteStop?.visitMinutes ?? 0} minutes
                </Text>
              </View>
              <View style={styles.durationButtons}>
                <TouchableOpacity
                  style={styles.durationButton}
                  onPress={() => changeActiveDuration(-15)}
                >
                  <Ionicons name="remove" size={18} color="#665676" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.durationButton}
                  onPress={() => changeActiveDuration(15)}
                >
                  <Ionicons name="add" size={18} color="#665676" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={styles.sheetAction} onPress={toggleActivePriority}>
              <Ionicons
                name={
                  activeRouteStop?.isPriority ? "star" : "star-outline"
                }
                size={18}
                color="#8B6A22"
              />
              <Text style={styles.sheetActionText}>
                {activeRouteStop?.isPriority
                  ? "Remove Must see"
                  : "Mark as Must see"}
              </Text>
            </TouchableOpacity>

            <Text style={styles.moveTitle}>Move to another day</Text>
            <View style={styles.dayChoices}>
              {routeDays.map((day) => {
                const current = day.id === activeStop?.dayId;

                return (
                  <TouchableOpacity
                    key={day.id}
                    style={[styles.dayChoice, current && styles.dayChoiceCurrent]}
                    disabled={current}
                    onPress={() => moveActiveStopToDay(day.id)}
                  >
                    <Text
                      style={[
                        styles.dayChoiceText,
                        current && styles.dayChoiceTextCurrent,
                      ]}
                    >
                      Day {day.dayNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.removeAction} onPress={removeActiveStop}>
              <Ionicons name="trash-outline" size={17} color="#B5535B" />
              <Text style={styles.removeActionText}>Remove from route</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={Boolean(activeUnscheduledPlace)}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveUnscheduledPlaceId(null)}
      >
        <View style={styles.modalRoot}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setActiveUnscheduledPlaceId(null)}
          />
          <View style={styles.actionSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{activeUnscheduledPlace?.name}</Text>
            <Text style={styles.sheetSubtitle}>
              Add manually to a route day
            </Text>
            <View style={styles.manualWarning}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color="#8B6A22"
              />
              <Text style={styles.manualWarningText}>
                Manual placement may go beyond the day’s hours, budget or known
                opening time.
              </Text>
            </View>
            <Text style={styles.moveTitle}>Choose day</Text>
            <View style={styles.dayChoices}>
              {routeDays.map((day) => (
                <TouchableOpacity
                  key={day.id}
                  style={styles.dayChoice}
                  onPress={() => addUnscheduledPlaceToDay(day.id)}
                >
                  <Text style={styles.dayChoiceText}>Day {day.dayNumber}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Constraint({ icon, value }: { icon: React.ComponentProps<typeof Ionicons>["name"]; value: string }) {
  return (
    <View style={styles.constraint}>
      <Ionicons name={icon} size={13} color="#75668A" />
      <Text style={styles.constraintText}>{value}</Text>
    </View>
  );
}

function SummaryFact({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.summaryFact}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function BudgetFact({
  label,
  value,
  exceeded,
}: {
  label: string;
  value: string;
  exceeded?: boolean;
}) {
  return (
    <View style={styles.budgetFact}>
      <Text style={styles.budgetLabel}>{label}</Text>
      <Text style={[styles.budgetValue, exceeded && styles.budgetValueExceeded]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 29 },
  headingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  eyebrow: { fontSize: 8, fontWeight: "800", letterSpacing: 1.2, color: "#8E7DAE" },
  title: { marginTop: 3, fontSize: 22, fontWeight: "700", color: "#111111" },
  constraints: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 7 },
  constraint: { minHeight: 30, borderRadius: 15, paddingHorizontal: 10, flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#F0EDF4" },
  constraintText: { fontSize: 9, fontWeight: "600", textTransform: "capitalize", color: "#655D69" },
  budgetCard: { marginTop: 13, borderRadius: 19, borderWidth: 1, borderColor: "#E3DDEC", paddingHorizontal: 14, backgroundColor: "#FFFFFF" },
  budgetFact: { minHeight: 55, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  budgetLabel: { fontSize: 11, color: "#746D78" },
  budgetValue: { fontSize: 15, fontWeight: "800", color: "#30274B" },
  budgetValueExceeded: { color: "#B5535B" },
  budgetDivider: { height: 1, backgroundColor: "#EEEAF2" },
  budgetWarning: { marginHorizontal: -1, marginBottom: 13, borderRadius: 13, padding: 10, flexDirection: "row", alignItems: "flex-start", gap: 7, backgroundColor: "#FFF2F2" },
  budgetWarningText: { flex: 1, fontSize: 10, lineHeight: 15, color: "#8F4449" },
  summary: { marginTop: 13, borderRadius: 18, paddingVertical: 13, flexDirection: "row", backgroundColor: "#F1EDFA" },
  summaryFact: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 12, fontWeight: "800", color: "#30274B" },
  summaryLabel: { marginTop: 3, fontSize: 8, color: "#7B7186" },
  routeEmptyState: { marginTop: 13, borderRadius: 16, borderWidth: 1, borderColor: "#DED6F1", padding: 12, flexDirection: "row", alignItems: "flex-start", gap: 9, backgroundColor: "#F7F4FF" },
  routeEmptyCopy: { flex: 1 },
  routeEmptyTitle: { fontSize: 11, fontWeight: "700", color: "#4C3F72" },
  routeEmptyText: { marginTop: 3, fontSize: 9, lineHeight: 14, color: "#7D7290" },
  buildButton: { height: 50, marginTop: 12, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#171419" },
  buildButtonDisabled: { opacity: 0.65 },
  buildText: { fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  warning: { marginTop: 9, borderRadius: 13, borderWidth: 1, borderColor: "#E8D9B6", padding: 10, flexDirection: "row", alignItems: "flex-start", gap: 7, backgroundColor: "#FFF9EC" },
  warningText: { flex: 1, fontSize: 10, lineHeight: 15, color: "#725B2A" },
  unscheduledCard: { marginTop: 13, borderRadius: 18, borderWidth: 1, borderColor: "#E8D9B6", padding: 14, backgroundColor: "#FFF9EC" },
  unscheduledHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  unscheduledTitle: { fontSize: 13, fontWeight: "700", color: "#725B2A" },
  unscheduledText: { marginTop: 7, marginBottom: 6, fontSize: 10, lineHeight: 15, color: "#806A3A" },
  unscheduledPlaceRow: { minHeight: 52, marginTop: 6, borderTopWidth: 1, borderTopColor: "#ECDDCA", flexDirection: "row", alignItems: "center", gap: 8 },
  unscheduledPlaceBody: { flex: 1, paddingVertical: 7 },
  unscheduledNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  unscheduledPlace: { flexShrink: 1, fontSize: 11, fontWeight: "600", color: "#5F4D28" },
  unscheduledReason: { marginTop: 4, fontSize: 9, color: "#9A7440" },
  unscheduledPriority: { borderRadius: 8, paddingHorizontal: 6, paddingVertical: 3, fontSize: 7, fontWeight: "800", textTransform: "uppercase", color: "#8B6A22", backgroundColor: "#FFF0CA" },
  addToDayButton: { minHeight: 32, borderRadius: 11, paddingHorizontal: 8, flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#EEE9FF" },
  addToDayText: { fontSize: 8, fontWeight: "700", color: "#765FD2" },
  tabs: { height: 44, marginTop: 18, marginBottom: 12, borderRadius: 14, padding: 4, flexDirection: "row", backgroundColor: "#ECE8F0" },
  tab: { flex: 1, borderRadius: 11, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  tabActive: { backgroundColor: "#765FD2" },
  tabText: { fontSize: 11, fontWeight: "700", color: "#6E6574" },
  tabTextActive: { color: "#FFFFFF" },
  disclaimer: { marginTop: 10, fontSize: 9, lineHeight: 14, color: "#8A838D" },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(18, 15, 22, 0.42)" },
  actionSheet: { maxHeight: "82%", borderTopLeftRadius: 26, borderTopRightRadius: 26, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30, backgroundColor: "#FFFFFF" },
  sheetHandle: { width: 42, height: 4, marginBottom: 17, borderRadius: 2, alignSelf: "center", backgroundColor: "#D5D0D8" },
  sheetTitle: { fontSize: 21, fontWeight: "700", color: "#171419" },
  sheetSubtitle: { marginTop: 3, marginBottom: 17, fontSize: 10, color: "#867E8A" },
  manualWarning: { borderRadius: 14, padding: 11, flexDirection: "row", alignItems: "flex-start", gap: 7, backgroundColor: "#FFF8E8" },
  manualWarningText: { flex: 1, fontSize: 10, lineHeight: 15, color: "#725B2A" },
  durationEditor: { minHeight: 66, borderRadius: 17, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#F4F1F8" },
  actionLabel: { fontSize: 10, color: "#817986" },
  durationValue: { marginTop: 4, fontSize: 13, fontWeight: "700", color: "#302A34" },
  durationButtons: { flexDirection: "row", gap: 8 },
  durationButton: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  sheetAction: { minHeight: 51, marginTop: 10, borderRadius: 15, borderWidth: 1, borderColor: "#E5DCC5", paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#FFFBF2" },
  sheetActionText: { fontSize: 12, fontWeight: "700", color: "#6F5724" },
  moveTitle: { marginTop: 18, marginBottom: 9, fontSize: 11, fontWeight: "700", color: "#5E5662" },
  dayChoices: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  dayChoice: { minHeight: 38, minWidth: 72, borderRadius: 13, paddingHorizontal: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#EEE9FF" },
  dayChoiceCurrent: { backgroundColor: "#765FD2" },
  dayChoiceText: { fontSize: 11, fontWeight: "700", color: "#765FD2" },
  dayChoiceTextCurrent: { color: "#FFFFFF" },
  removeAction: { height: 48, marginTop: 20, borderRadius: 15, borderWidth: 1, borderColor: "#E7CDD0", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, backgroundColor: "#FFF9F9" },
  removeActionText: { fontSize: 12, fontWeight: "700", color: "#B5535B" },
});
