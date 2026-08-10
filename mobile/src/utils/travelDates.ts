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

export function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 8);

  if (digits.length === 8 && Number(digits.slice(0, 4)) >= 1900) {
    const year = digits.slice(0, 4);
    const month = digits.slice(4, 6);
    const day = digits.slice(6, 8);

    return `${day}.${month}.${year}`;
  }

  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return [day, month, year].filter(Boolean).join(".");
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

  const digits = trimmed.replace(/\D/g, "");

  if (digits.length !== 8) return null;

  const startsWithYear = Number(digits.slice(0, 4)) >= 1900;
  const year = startsWithYear
    ? digits.slice(0, 4)
    : digits.slice(4, 8);
  const month = startsWithYear
    ? digits.slice(4, 6)
    : digits.slice(2, 4);
  const day = startsWithYear
    ? digits.slice(6, 8)
    : digits.slice(0, 2);
  const isoDate = `${year}-${month}-${day}`;

  return isValidIsoDate(isoDate) ? isoDate : null;
}

export function isValidTime(value: string) {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());

  return Boolean(
    match && Number(match[1]) <= 23 && Number(match[2]) <= 59
  );
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
