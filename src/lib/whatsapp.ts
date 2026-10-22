import { formatPrice } from "./format";

type SettingsMap = Record<string, string>;

/** Construit un lien WhatsApp wa.me avec message contextualisé. */
export function waLink(settings: SettingsMap, message: string): string {
  const number = (settings.whatsapp || "2290151217271").replace(/[^0-9]/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export function waProductMessage(product: {
  name: string;
  storage?: string | null;
  price: number;
  currency?: string;
}, language: "fr" | "en" = "fr"): string {
  const variant = product.storage ? ` ${product.storage}` : "";
  const price = formatPrice(product.price, product.currency ?? "FCFA", language === "en" ? "en-US" : "fr-FR");
  if (language === "en") {
    return `Hello Manaaf, I am interested in the ${product.name}${variant}, listed at ${price}. Is it still available?`;
  }
  return `Bonjour Manaaf, je suis intéressé par ${product.name}${variant} affiché à ${price}. Est-il toujours disponible ?`;
}

export function waGeneralMessage(language: "fr" | "en" = "fr"): string {
  return language === "en"
    ? "Hello Manaaf, I would like some information about your phones."
    : "Bonjour Manaaf, j'aimerais avoir des informations sur vos téléphones.";
}
