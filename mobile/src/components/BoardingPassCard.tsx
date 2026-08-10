import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";

import type { Flight } from "../models/travel";
import { formatTravelDate } from "../utils/travelDates";

type Props = {
  flight: Flight;
  onPress?: () => void;
};

const BAR_WIDTHS = [
  2, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 3, 2, 1, 2, 3,
  1, 1, 3, 2, 1, 2, 1, 3, 2, 1, 3, 1,
];

export default function BoardingPassCard({ flight, onPress }: Props) {
  const arrivalDate = flight.arrivalDate || flight.departureDate;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={onPress ? 0.82 : 1}
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={
        onPress
          ? `Open ${flight.departureIata} to ${flight.arrivalIata} flight details`
          : undefined
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.logo}>ODYSSEUS</Text>
          <Text style={styles.cardType}>DIGITAL TRAVEL CARD</Text>
        </View>

        <View style={styles.boardingBadge}>
          <Ionicons name="airplane" size={12} color="#765FD2" />
          <Text style={styles.boardingText}>BOARDING INFO</Text>
        </View>
      </View>

      <View style={styles.routeRow}>
        <RoutePoint
          iata={flight.departureIata}
          city={flight.departureCity}
          time={flight.departureTime}
        />

        <View style={styles.routeConnector}>
          <View style={styles.routeLine} />
          <Ionicons name="airplane" size={17} color="#765FD2" />
          <View style={styles.routeLine} />
        </View>

        <RoutePoint
          iata={flight.arrivalIata}
          city={flight.arrivalCity}
          time={flight.arrivalTime}
          align="right"
        />
      </View>

      <View style={styles.scheduleRow}>
        <View>
          <Text style={styles.detailLabel}>DEPARTURE</Text>
          <Text style={styles.scheduleValue}>
            {formatTravelDate(flight.departureDate).toLocaleUpperCase()}
          </Text>
        </View>

        <View style={styles.scheduleRight}>
          <Text style={styles.detailLabel}>FLIGHT</Text>
          <Text style={styles.scheduleValue}>
            {flight.flightNumber || "—"}
          </Text>
        </View>
      </View>

      {arrivalDate !== flight.departureDate && (
        <Text style={styles.arrivalDate}>
          Arrives {formatTravelDate(arrivalDate)}
        </Text>
      )}

      <View style={styles.perforation}>
        <View style={[styles.notch, styles.notchLeft]} />
        <View style={styles.dottedLine} />
        <View style={[styles.notch, styles.notchRight]} />
      </View>

      <View style={styles.airports}>
        <Text style={styles.airportName}>{flight.departureAirport}</Text>
        <View style={styles.airportArrowRow}>
          <Ionicons name="arrow-forward" size={13} color="#765FD2" />
          <Text style={styles.airportName}>{flight.arrivalAirport}</Text>
        </View>
      </View>

      {(flight.terminal || flight.gate || flight.seat) && (
        <View style={styles.metaRow}>
          <Meta label="Terminal" value={flight.terminal} />
          <Meta label="Gate" value={flight.gate} />
          <Meta label="Seat" value={flight.seat} />
        </View>
      )}

      {flight.bookingReference && (
        <View style={styles.bookingRow}>
          <Text style={styles.bookingLabel}>BOOKING</Text>
          <Text style={styles.bookingValue}>
            {flight.bookingReference}
          </Text>
        </View>
      )}

      {flight.notes && (
        <View style={styles.notesRow}>
          <Ionicons
            name="document-text-outline"
            size={14}
            color="#765FD2"
          />
          <Text style={styles.notesText}>{flight.notes}</Text>
        </View>
      )}

      <View style={styles.barcodeArea}>
        <View style={styles.barcode} accessibilityElementsHidden>
          {BAR_WIDTHS.map((width, index) => (
            <View
              key={`${width}-${index}`}
              style={[
                styles.bar,
                {
                  width,
                  height: index % 4 === 0 ? 20 : 27,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.disclaimerRow}>
          <Text style={styles.disclaimer}>TRAVEL INFO ONLY</Text>
          <Text style={styles.notValid}>NOT VALID FOR BOARDING</Text>
        </View>
      </View>

      {onPress && (
        <View style={styles.openHint}>
          <Text style={styles.openHintText}>View or edit flight</Text>
          <Ionicons name="arrow-forward" size={14} color="#765FD2" />
        </View>
      )}
    </TouchableOpacity>
  );
}

function RoutePoint({
  iata,
  city,
  time,
  align = "left",
}: {
  iata: string;
  city: string;
  time: string;
  align?: "left" | "right";
}) {
  return (
    <View
      style={[
        styles.routePoint,
        align === "right" && styles.routePointRight,
      ]}
    >
      <Text style={styles.iata}>{iata}</Text>
      <Text style={styles.city} numberOfLines={1}>
        {city}
      </Text>
      <Text style={styles.time}>{time}</Text>
    </View>
  );
}

function Meta({ label, value }: { label: string; value?: string }) {
  if (!value) return null;

  return (
    <View style={styles.metaItem}>
      <Text style={styles.detailLabel}>{label.toLocaleUpperCase()}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 14,
    overflow: "hidden",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E2E6",
    padding: 17,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  logo: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 2.2,
    color: "#111111",
  },
  cardType: {
    marginTop: 4,
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: "#A39AAE",
  },
  boardingBadge: {
    height: 26,
    borderRadius: 13,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EEE9FF",
  },
  boardingText: {
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.7,
    color: "#604BAF",
  },
  routeRow: {
    marginTop: 23,
    flexDirection: "row",
    alignItems: "center",
  },
  routePoint: { width: 94 },
  routePointRight: { alignItems: "flex-end" },
  iata: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#111111",
  },
  city: {
    maxWidth: 94,
    marginTop: 1,
    fontSize: 11,
    color: "#777777",
  },
  time: {
    marginTop: 9,
    fontSize: 18,
    fontWeight: "700",
    color: "#2D244B",
  },
  routeConnector: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  routeLine: { flex: 1, height: 1, backgroundColor: "#D8CFF1" },
  scheduleRow: {
    marginTop: 19,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  scheduleRight: { alignItems: "flex-end" },
  detailLabel: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#99919F",
  },
  scheduleValue: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "700",
    color: "#332B3C",
  },
  arrivalDate: {
    marginTop: 7,
    fontSize: 10,
    color: "#81778B",
  },
  perforation: {
    height: 26,
    marginHorizontal: -18,
    flexDirection: "row",
    alignItems: "center",
  },
  dottedLine: {
    flex: 1,
    borderTopWidth: 1,
    borderStyle: "dashed",
    borderColor: "#D8D1E5",
  },
  notch: {
    width: 15,
    height: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2E2E6",
    backgroundColor: "#F2EEFF",
  },
  notchLeft: { marginLeft: -8, marginRight: 8 },
  notchRight: { marginRight: -8, marginLeft: 8 },
  airports: { gap: 6 },
  airportArrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  airportName: {
    flexShrink: 1,
    fontSize: 11,
    lineHeight: 16,
    color: "#5F5865",
  },
  metaRow: { marginTop: 16, flexDirection: "row", gap: 8 },
  metaItem: {
    minWidth: 65,
    borderRadius: 12,
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: "#F3EFFF",
  },
  metaValue: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: "700",
    color: "#392C68",
  },
  bookingRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bookingLabel: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#99919F",
  },
  bookingValue: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#392C68",
  },
  notesRow: {
    marginTop: 12,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    backgroundColor: "#FAF8FF",
  },
  notesText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 15,
    color: "#6C6472",
  },
  barcodeArea: {
    marginTop: 17,
    paddingTop: 13,
    borderTopWidth: 1,
    borderTopColor: "#EFECEF",
  },
  barcode: {
    height: 28,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  bar: { backgroundColor: "#28242D" },
  disclaimerRow: {
    marginTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  disclaimer: {
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 1.1,
    color: "#807785",
  },
  notValid: {
    fontSize: 7,
    fontWeight: "700",
    letterSpacing: 0.7,
    color: "#A39AAE",
  },
  openHint: {
    marginTop: 14,
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5F1FF",
  },
  openHintText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6653B0",
  },
});
