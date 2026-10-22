import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { X, Search } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { formatPrice } from "@/lib/format";
import { ImageView } from "./ImageView";
import { useSitePreferences } from "@/providers/site-preferences";

/** Recherche plein écran, résultats instantanés (pensée pour le pouce). */
export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useSitePreferences();

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (open) {
      const timeout = setTimeout(() => inputRef.current?.focus(), 60);
      return () => clearTimeout(timeout);
    }
  }, [open]);

  const close = useCallback(() => {
    setQ("");
    setDebounced("");
    onClose();
  }, [onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const results = trpc.catalog.products.useQuery(
    { q: debounced, limit: 12 },
    { enabled: open && debounced.length >= 2 },
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white" role="dialog" aria-label={t("Recherche")}>
      <div className="flex items-center gap-2 border-b hairline p-3">
        <Search className="ml-1 h-5 w-5 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="iPhone 13, Galaxy A15, écouteurs…"
          className="h-11 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground/70"
          aria-label={t("Rechercher un produit")}
        />
        <button
          onClick={close}
          aria-label={t("Fermer la recherche")}
          className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-mist"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {debounced.length < 2 ? (
          <p className="px-5 pt-8 text-[14px] text-muted-foreground">
            {t("Tapez le nom d'un téléphone, d'une marque ou d'un accessoire.")}
          </p>
        ) : results.data?.items.length === 0 ? (
          <p className="px-5 pt-8 text-[14px] text-muted-foreground">
            {t("Désolé, aucun résultat.")} {debounced}. {t("Aucun produit ne correspond. Essayez d'autres filtres ou écrivez-nous sur WhatsApp.")}
          </p>
        ) : (
          <ul className="divide-y divide-[hsl(222_27%_92%)]">
            {results.data?.items.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/produit/${p.slug}`}
                  onClick={close}
                  className="flex items-center gap-3.5 px-4 py-3 active:bg-mist"
                >
                  <ImageView
                    imageKey={p.images.find((i) => i.isPrimary)?.imageKey ?? p.images[0]?.imageKey}
                    alt={p.name}
                    className="h-14 w-12 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium">{p.name}</p>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {[p.brand?.name, p.storage, t(p.condition === "occasion" ? "Occasion" : "Neuf")]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <p className="font-display shrink-0 text-[15px] font-semibold text-brand-blue-700">
                    {formatPrice(p.price, p.currency)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
