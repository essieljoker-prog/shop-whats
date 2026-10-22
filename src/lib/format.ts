/** Formatage des prix : 475 000 FCFA */
export function formatPrice(price: number, currency = "FCFA", locale = "fr-FR"): string {
  const n = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(price);
  return `${n} ${currency}`;
}

export type Spec = { key: string; value: string };

export function parseSpecs(json: string | null | undefined): Spec[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr)
      ? arr.filter((s) => s && typeof s.key === "string" && typeof s.value === "string")
      : [];
  } catch {
    return [];
  }
}

export const AVAILABILITY = {
  disponible: { label: "Disponible", dot: "bg-emerald-500", text: "text-emerald-700" },
  indisponible: { label: "Indisponible", dot: "bg-neutral-400", text: "text-neutral-500" },
  bientot: { label: "Bientôt disponible", dot: "bg-brand-green", text: "text-brand-green-800" },
} as const;
