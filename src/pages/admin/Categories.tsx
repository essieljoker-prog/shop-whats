import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";

export default function AdminCategories() {
  const utils = trpc.useUtils();
  const { data } = trpc.admin.categories.useQuery();
  const [editing, setEditing] = useState<{ id?: number; name: string; description: string; active: boolean } | null>(null);
  const [error, setError] = useState("");

  const save = trpc.admin.saveCategory.useMutation({
    onSuccess: (_result, input) => {
      utils.admin.categories.invalidate();
      utils.catalog.categories.invalidate();
      setEditing(null);
      toast.success(input.id ? "Catégorie modifiée." : "Catégorie ajoutée.");
    },
    onError: (e) => {
      setError(e.message);
      toast.error(e.message);
    },
  });
  const del = trpc.admin.deleteCategory.useMutation({
    onSuccess: () => {
      utils.admin.categories.invalidate();
      utils.catalog.categories.invalidate();
      toast.success("Catégorie supprimée.");
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[22px] font-bold">Catégories</h1>
        <button
          onClick={() => setEditing({ name: "", description: "", active: true })}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-blue-700 px-5 text-[14px] font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Nouvelle
        </button>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border bg-white">
        <ul className="divide-y divide-[hsl(222_27%_92%)]">
          {data?.map((c) => (
            <li key={c.id} className="flex items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="text-[14.5px] font-semibold">
                  {c.name}
                  {!c.active && (
                    <span className="ml-2 rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      masquée
                    </span>
                  )}
                </p>
                <p className="text-[13px] text-muted-foreground">
                  {c.productCount} produit{c.productCount > 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setEditing({ id: c.id, name: c.name, description: c.description ?? "", active: c.active })}
                aria-label={`Modifier ${c.name}`}
                className="flex h-10 w-10 items-center justify-center rounded-full border hover:bg-mist"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => confirm(`Supprimer la catégorie « ${c.name} » ?`) && del.mutate({ id: c.id })}
                aria-label={`Supprimer ${c.name}`}
                className="flex h-10 w-10 items-center justify-center rounded-full border text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center md:items-center" role="dialog" aria-label="Catégorie">
          <button className="absolute inset-0 bg-brand-blue-700/40" onClick={() => setEditing(null)} aria-label="Fermer" />
          <div className="relative w-full max-w-md rounded-t-3xl bg-white p-6 md:rounded-3xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[17px] font-semibold">
                {editing.id ? "Modifier la catégorie" : "Nouvelle catégorie"}
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
            <label className="mt-4 block text-[13px] font-medium">
              Description courte
              <input
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
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
            {error && <p role="alert" className="mt-3 text-[13px] text-red-600">{error}</p>}
            <button
              onClick={() => {
                setError("");
                save.mutate({
                  id: editing.id,
                  name: editing.name,
                  description: editing.description || null,
                  active: editing.active,
                });
              }}
              disabled={save.isPending || editing.name.trim().length < 2}
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
