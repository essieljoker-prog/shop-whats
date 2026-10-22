import { Link } from "react-router";
import { X } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useSitePreferences } from "@/providers/site-preferences";

/** Panneau coulissant des catégories (dynamiques, depuis la base). */
export function CategoriesSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data } = trpc.catalog.categories.useQuery(undefined, { enabled: open });
  const { t } = useSitePreferences();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-label={t("Catégories")}>
      <button
        aria-label={t("Fermer")}
        className="absolute inset-0 bg-brand-blue-700/40"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-3xl bg-white pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <div className="sticky top-0 flex items-center justify-between border-b hairline bg-white px-5 py-4">
          <h2 className="font-display text-[17px] font-semibold">{t("Catégories")}</h2>
          <button
            onClick={onClose}
            aria-label={t("Fermer les catégories")}
            className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-mist"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <ul>
          <li>
            <Link
              to="/boutique"
              onClick={onClose}
              className="flex items-center justify-between px-5 py-3.5 text-[15px] font-medium active:bg-mist"
            >
              {t("Tout le catalogue")}
            </Link>
          </li>
          {data?.map((c) => (
            <li key={c.id}>
              <Link
                to={`/boutique?categorie=${c.slug}`}
                onClick={onClose}
                className="flex items-center justify-between px-5 py-3.5 text-[15px] active:bg-mist"
              >
                {t(c.name)}
                <span className="text-[13px] text-muted-foreground">{c.productCount}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
