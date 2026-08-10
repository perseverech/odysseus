import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import type { CreateFlightInput, Flight, Trip } from "../../models/travel";
import {
  dateInputToIso,
  formatDateInput,
  formatTimeInput,
  isoDateToInput,
  normalizeDateInput,
  normalizeTimeInput,
  timeInputTo24Hour,
} from "../../utils/travelDates";

type Props = {
  initialFlight?: Flight;
  linkedTrip?: Trip;
  submitLabel: string;
  onSubmit: (input: CreateFlightInput) => void;
};

type FlightFormState = {
  airline: string;
  flightNumber: string;
  departureCity: string;
  departureAirport: string;
  departureIata: string;
  arrivalCity: string;
  arrivalAirport: string;
  arrivalIata: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  terminal: string;
  gate: string;
  seat: string;
  bookingReference: string;
  notes: string;
};

type FieldConfig = {
  key: keyof FlightFormState;
  label: string;
  placeholder: string;
  optional?: boolean;
  maxLength?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  dateInput?: boolean;
  timeInput?: boolean;
};

const FLIGHT_FIELDS: FieldConfig[] = [
  { key: "airline", label: "Airline", placeholder: "airBaltic", optional: true },
  {
    key: "flightNumber",
    label: "Flight number",
    placeholder: "BT 683",
    optional: true,
    autoCapitalize: "characters",
  },
];

const DEPARTURE_FIELDS: FieldConfig[] = [
  { key: "departureCity", label: "Departure city", placeholder: "Riga" },
  {
    key: "departureAirport",
    label: "Departure airport",
    placeholder: "Riga International Airport",
  },
  {
    key: "departureIata",
    label: "Departure IATA",
    placeholder: "RIX",
    maxLength: 3,
    autoCapitalize: "characters",
  },
  {
    key: "departureDate",
    label: "Departure date",
    placeholder: "DDMMYYYY",
    autoCapitalize: "none",
    dateInput: true,
  },
  {
    key: "departureTime",
    label: "Departure time",
    placeholder: "815 → 08:15",
    autoCapitalize: "none",
    timeInput: true,
  },
];

const ARRIVAL_FIELDS: FieldConfig[] = [
  { key: "arrivalCity", label: "Arrival city", placeholder: "Barcelona" },
  {
    key: "arrivalAirport",
    label: "Arrival airport",
    placeholder: "Barcelona–El Prat Airport",
  },
  {
    key: "arrivalIata",
    label: "Arrival IATA",
    placeholder: "BCN",
    maxLength: 3,
    autoCapitalize: "characters",
  },
  {
    key: "arrivalDate",
    label: "Arrival date",
    placeholder: "DDMMYYYY",
    optional: true,
    autoCapitalize: "none",
    dateInput: true,
  },
  {
    key: "arrivalTime",
    label: "Arrival time",
    placeholder: "955 → 09:55",
    autoCapitalize: "none",
    timeInput: true,
  },
];

const TRAVEL_FIELDS: FieldConfig[] = [
  { key: "terminal", label: "Terminal", placeholder: "B", optional: true },
  {
    key: "gate",
    label: "Gate",
    placeholder: "12",
    optional: true,
    autoCapitalize: "characters",
  },
  {
    key: "seat",
    label: "Seat",
    placeholder: "18A",
    optional: true,
    autoCapitalize: "characters",
  },
  {
    key: "bookingReference",
    label: "Booking reference",
    placeholder: "ABC123",
    optional: true,
    autoCapitalize: "characters",
  },
  {
    key: "notes",
    label: "Notes",
    placeholder: "Anything useful for travel day",
    optional: true,
    multiline: true,
    autoCapitalize: "sentences",
  },
];

const REQUIRED_FIELDS: Array<keyof FlightFormState> = [
  "departureCity",
  "departureAirport",
  "departureIata",
  "arrivalCity",
  "arrivalAirport",
  "arrivalIata",
  "departureDate",
  "departureTime",
  "arrivalTime",
];

function createInitialState(
  initialFlight?: Flight,
  linkedTrip?: Trip
): FlightFormState {
  if (initialFlight) {
    return {
      airline: initialFlight.airline ?? "",
      flightNumber: initialFlight.flightNumber ?? "",
      departureCity: initialFlight.departureCity,
      departureAirport: initialFlight.departureAirport,
      departureIata: initialFlight.departureIata,
      arrivalCity: initialFlight.arrivalCity,
      arrivalAirport: initialFlight.arrivalAirport,
      arrivalIata: initialFlight.arrivalIata,
      departureDate: isoDateToInput(initialFlight.departureDate),
      departureTime: initialFlight.departureTime,
      arrivalDate: initialFlight.arrivalDate
        ? isoDateToInput(initialFlight.arrivalDate)
        : "",
      arrivalTime: initialFlight.arrivalTime,
      terminal: initialFlight.terminal ?? "",
      gate: initialFlight.gate ?? "",
      seat: initialFlight.seat ?? "",
      bookingReference: initialFlight.bookingReference ?? "",
      notes: initialFlight.notes ?? "",
    };
  }

  return {
    airline: "",
    flightNumber: "",
    departureCity: "",
    departureAirport: "",
    departureIata: "",
    arrivalCity: linkedTrip?.destinationCity ?? "",
    arrivalAirport: "",
    arrivalIata: "",
    departureDate: linkedTrip?.startDate
      ? isoDateToInput(linkedTrip.startDate)
      : "",
    departureTime: "",
    arrivalDate: linkedTrip?.startDate
      ? isoDateToInput(linkedTrip.startDate)
      : "",
    arrivalTime: "",
    terminal: "",
    gate: "",
    seat: "",
    bookingReference: "",
    notes: "",
  };
}

export default function FlightForm({
  initialFlight,
  linkedTrip,
  submitLabel,
  onSubmit,
}: Props) {
  const [form, setForm] = useState(() =>
    createInitialState(initialFlight, linkedTrip)
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(createInitialState(initialFlight, linkedTrip));
    setError(null);
  }, [initialFlight, linkedTrip]);

  function updateField(field: keyof FlightFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function submit() {
    if (REQUIRED_FIELDS.some((field) => !form[field].trim())) {
      setError("Complete all required flight fields.");
      return;
    }

    if (
      !/^[a-z]{3}$/i.test(form.departureIata.trim()) ||
      !/^[a-z]{3}$/i.test(form.arrivalIata.trim())
    ) {
      setError("IATA codes must contain exactly 3 letters.");
      return;
    }

    const departureDate = dateInputToIso(form.departureDate);
    const arrivalDate = form.arrivalDate.trim()
      ? dateInputToIso(form.arrivalDate)
      : undefined;
    const departureTime = timeInputTo24Hour(form.departureTime);
    const arrivalTime = timeInputTo24Hour(form.arrivalTime);

    if (!departureDate || arrivalDate === null) {
      setError("Enter a real date, for example 892026 or 17012027.");
      return;
    }

    if (!departureTime || !arrivalTime) {
      setError("Enter a real 24-hour time, for example 815 or 1830.");
      return;
    }

    if (arrivalDate && arrivalDate < departureDate) {
      setError("Arrival date cannot be before departure date.");
      return;
    }

    onSubmit({
      tripId: initialFlight?.tripId ?? linkedTrip?.id,
      airline: form.airline,
      flightNumber: form.flightNumber,
      departureCity: form.departureCity,
      departureAirport: form.departureAirport,
      departureIata: form.departureIata,
      arrivalCity: form.arrivalCity,
      arrivalAirport: form.arrivalAirport,
      arrivalIata: form.arrivalIata,
      departureDate,
      departureTime,
      arrivalDate,
      arrivalTime,
      terminal: form.terminal,
      gate: form.gate,
      seat: form.seat,
      bookingReference: form.bookingReference,
      notes: form.notes,
    });
  }

  return (
    <View>
      <FormSection
        title="FLIGHT"
        fields={FLIGHT_FIELDS}
        form={form}
        onChange={updateField}
      />
      <FormSection
        title="DEPARTURE"
        fields={DEPARTURE_FIELDS}
        form={form}
        onChange={updateField}
      />
      <FormSection
        title="ARRIVAL"
        fields={ARRIVAL_FIELDS}
        form={form}
        onChange={updateField}
      />
      <FormSection
        title="TRAVEL DETAILS"
        fields={TRAVEL_FIELDS}
        form={form}
        onChange={updateField}
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <TouchableOpacity
        style={styles.submitButton}
        activeOpacity={0.82}
        onPress={submit}
        accessibilityRole="button"
        accessibilityLabel={submitLabel}
      >
        <Text style={styles.submitText}>{submitLabel}</Text>
      </TouchableOpacity>
    </View>
  );
}

function FormSection({
  title,
  fields,
  form,
  onChange,
}: {
  title: string;
  fields: FieldConfig[];
  form: FlightFormState;
  onChange: (field: keyof FlightFormState, value: string) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {fields.map((field) => (
        <View key={field.key} style={styles.field}>
          <Text style={styles.label}>
            {field.label}
            {field.optional ? " · Optional" : ""}
          </Text>
          <TextInput
            value={form[field.key]}
            onChangeText={(value) =>
              onChange(
                field.key,
                field.dateInput
                  ? formatDateInput(value)
                  : field.timeInput
                    ? formatTimeInput(value)
                    : value
              )
            }
            onBlur={() => {
              if (field.dateInput) {
                onChange(field.key, normalizeDateInput(form[field.key]));
              } else if (field.timeInput) {
                onChange(field.key, normalizeTimeInput(form[field.key]));
              }
            }}
            style={[styles.input, field.multiline && styles.multilineInput]}
            placeholder={field.placeholder}
            placeholderTextColor="#A0A0A0"
            autoCapitalize={field.autoCapitalize ?? "words"}
            autoCorrect={false}
            keyboardType={
              field.dateInput || field.timeInput ? "number-pad" : "default"
            }
            maxLength={
              field.dateInput
                ? 10
                : field.timeInput
                  ? 5
                  : field.maxLength ?? (field.multiline ? 400 : 100)
            }
            multiline={field.multiline}
            textAlignVertical={field.multiline ? "top" : "center"}
          />
          {field.dateInput && (
            <Text style={styles.dateHint}>
              Type 892026 — it becomes 08.09.2026 automatically.
            </Text>
          )}
          {field.timeInput && (
            <Text style={styles.dateHint}>
              Type 815 — it becomes 08:15 automatically.
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 24 },
  sectionTitle: {
    marginBottom: 2,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "#765FD2",
  },
  field: { marginTop: 12 },
  label: {
    marginBottom: 7,
    fontSize: 12,
    fontWeight: "600",
    color: "#555555",
  },
  input: {
    height: 50,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#DEDEDE",
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#111111",
    backgroundColor: "#FFFFFF",
  },
  multilineInput: { height: 96, paddingTop: 13, paddingBottom: 13 },
  dateHint: { marginTop: 6, fontSize: 10, color: "#8D8493" },
  error: { marginBottom: 13, fontSize: 12, color: "#C75353" },
  submitButton: {
    height: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111111",
  },
  submitText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
