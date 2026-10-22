export const DEFAULT_CATEGORIES = [
  { name: "iPhone", position: 1 },
  { name: "Samsung", position: 2 },
  { name: "Tecno", position: 3 },
  { name: "Infinix", position: 4 },
  { name: "Xiaomi", position: 5 },
  { name: "Google Pixel", position: 6 },
  { name: "Occasion", position: 7 },
  { name: "Accessoires", position: 8 },
  { name: "Gaming & Gadgets", position: 9 },
] as const;

export const DEFAULT_BRANDS = [
  "Apple",
  "Samsung",
  "Tecno",
  "Infinix",
  "Xiaomi",
  "Google",
  "Sony",
  "JBL",
  "Anker",
] as const;

export function slugifyCatalogName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
