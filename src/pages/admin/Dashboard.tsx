import { Link } from "react-router";
import { Plus, Package, CheckCircle2, XCircle, FolderOpen } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { formatPrice } from "@/lib/format";

export default function Dashboard() {
  const { data } = trpc.admin.dashboard.useQuery();

  const cards = [
    { label: "Produits", value: data?.total, icon: Package },
    { label: "Disponibles", value: data?.disponibles, icon: CheckCircle2 },
    { label: "Indisponibles", value: data?.indisponibles, icon: XCircle },
    { label: "Catégories", value: data?.categories, icon: FolderOpen },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[22px] font-bold">Tableau de bord</h1>
        <Link
          to="/admin/produits/nouveau"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-blue-700 px-5 text-[14px] font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Ajouter un produit
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border bg-white p-4">
            <c.icon className="h-5 w-5 text-brand-green-800" />
            <p className="font-display mt-3 text-[26px] font-bold">{c.value ?? "—"}</p>
            <p className="text-[13px] text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="font-display text-[16px] font-semibold">Derniers ajoutés</h2>
          <ul className="mt-3 divide-y divide-[hsl(222_27%_92%)]">
            {data?.recent.map((p) => (
              <li key={p.id}>
                <Link to={`/admin/produits/${p.id}`} className="flex items-center justify-between py-2.5 text-[14px] hover:text-brand-blue-700">
                  <span className="truncate font-medium">{p.name}</span>
                  <span className="ml-3 shrink-0 text-muted-foreground">{formatPrice(p.price, p.currency)}</span>
                </Link>
              </li>
            ))}
            {data?.recent.length === 0 && (
              <li className="py-4 text-[14px] text-muted-foreground">Aucun produit pour l'instant.</li>
            )}
          </ul>
        </section>
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="font-display text-[16px] font-semibold">Récemment modifiés</h2>
          <ul className="mt-3 divide-y divide-[hsl(222_27%_92%)]">
            {data?.updated.map((p) => (
              <li key={p.id}>
                <Link to={`/admin/produits/${p.id}`} className="flex items-center justify-between py-2.5 text-[14px] hover:text-brand-blue-700">
                  <span className="truncate font-medium">{p.name}</span>
                  <span className="ml-3 shrink-0 text-muted-foreground">{formatPrice(p.price, p.currency)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
