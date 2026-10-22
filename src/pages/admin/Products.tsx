import { useState } from "react";
import { Link } from "react-router";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { formatPrice } from "@/lib/format";
import { ImageView } from "@/components/ImageView";

type ProductStatus = "all" | "disponible" | "indisponible" | "bientot" | "inactive";

function isProductStatus(value: string): value is ProductStatus {
  return ["all", "disponible", "indisponible", "bientot", "inactive"].includes(value);
}

export default function AdminProducts() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<ProductStatus>("all");
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.admin.products.useQuery({ q: q || undefined, status });
  const setAvail = trpc.admin.setAvailability.useMutation({
    onSuccess: (_result, input) => {
      utils.admin.products.invalidate();
      utils.catalog.products.invalidate();
      toast.success(
        input.availability === "disponible"
          ? "Produit marqué comme disponible."
          : input.availability === "bientot"
            ? "Disponibilité du produit mise à jour."
            : "Produit marqué comme indisponible.",
      );
    },
    onError: (error) => toast.error(error.message),
  });
  const del = trpc.admin.deleteProduct.useMutation({
    onSuccess: () => {
      utils.admin.products.invalidate();
      utils.admin.dashboard.invalidate();
      utils.catalog.products.invalidate();
      toast.success("Produit supprimé.");
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-[22px] font-bold">Produits</h1>
        <Link
          to="/admin/produits/nouveau"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-blue-700 px-5 text-[14px] font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </Link>
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher…"
          aria-label="Rechercher un produit"
          className="h-11 flex-1 rounded-full border bg-white px-4 text-[14px] outline-none focus:border-brand-blue-700/40"
        />
        <select
          value={status}
          onChange={(e) => {
            if (isProductStatus(e.target.value)) setStatus(e.target.value);
          }}
          aria-label="Filtrer par statut"
          className="h-11 rounded-full border bg-white px-4 text-[14px] outline-none"
        >
          <option value="all">Tous les statuts</option>
          <option value="disponible">Disponibles</option>
          <option value="indisponible">Indisponibles</option>
          <option value="bientot">Bientôt</option>
          <option value="inactive">Désactivés</option>
        </select>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border bg-white">
        {isLoading ? (
          <p className="p-6 text-[14px] text-muted-foreground">Chargement…</p>
        ) : data?.length === 0 ? (
          <p className="p-6 text-[14px] text-muted-foreground">Aucun produit.</p>
        ) : (
          <ul className="divide-y divide-[hsl(222_27%_92%)]">
            {data?.map((p) => {
              
              return (
                <li key={p.id} className="flex items-center gap-3.5 p-3.5">
                  <ImageView
                    imageKey={p.images.find((i) => i.isPrimary)?.imageKey ?? p.images[0]?.imageKey}
                    alt={p.name}
                    className="h-14 w-12 shrink-0 rounded-lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14.5px] font-semibold">
                      {p.name}
                      {!p.active && (
                        <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          désactivé
                        </span>
                      )}
                    </p>
                    <p className="truncate text-[13px] text-muted-foreground">
                      {[p.category?.name, formatPrice(p.price, p.currency)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      setAvail.mutate({
                        id: p.id,
                        availability: p.availability === "disponible" ? "indisponible" : "disponible",
                      })
                    }
                    title={p.availability === "disponible" ? "Marquer indisponible" : "Marquer disponible"}
                    aria-label={p.availability === "disponible" ? "Marquer indisponible" : "Marquer disponible"}
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      p.availability === "disponible" ? "text-emerald-600" : "text-muted-foreground"
                    }`}
                  >
                    {p.availability === "disponible" ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <Link
                    to={`/admin/produits/${p.id}`}
                    aria-label={`Modifier ${p.name}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors hover:bg-mist"
                  >
                    <Pencil className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm(`Supprimer « ${p.name} » définitivement ?`)) del.mutate({ id: p.id });
                    }}
                    aria-label={`Supprimer ${p.name}`}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-red-600 transition-colors hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
