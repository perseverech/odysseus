const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

type DateParts = {
  year: number;
  month: number;
  day: number;
};

function getDateParts(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function isValidIsoDate(value: string) {
  return getDateParts(value) !== null;
}

function datePartsToIso(day: string, month: string, year: string) {
  const isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;

  return isValidIsoDate(isoDate) ? isoDate : null;
}

function flexibleDateDigitsToIso(digits: string) {
  if (digits.length === 8 && Number(digits.slice(0, 4)) >= 1900) {
    return datePartsToIso(
      digits.slice(6, 8),
      digits.slice(4, 6),
      digits.slice(0, 4)
    );
  }

  const layouts: Array<[dayLength: number, monthLength: number]> =
    digits.length === 8
      ? [[2, 2]]
      : digits.length === 7
        ? [
            [1, 2],
            [2, 1],
          ]
        : digits.length === 6
          ? [[1, 1]]
          : [];

  for (const [dayLength, monthLength] of layouts) {
    const day = digits.slice(0, dayLength);
    const month = digits.slice(dayLength, dayLength + monthLength);
    const year = digits.slice(dayLength + monthLength);
    const isoDate = datePartsToIso(day, month, year);

    if (isoDate) return isoDate;
  }

  return null;
}

export function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  const isoDate = flexibleDateDigitsToIso(digits);

  if (isoDate) {
    const date = getDateParts(isoDate)!;

    return `${String(date.day).padStart(2, "0")}.${String(
      date.month
    ).padStart(2, "0")}.${date.year}`;
  }

  if (digits.length === 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`;
  }

  return digits;
}

export function isoDateToInput(value: string) {
  const date = getDateParts(value);

  if (!date) return formatDateInput(value);

  return `${String(date.day).padStart(2, "0")}.${String(
    date.month
  ).padStart(2, "0")}.${date.year}`;
}

export function dateInputToIso(value: string) {
  const trimmed = value.trim();

  if (isValidIsoDate(trimmed)) return trimmed;

  const separatedDate = /^(\d{1,2})\D+(\d{1,2})\D+(\d{4})$/.exec(trimmed);

  if (separatedDate) {
    return datePartsToIso(
      separatedDate[1],
      separatedDate[2],
      separatedDate[3]
    );
  }

  const digits = trimmed.replace(/\D/g, "");

  return flexibleDateDigitsToIso(digits);
}

export function normalizeDateInput(value: string) {
  const isoDate = dateInputToIso(value);

  return isoDate ? isoDateToInput(isoDate) : formatDateInput(value);
}

export function formatTimeInput(value: string) {
  const sanitized = value.replace(/[^\d:]/g, "");
  const colonIndex = sanitized.indexOf(":");

  if (colonIndex >= 0) {
    const hours = sanitized.slice(0, colonIndex).replace(/\D/g, "").slice(0, 2);
    const minutes = sanitized
      .slice(colonIndex + 1)
      .replace(/\D/g, "")
      .slice(0, 2);

    return `${hours}:${minutes}`;
  }

  const digits = sanitized.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) return digits;
  if (digits.length === 3) return `0${digits[0]}:${digits.slice(1)}`;

  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function timeInputTo24Hour(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return null;

  let hours: string;
  let minutes: string;

  if (trimmed.includes(":")) {
    const match = /^(\d{1,2}):?(\d{0,2})$/.exec(trimmed);

    if (!match) return null;

    hours = match[1];
    minutes = match[2] || "0";
  } else {
    const digits = trimmed.replace(/\D/g, "");

    if (digits.length === 0 || digits.length > 4) return null;

    if (digits.length <= 2) {
      hours = digits;
      minutes = "0";
    } else if (digits.length === 3) {
      hours = digits.slice(0, 1);
      minutes = digits.slice(1);
    } else {
      hours = digits.slice(0, 2);
      minutes = digits.slice(2);
    }
  }

  const hourNumber = Number(hours);
  const minuteNumber = Number(minutes);

  if (hourNumber > 23 || minuteNumber > 59) return null;

  return `${String(hourNumber).padStart(2, "0")}:${String(
    minuteNumber
  ).padStart(2, "0")}`;
}

export function normalizeTimeInput(value: string) {
  return timeInputTo24Hour(value) ?? formatTimeInput(value);
}

export function isValidTime(value: string) {
  const normalized = timeInputTo24Hour(value);

  return normalized !== null;
}

export function formatTravelDate(value: string) {
  const date = getDateParts(value);

  return date
    ? `${date.day} ${MONTHS[date.month - 1]} ${date.year}`
    : value;
}

export function formatTripDateRange(
  startDate: string,
  endDate: string
) {
  const start = getDateParts(startDate);
  const end = getDateParts(endDate);

  if (!start || !end) return `${startDate} – ${endDate}`;

  if (start.year === end.year && start.month === end.month) {
    return `${start.day}–${end.day} ${MONTHS[start.month - 1]} ${start.year}`;
  }

  if (start.year === end.year) {
    return `${start.day} ${MONTHS[start.month - 1]} – ${end.day} ${
      MONTHS[end.month - 1]
    } ${start.year}`;
  }

  return `${formatTravelDate(startDate)} – ${formatTravelDate(endDate)}`;
}
