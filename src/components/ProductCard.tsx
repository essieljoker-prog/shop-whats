import { Link } from "react-router";
import { MessageCircle } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { waLink, waProductMessage } from "@/lib/whatsapp";
import { useSettings } from "@/hooks/useSettings";
import { ImageView } from "./ImageView";
import { useSitePreferences } from "@/providers/site-preferences";

export type CardProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  oldPrice: number | null;
  currency: string;
  availability: "disponible" | "indisponible" | "bientot";
  condition: "neuf" | "occasion";
  storage: string | null;
  batteryHealth: number | null;
  images?: { imageKey: string; isPrimary: boolean }[];
  brand?: { name: string } | null;
};

export function ProductCard({ product }: { product: CardProduct }) {
  const { s } = useSettings();
  const { language, t } = useSitePreferences();
  const locale = language === "en" ? "en-US" : "fr-FR";
  const orderable = product.availability === "disponible";
  const primary =
    product.images?.find((i) => i.isPrimary)?.imageKey ?? product.images?.[0]?.imageKey ?? null;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border bg-card text-card-foreground">
      <Link
        to={`/produit/${product.slug}`}
        className="block"
        aria-label={`${t("Voir")} ${product.name}`}
      >
        <div className="relative aspect-[4/5]">
          <ImageView
            imageKey={primary}
            alt={product.name}
            className="h-full w-full"
            imgClassName="transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {product.condition === "occasion" && (
            <span className="absolute left-2.5 top-2.5 rounded-full bg-brand-blue-700 px-2.5 py-1 text-[11px] font-medium text-white">
              {product.batteryHealth ? `${t("Batterie")} ${product.batteryHealth} %` : t("Occasion")}
            </span>
          )}
          {product.oldPrice && product.oldPrice > product.price && (
            <span className="absolute right-2.5 top-2.5 rounded-full bg-brand-green-800 px-2.5 py-1 text-[11px] font-semibold text-white">
              {t("Promo")}
            </span>
          )}
          {!orderable && (
            <span className="absolute inset-x-0 bottom-0 bg-brand-blue-700/80 py-1.5 text-center text-[11px] font-medium uppercase tracking-wide text-white">
              {t(product.availability === "bientot" ? "Bientôt disponible" : "Indisponible")}
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-1 p-3.5">
        <Link to={`/produit/${product.slug}`} className="min-w-0">
          <h3 className="truncate text-[15px] font-semibold leading-snug">{product.name}</h3>
          <p className="mt-0.5 truncate text-[13px] text-muted-foreground">
            {[product.brand?.name, product.storage].filter(Boolean).join(" · ")}
          </p>
        </Link>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1.5">
          <div className="min-w-0">
            {product.oldPrice && product.oldPrice > product.price && (
              <p className="text-[12px] text-muted-foreground line-through">
                {formatPrice(product.oldPrice, product.currency, locale)}
              </p>
            )}
            <p className="font-display text-[17px] font-bold leading-tight text-brand-blue-700">
              {formatPrice(product.price, product.currency, locale)}
            </p>
          </div>
          {orderable && (
            <a
              href={waLink(s, waProductMessage(product, language))}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t("Commander")} ${product.name} ${t("sur WhatsApp")}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-whatsapp transition-colors hover:bg-whatsapp hover:text-white"
            >
              <MessageCircle className="h-[18px] w-[18px]" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
