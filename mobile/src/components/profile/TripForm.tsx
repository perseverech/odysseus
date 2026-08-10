import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

import type { CreateTripInput, Trip, TripStatus } from "../../models/travel";
import { isValidIsoDate } from "../../utils/travelDates";

type Props = {
  initialTrip?: Trip;
  submitLabel: string;
  onSubmit: (input: CreateTripInput) => void;
};

type TripFormState = {
  destinationCity: string;
  destinationCountry: string;
  startDate: string;
  endDate: string;
  status: TripStatus;
  notes: string;
};

function createInitialState(trip?: Trip): TripFormState {
  return {
    destinationCity: trip?.destinationCity ?? "",
    destinationCountry: trip?.destinationCountry ?? "",
    startDate: trip?.startDate ?? "",
    endDate: trip?.endDate ?? "",
    status: trip?.status ?? "planned",
    notes: trip?.notes ?? "",
  };
}

export default function TripForm({ initialTrip, submitLabel, onSubmit }: Props) {
  const [form, setForm] = useState(() => createInitialState(initialTrip));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(createInitialState(initialTrip));
    setError(null);
  }, [initialTrip]);

  function updateField(
    field: keyof TripFormState,
    value: string | TripStatus
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function submit() {
    if (
      !form.destinationCity.trim() ||
      !form.destinationCountry.trim() ||
      !form.startDate.trim() ||
      !form.endDate.trim()
    ) {
      setError("Complete all required trip fields.");
      return;
    }

    if (!isValidIsoDate(form.startDate) || !isValidIsoDate(form.endDate)) {
      setError("Use YYYY-MM-DD for both dates.");
      return;
    }

    if (form.endDate < form.startDate) {
      setError("End date cannot be before start date.");
      return;
    }

    onSubmit({
      destinationCity: form.destinationCity,
      destinationCountry: form.destinationCountry,
      startDate: form.startDate,
      endDate: form.endDate,
      status: form.status,
      notes: form.notes,
    });
  }

  return (
    <View>
      <FormField
        label="City"
        value={form.destinationCity}
        onChangeText={(value) => updateField("destinationCity", value)}
        placeholder="Barcelona"
        autoFocus={!initialTrip}
      />
      <FormField
        label="Country"
        value={form.destinationCountry}
        onChangeText={(value) => updateField("destinationCountry", value)}
        placeholder="Spain"
      />

      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <FormField
            label="Start date"
            value={form.startDate}
            onChangeText={(value) => updateField("startDate", value)}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
          />
        </View>
        <View style={styles.dateField}>
          <FormField
            label="End date"
            value={form.endDate}
            onChangeText={(value) => updateField("endDate", value)}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
          />
        </View>
      </View>

      <Text style={styles.label}>Status</Text>
      <View style={styles.statusRow}>
        {(["planned", "booked"] as const).map((status) => {
          const selected = form.status === status;

          return (
            <TouchableOpacity
              key={status}
              style={[styles.statusButton, selected && styles.statusSelected]}
              onPress={() => updateField("status", status)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
            >
              <Text
                style={[
                  styles.statusText,
                  selected && styles.statusTextSelected,
                ]}
              >
                {status === "planned" ? "Planned" : "Booked"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FormField
        label="Notes · Optional"
        value={form.notes}
        onChangeText={(value) => updateField("notes", value)}
        placeholder="Ideas, bookings or reminders"
        multiline
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

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  autoFocus,
  autoCapitalize = "words",
  multiline,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, multiline && styles.multilineInput]}
        placeholder={placeholder}
        placeholderTextColor="#A0A0A0"
        autoFocus={autoFocus}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        maxLength={multiline ? 400 : 100}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { marginBottom: 17 },
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
  dateRow: { flexDirection: "row", gap: 10 },
  dateField: { flex: 1 },
  statusRow: { marginBottom: 17, flexDirection: "row", gap: 8 },
  statusButton: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEEEEE",
  },
  statusSelected: { backgroundColor: "#E9E3FF" },
  statusText: { fontSize: 13, fontWeight: "600", color: "#777777" },
  statusTextSelected: { color: "#604BAF" },
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
