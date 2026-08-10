const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: "€",
  USD: "$",
  GBP: "£",
  JPY: "¥",
};

export function formatTripMoney(amount: number, currency = "EUR") {
  const normalizedCurrency = currency.toLocaleUpperCase();
  const symbol = CURRENCY_SYMBOLS[normalizedCurrency];
  const absoluteAmount = Math.abs(amount);
  const sign = amount < 0 ? "−" : "";
  const value = Number.isInteger(absoluteAmount)
    ? String(absoluteAmount)
    : absoluteAmount.toFixed(2);

  return symbol
    ? `${sign}${symbol}${value}`
    : `${sign}${value} ${normalizedCurrency}`;
}

export function formatVisitDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;

  if (hours === 0) return `${remainder}m`;
  if (remainder === 0) return `${hours}h`;

  return `${hours}h ${remainder}m`;
}

export function getTripDayCount(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00.000Z`);
  const end = new Date(`${endDate}T00:00:00.000Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 1;
  }

  return Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
}
