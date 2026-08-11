import type {
  PackingCategory,
  PackingItem,
} from "../models/travel";

const PACKING_TEMPLATES: Array<{
  id: string;
  label: string;
  category: PackingCategory;
}> = [
  { id: "passport", label: "Passport", category: "documents" },
  {
    id: "id-visa",
    label: "ID, visa and travel documents",
    category: "documents",
  },
  {
    id: "tickets",
    label: "Tickets and reservations",
    category: "documents",
  },
  {
    id: "insurance",
    label: "Travel insurance",
    category: "documents",
  },
  {
    id: "wallet",
    label: "Wallet, cards and cash",
    category: "essentials",
  },
  { id: "keys", label: "House keys", category: "essentials" },
  {
    id: "weather-clothes",
    label: "Clothes for the weather",
    category: "clothing",
  },
  {
    id: "underwear",
    label: "Underwear and socks",
    category: "clothing",
  },
  {
    id: "shoes",
    label: "Comfortable shoes",
    category: "clothing",
  },
  { id: "medication", label: "Medication", category: "health" },
  { id: "toiletries", label: "Toiletries", category: "health" },
  {
    id: "phone-charger",
    label: "Phone and charger",
    category: "tech",
  },
  {
    id: "power-adapter",
    label: "Power bank and travel adapter",
    category: "tech",
  },
];

const PACKING_CATEGORIES = new Set<PackingCategory>([
  "documents",
  "essentials",
  "clothing",
  "health",
  "tech",
  "other",
]);

export function createDefaultPackingItems(tripId: string): PackingItem[] {
  return PACKING_TEMPLATES.map((template) => ({
    ...template,
    id: `packing-${tripId}-${template.id}`,
    isPacked: false,
    isDefault: true,
  }));
}

export function normalizePackingItems(
  value: unknown,
  tripId: string
): PackingItem[] {
  if (!Array.isArray(value)) return createDefaultPackingItems(tripId);

  return value.flatMap((candidate, index) => {
    if (!candidate || typeof candidate !== "object") return [];

    const item = candidate as Partial<PackingItem>;
    const label = typeof item.label === "string" ? item.label.trim() : "";
    if (!label) return [];

    return [
      {
        id:
          typeof item.id === "string" && item.id.trim()
            ? item.id
            : `packing-${tripId}-migrated-${index}`,
        label,
        category:
          item.category && PACKING_CATEGORIES.has(item.category)
            ? item.category
            : "other",
        isPacked: item.isPacked === true,
        isDefault: item.isDefault === true,
      },
    ];
  });
}
