import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  type KeyboardTypeOptions,
} from "react-native";

import type {
  CreateTripInput,
  MaxTravelDistance,
  Trip,
  TripInterest,
  TripPace,
  TripStatus,
} from "../../models/travel";
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
  budget: string;
  currency: string;
  dailyStartTime: string;
  dailyEndTime: string;
  interests: TripInterest[];
  pace: TripPace;
  maxTravelDistance: MaxTravelDistance;
  notes: string;
};

const interestOptions: Array<{ value: TripInterest; label: string }> = [
  { value: "architecture", label: "Architecture" },
  { value: "history", label: "History" },
  { value: "food", label: "Food" },
  { value: "museums", label: "Museums" },
  { value: "nature", label: "Nature" },
  { value: "shopping", label: "Shopping" },
  { value: "nightlife", label: "Nightlife" },
  { value: "views", label: "Views" },
  { value: "hidden_gems", label: "Hidden gems" },
];

function createInitialState(trip?: Trip): TripFormState {
  return {
    destinationCity: trip?.destinationCity ?? "",
    destinationCountry: trip?.destinationCountry ?? "",
    startDate: trip ? isoDateToInput(trip.startDate) : "",
    endDate: trip ? isoDateToInput(trip.endDate) : "",
    status: trip?.status ?? "planning",
    budget: trip?.budget === undefined ? "" : String(trip.budget),
    currency: trip?.currency ?? "EUR",
    dailyStartTime: trip?.dailyStartTime ?? "",
    dailyEndTime: trip?.dailyEndTime ?? "",
    interests: trip?.interests ?? [],
    pace: trip?.pace ?? "balanced",
    maxTravelDistance: trip?.maxTravelDistance ?? "moderate",
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

  function updateField<Key extends keyof TripFormState>(
    field: Key,
    value: TripFormState[Key]
  ) {
    setForm((current) => ({ ...current, [field]: value }));
    setError(null);
  }

  function toggleInterest(interest: TripInterest) {
    const selected = form.interests.includes(interest);
    updateField(
      "interests",
      selected
        ? form.interests.filter((item) => item !== interest)
        : [...form.interests, interest]
    );
  }

  function submit() {
    const startDate = dateInputToIso(form.startDate);
    const endDate = dateInputToIso(form.endDate);
    const budget = form.budget.trim() ? Number(form.budget) : undefined;
    const dailyStartTime = form.dailyStartTime.trim()
      ? timeInputTo24Hour(form.dailyStartTime)
      : undefined;
    const dailyEndTime = form.dailyEndTime.trim()
      ? timeInputTo24Hour(form.dailyEndTime)
      : undefined;

    if (!form.destinationCity.trim() || !form.destinationCountry.trim()) {
      setError("Complete the city and country fields.");
      return;
    }

    if (!startDate || !endDate) {
      setError("Enter real dates, for example 892026 or 17012027.");
      return;
    }

    if (endDate < startDate) {
      setError("End date cannot be before start date.");
      return;
    }

    if (
      (form.dailyStartTime.trim() && !dailyStartTime) ||
      (form.dailyEndTime.trim() && !dailyEndTime)
    ) {
      setError("Enter a real 24-hour time, for example 8 or 1830.");
      return;
    }

    if (
      dailyStartTime &&
      dailyEndTime &&
      dailyEndTime <= dailyStartTime
    ) {
      setError("Daily end time must be after the start time.");
      return;
    }

    if (budget !== undefined && (!Number.isFinite(budget) || budget < 0)) {
      setError("Enter a valid budget or leave it empty.");
      return;
    }

    onSubmit({
      destinationCity: form.destinationCity,
      destinationCountry: form.destinationCountry,
      startDate,
      endDate,
      status: form.status,
      budget,
      currency: form.currency.trim().toLocaleUpperCase() || "EUR",
      dailyStartTime: dailyStartTime ?? undefined,
      dailyEndTime: dailyEndTime ?? undefined,
      interests: form.interests,
      pace: form.pace,
      maxTravelDistance: form.maxTravelDistance,
      notes: form.notes,
    });
  }

  return (
    <View>
      <FormSectionTitle title="Destination" required />
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

      <FormSectionTitle title="Dates" required />
      <View style={styles.row}>
        <View style={styles.rowField}>
          <FormField
            label="Start date"
            value={form.startDate}
            onChangeText={(value) =>
              updateField("startDate", formatDateInput(value))
            }
            onBlur={() =>
              updateField("startDate", normalizeDateInput(form.startDate))
            }
            placeholder="DDMMYYYY"
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>
        <View style={styles.rowField}>
          <FormField
            label="End date"
            value={form.endDate}
            onChangeText={(value) => updateField("endDate", formatDateInput(value))}
            onBlur={() =>
              updateField("endDate", normalizeDateInput(form.endDate))
            }
            placeholder="DDMMYYYY"
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>
      </View>
      <Text style={styles.hint}>
        Type 892026 — it becomes 08.09.2026 automatically.
      </Text>

      <FormSectionTitle title="Daily schedule" optional />
      <View style={styles.row}>
        <View style={styles.rowField}>
          <FormField
            label="Start exploring at"
            value={form.dailyStartTime}
            onChangeText={(value) =>
              updateField("dailyStartTime", formatTimeInput(value))
            }
            onBlur={() =>
              updateField(
                "dailyStartTime",
                normalizeTimeInput(form.dailyStartTime)
              )
            }
            placeholder="8 → 08:00"
            keyboardType="number-pad"
            maxLength={5}
          />
        </View>
        <View style={styles.rowField}>
          <FormField
            label="Finish around"
            value={form.dailyEndTime}
            onChangeText={(value) =>
              updateField("dailyEndTime", formatTimeInput(value))
            }
            onBlur={() =>
              updateField(
                "dailyEndTime",
                normalizeTimeInput(form.dailyEndTime)
              )
            }
            placeholder="1830 → 18:30"
            keyboardType="number-pad"
            maxLength={5}
          />
        </View>
      </View>
      <Text style={styles.hint}>
        Type only numbers — the colon and leading zero are added for you.
      </Text>

      <FormSectionTitle title="Budget" optional />
      <View style={styles.row}>
        <View style={styles.budgetField}>
          <FormField
            label="Total trip budget"
            value={form.budget}
            onChangeText={(value) => updateField("budget", value.replace(",", "."))}
            placeholder="400"
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.currencyField}>
          <FormField
            label="Currency"
            value={form.currency}
            onChangeText={(value) =>
              updateField("currency", value.toLocaleUpperCase().slice(0, 3))
            }
            placeholder="EUR"
            autoCapitalize="characters"
            maxLength={3}
          />
        </View>
      </View>

      <ChoiceSection
        label="Travel pace"
        selected={form.pace}
        options={[
          ["relaxed", "Relaxed"],
          ["balanced", "Balanced"],
          ["intensive", "Intensive"],
        ]}
        onSelect={(value) => updateField("pace", value as TripPace)}
      />

      <ChoiceSection
        label="Area"
        selected={form.maxTravelDistance}
        options={[
          ["central", "Stay mostly central"],
          ["moderate", "Moderate travelling"],
          ["anywhere", "Anywhere in the city"],
        ]}
        onSelect={(value) =>
          updateField("maxTravelDistance", value as MaxTravelDistance)
        }
        stacked
      />

      <FormSectionTitle title="Interests" optional />
      <View style={styles.chips}>
        {interestOptions.map((option) => {
          const selected = form.interests.includes(option.value);

          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.chip, selected && styles.chipSelected]}
              onPress={() => toggleInterest(option.value)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: selected }}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {initialTrip && (
        <ChoiceSection
          label="Trip status"
          selected={form.status}
          options={[
            ["planning", "Planning"],
            ["planned", "Planned"],
            ["booked", "Booked"],
            ["completed", "Completed"],
          ]}
          onSelect={(value) => updateField("status", value as TripStatus)}
        />
      )}

      <FormSectionTitle title="Notes" optional />
      <FormField
        label="Anything useful for this trip"
        value={form.notes}
        onChangeText={(value) => updateField("notes", value)}
        placeholder="Ideas, restrictions, bookings or reminders"
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

function ChoiceSection({
  label,
  selected,
  options,
  onSelect,
  stacked,
}: {
  label: string;
  selected: string;
  options: Array<readonly [string, string]>;
  onSelect: (value: string) => void;
  stacked?: boolean;
}) {
  return (
    <View style={styles.choiceSection}>
      <Text style={styles.choiceTitle}>{label}</Text>
      <View style={[styles.choiceRow, stacked && styles.choiceRowStacked]}>
        {options.map(([value, optionLabel]) => {
          const active = value === selected;

          return (
            <TouchableOpacity
              key={value}
              style={[
                styles.choice,
                stacked && styles.choiceStacked,
                active && styles.choiceSelected,
              ]}
              onPress={() => onSelect(value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
            >
              <Text
                style={[
                  styles.choiceText,
                  stacked && styles.choiceTextStacked,
                  active && styles.choiceTextSelected,
                ]}
              >
                {optionLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function FormSectionTitle({
  title,
  required,
  optional,
}: {
  title: string;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <View style={styles.formSectionTitleRow}>
      <Text style={styles.formSectionTitle}>{title}</Text>
      <Text style={styles.formSectionMeta}>
        {required ? "REQUIRED" : optional ? "OPTIONAL" : ""}
      </Text>
    </View>
  );
}

function FormField({
  label,
  value,
  onChangeText,
  onBlur,
  placeholder,
  autoFocus,
  autoCapitalize = "words",
  multiline,
  keyboardType = "default",
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  onBlur?: () => void;
  placeholder: string;
  autoFocus?: boolean;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  keyboardType?: KeyboardTypeOptions;
  maxLength?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        style={[styles.input, multiline && styles.multilineInput]}
        placeholder={placeholder}
        placeholderTextColor="#A0A0A0"
        autoFocus={autoFocus}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
        multiline={multiline}
        textAlignVertical={multiline ? "top" : "center"}
        keyboardType={keyboardType}
        maxLength={maxLength ?? (multiline ? 400 : 100)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  formSectionTitleRow: { marginTop: 7, marginBottom: 12, flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" },
  formSectionTitle: { fontSize: 17, fontWeight: "700", color: "#171419" },
  formSectionMeta: { fontSize: 8, fontWeight: "700", letterSpacing: 0.8, color: "#9A909F" },
  field: { marginBottom: 17 },
  label: { marginBottom: 7, fontSize: 12, fontWeight: "600", color: "#555555" },
  input: { height: 50, borderRadius: 15, borderWidth: 1, borderColor: "#DEDEDE", paddingHorizontal: 14, fontSize: 15, color: "#111111", backgroundColor: "#FFFFFF" },
  multilineInput: { height: 96, paddingTop: 13, paddingBottom: 13 },
  row: { flexDirection: "row", gap: 10 },
  rowField: { flex: 1 },
  budgetField: { flex: 1.6 },
  currencyField: { flex: 1 },
  hint: { marginTop: -11, marginBottom: 20, fontSize: 10, color: "#8D8493" },
  choiceTitle: { marginBottom: 11, fontSize: 17, fontWeight: "700", color: "#171419" },
  choiceSection: { marginBottom: 19 },
  choiceRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  choiceRowStacked: { flexDirection: "column", flexWrap: "nowrap" },
  choice: { minHeight: 40, minWidth: 78, flexGrow: 1, borderRadius: 13, paddingHorizontal: 10, alignItems: "center", justifyContent: "center", backgroundColor: "#EEEEEE" },
  choiceStacked: { width: "100%", flexGrow: 0, alignItems: "flex-start", paddingHorizontal: 14 },
  choiceSelected: { backgroundColor: "#E9E3FF" },
  choiceText: { fontSize: 11, fontWeight: "600", color: "#777777" },
  choiceTextStacked: { fontSize: 12 },
  choiceTextSelected: { color: "#604BAF" },
  chips: { marginBottom: 20, flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chip: { minHeight: 34, borderRadius: 17, borderWidth: 1, borderColor: "#E2DEE7", paddingHorizontal: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF" },
  chipSelected: { borderColor: "#B7A9E8", backgroundColor: "#F0ECFF" },
  chipText: { fontSize: 11, color: "#686168" },
  chipTextSelected: { fontWeight: "700", color: "#604BAF" },
  error: { marginBottom: 13, fontSize: 12, lineHeight: 17, color: "#C75353" },
  submitButton: { height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "#111111" },
  submitText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
