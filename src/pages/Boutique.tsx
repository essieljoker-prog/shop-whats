import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { SlidersHorizontal, ChevronDown, X } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { ProductCard } from "@/components/ProductCard";
import { useSitePreferences } from "@/providers/site-preferences";

type Sort = "recent" | "price_asc" | "price_desc" | "name";
const SORTS: { v: Sort; label: string }[] = [
  { v: "recent", label: "Récents" },
  { v: "price_asc", label: "Prix croissant" },
  { v: "price_desc", label: "Prix décroissant" },
  { v: "name", label: "Nom A–Z" },
];

export default function Boutique() {
  const { language, t } = useSitePreferences();
  const [params, setParams] = useSearchParams();
  const categorySlug = params.get("categorie") ?? undefined;
  const parsedBrandId = Number(params.get("marque"));
  const brandId = Number.isSafeInteger(parsedBrandId) && parsedBrandId > 0 ? parsedBrandId : undefined;
  const [q, setQ] = useState(params.get("q") ?? "");
  const [sort, setSort] = useState<Sort>("recent");
  const [condition, setCondition] = useState<"neuf" | "occasion" | undefined>();
  const [maxPrice, setMaxPrice] = useState<number | undefined>();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: cats } = trpc.catalog.categories.useQuery();
  const { data: brands } = trpc.catalog.brands.useQuery();

  const queryInput = useMemo(
    () => ({
      q: q.trim() || undefined,
      categorySlug,
      brandId,
      condition,
      maxPrice,
      sort,
      limit: 60,
    }),
    [q, categorySlug, brandId, condition, maxPrice, sort],
  );
  const { data, isLoading } = trpc.catalog.products.useQuery(queryInput);

  const setCategory = (slug?: string) => {
    const next = new URLSearchParams(params);
    if (slug) next.set("categorie", slug);
    else next.delete("categorie");
    setParams(next, { replace: true });
  };

  const setBrand = (id?: number) => {
    const next = new URLSearchParams(params);
    if (id) next.set("marque", String(id));
    else next.delete("marque");
    setParams(next, { replace: true });
  };

  const activeFilters = [brandId, condition, maxPrice].filter(Boolean).length;

  return (
    <div className="brand-surface brand-surface-sky min-h-full">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
      <h1 className="font-display text-[26px] font-bold tracking-tight md:text-[34px]">
        {t("Boutique")}
      </h1>

      {/* Recherche */}
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("Rechercher un téléphone, une marque…")}
        aria-label={t("Rechercher dans la boutique")}
        className="mt-5 h-12 w-full rounded-full border bg-white px-5 text-[15px] outline-none placeholder:text-muted-foreground/70 focus:border-brand-blue-700/40"
      />

      {/* Chips catégories */}
      <div className="no-scrollbar -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:px-0">
        <Chip active={!categorySlug} onClick={() => setCategory(undefined)}>
          {t("Tout")}
        </Chip>
        {cats?.map((c) => (
          <Chip
            key={c.id}
            active={categorySlug === c.slug}
            onClick={() => setCategory(c.slug)}
          >
            {t(c.name)}
          </Chip>
        ))}
        </div>

      {brands && brands.length > 0 && (
        <section className="mt-5" aria-label={t("Filtrer par marque")}>
          <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("Marques")}
          </h2>
          <div className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-1 md:flex-wrap">
            <Chip active={!brandId} onClick={() => setBrand(undefined)}>
              {t("Toutes les marques")}
            </Chip>
            {brands.map((brand) => (
              <Chip
                key={brand.id}
                active={brandId === brand.id}
                onClick={() => setBrand(brandId === brand.id ? undefined : brand.id)}
              >
                {brand.name}
              </Chip>
            ))}
          </div>
        </section>
      )}

      {/* Barre filtres + tri */}
      <div className="mt-5 flex items-center justify-between gap-3">
        <button
          onClick={() => setFiltersOpen(true)}
          aria-label={t("Filtres")}
          className="inline-flex h-11 items-center gap-2 rounded-full border px-4 text-[14px] font-medium transition-colors hover:bg-mist"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {t("Filtres")}
          {activeFilters > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-blue-700 text-[11px] font-semibold text-white">
              {activeFilters}
            </span>
          )}
        </button>
        <label className="relative inline-flex items-center">
          <span className="sr-only">{t("Trier")}</span>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-11 appearance-none rounded-full border bg-white pl-4 pr-9 text-[14px] font-medium outline-none"
          >
            {SORTS.map((s) => (
              <option key={s.v} value={s.v}>
                {t(s.label)}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3.5 h-4 w-4 text-muted-foreground" />
        </label>
      </div>

      {/* Résultats */}
      <p className="mt-5 text-[13px] text-muted-foreground" aria-live="polite">
        {isLoading
          ? t("Chargement…")
          : `${data?.total ?? 0} ${t((data?.total ?? 0) === 1 ? "produit" : "produits")}`}
      </p>
      <div className="mt-4 grid grid-cols-2 gap-3.5 md:grid-cols-4 md:gap-5">
        {data?.items.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
      {!isLoading && data?.items.length === 0 && (
        <p className="py-16 text-center text-[15px] text-muted-foreground">
          {t("Aucun produit ne correspond. Essayez d'autres filtres ou écrivez-nous sur WhatsApp.")}
        </p>
      )}

      {/* Panneau filtres (bas d'écran) */}
      {filtersOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-label={t("Filtres")}>
          <button className="absolute inset-0 bg-brand-blue-700/40" onClick={() => setFiltersOpen(false)} aria-label={t("Fermer")} />
          <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-5 pb-[calc(env(safe-area-inset-bottom)+20px)] md:inset-x-auto md:right-6 md:top-24 md:bottom-auto md:w-[380px] md:rounded-3xl md:border">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold">{t("Filtres")}</h2>
              <button onClick={() => setFiltersOpen(false)} aria-label={t("Fermer les filtres")} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-mist">
                <X className="h-5 w-5" />
              </button>
            </div>

            <h3 className="mt-5 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{t("Marque")}</h3>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {brands?.map((b) => (
                <Chip key={b.id} active={brandId === b.id} onClick={() => setBrand(brandId === b.id ? undefined : b.id)}>
                  {b.name}
                </Chip>
              ))}
            </div>

            <h3 className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{t("État")}</h3>
            <div className="mt-2.5 flex gap-2">
              <Chip active={condition === "neuf"} onClick={() => setCondition(condition === "neuf" ? undefined : "neuf")}>{t("Neuf")}</Chip>
              <Chip active={condition === "occasion"} onClick={() => setCondition(condition === "occasion" ? undefined : "occasion")}>{t("Occasion")}</Chip>
            </div>

            <h3 className="mt-6 text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">{t("Budget max")}</h3>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {[50000, 100000, 200000, 400000].map((p) => (
                <Chip key={p} active={maxPrice === p} onClick={() => setMaxPrice(maxPrice === p ? undefined : p)}>
                  ≤ {new Intl.NumberFormat(language === "en" ? "en-US" : "fr-FR").format(p)} FCFA
                </Chip>
              ))}
            </div>

            <div className="mt-7 flex gap-3">
              <button
                onClick={() => { setBrand(undefined); setCondition(undefined); setMaxPrice(undefined); }}
                className="h-12 flex-1 rounded-full border text-[14px] font-medium"
              >
                {t("Réinitialiser")}
              </button>
              <button
                onClick={() => setFiltersOpen(false)}
                className="h-12 flex-1 rounded-full bg-brand-blue-700 text-[14px] font-semibold text-white"
              >
                {t("Voir les résultats")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`h-10 shrink-0 rounded-full border px-4 text-[14px] font-medium transition-colors ${
        active ? "border-brand-blue-700 bg-brand-blue-700 text-white" : "bg-white hover:bg-mist"
      }`}
    >
      {children}
    </button>
  );
}
