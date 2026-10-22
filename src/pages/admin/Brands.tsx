import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";

export default function AdminBrands() {
  const utils = trpc.useUtils();
  const { data } = trpc.admin.brands.useQuery();
  const [editing, setEditing] = useState<{ id?: number; name: string; active: boolean } | null>(null);

  const save = trpc.admin.saveBrand.useMutation({
    onSuccess: (_result, input) => {
      utils.admin.brands.invalidate();
      utils.catalog.brands.invalidate();
      setEditing(null);
      toast.success(input.id ? "Marque modifiée." : "Marque ajoutée.");
    },
    onError: (e) => toast.error(e.message),
  });
  const del = trpc.admin.deleteBrand.useMutation({
    onSuccess: () => {
      utils.admin.brands.invalidate();
      utils.catalog.brands.invalidate();
      toast.success("Marque supprimée.");
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[22px] font-bold">Marques</h1>
        <button
          onClick={() => setEditing({ name: "", active: true })}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-blue-700 px-5 text-[14px] font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Nouvelle
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border bg-white">
        <ul className="divide-y divide-[hsl(222_27%_92%)]">
          {data?.map((b) => (
            <li key={b.id} className="flex items-center gap-3 p-4">
              <p className="flex-1 text-[14.5px] font-semibold">
                {b.name}
                {!b.active && (
                  <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    masquée
                  </span>
                )}
              </p>
              <button
                onClick={() => setEditing({ id: b.id, name: b.name, active: b.active })}
                aria-label={`Modifier ${b.name}`}
                className="flex h-10 w-10 items-center justify-center rounded-full border hover:bg-mist"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => confirm(`Supprimer la marque « ${b.name} » ?`) && del.mutate({ id: b.id })}
                aria-label={`Supprimer ${b.name}`}
                className="flex h-10 w-10 items-center justify-center rounded-full border text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-label="Marque">
          <button className="absolute inset-0 bg-brand-blue-700/40" onClick={() => setEditing(null)} aria-label="Fermer" />
          <div className="relative w-full max-w-md rounded-t-3xl bg-white p-6 md:rounded-3xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold">
                {editing.id ? "Modifier la marque" : "Nouvelle marque"}
              </h2>
              <button onClick={() => setEditing(null)} aria-label="Fermer" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-mist">
                <X className="h-5 w-5" />
              </button>
            </div>
            <label className="mt-4 block text-[13px] font-medium">
              Nom *
              <input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                className="mt-1.5 h-12 w-full rounded-xl border px-4 text-[15px] outline-none focus:border-brand-blue-700/40"
              />
            </label>
            <label className="mt-4 flex items-center gap-2.5 text-[14px] font-medium">
              <input
                type="checkbox"
                checked={editing.active}
                onChange={(e) => setEditing({ ...editing, active: e.target.checked })}
                className="h-4 w-4 accent-[#06162d]"
              />
              Visible sur le site
            </label>
            <button
              onClick={() =>
                save.mutate({ id: editing.id, name: editing.name, active: editing.active })
              }
              disabled={save.isPending || editing.name.trim().length < 1}
              className="mt-6 h-12 w-full rounded-full bg-brand-blue-700 text-[15px] font-semibold text-white disabled:opacity-60"
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
