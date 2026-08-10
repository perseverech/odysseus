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

function getDateParts(value?: string): DateParts | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

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

export function formatSharedTripDates(startDate?: string, endDate?: string) {
  const start = getDateParts(startDate);
  const end = getDateParts(endDate);

  if (!start && !end) return "Dates to be decided";
  if (!start) return endDate ?? "Dates to be decided";
  if (!end) return `${start.day} ${MONTHS[start.month - 1]}`;

  if (start.year === end.year && start.month === end.month) {
    return `${start.day}–${end.day} ${MONTHS[start.month - 1]}`;
  }

  return `${start.day} ${MONTHS[start.month - 1]} – ${end.day} ${
    MONTHS[end.month - 1]
  }`;
}
