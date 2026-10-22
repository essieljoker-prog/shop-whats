import { trpc } from "@/providers/trpc";
import { formatOpeningHours } from "@/lib/opening-hours";

/** Réglages publics de la boutique (devise, WhatsApp, adresse…). */
export function useSettings() {
  const query = trpc.catalog.settings.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });
  const s = query.data ?? {};
  return {
    ...query,
    s: {
      shopName: s.shop_name || "Manaaf",
      currency: s.currency || "FCFA",
      whatsapp: s.whatsapp || "2290151217271",
      phone: s.phone || "+229 01 51 21 72 71",
      phone2: s.phone2 || "",
      address: s.address || "",
      hours: formatOpeningHours(s.hours),
      tiktok: s.tiktok || "",
      instagram: s.instagram || "",
      facebook: s.facebook || "",
    } as Record<string, string>,
  };
}
