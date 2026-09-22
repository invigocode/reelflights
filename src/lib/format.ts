const CURRENCY_SYMBOLS: Record<string, string> = { GBP: "£", EUR: "€", USD: "$" };

export function formatPrice(amount: number, currency: string): string {
  const symbol = CURRENCY_SYMBOLS[currency] ?? `${currency} `;
  return `${symbol}${Math.round(amount)}`;
}

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function parseDate(iso: string): { day: number; month: number } {
  const [, month, day] = iso.split("-").map(Number);
  return { day, month: month - 1 };
}

export function formatDateRange(departureIso: string, returnIso?: string): string {
  const dep = parseDate(departureIso);
  if (!returnIso) return `${dep.day} ${MONTH_ABBR[dep.month]}`;

  const ret = parseDate(returnIso);
  if (dep.month === ret.month) {
    return `${dep.day}–${ret.day} ${MONTH_ABBR[dep.month]}`;
  }
  return `${dep.day} ${MONTH_ABBR[dep.month]} – ${ret.day} ${MONTH_ABBR[ret.month]}`;
}
