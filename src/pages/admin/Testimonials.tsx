import { useState } from "react";
import { Plus, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type TestimonialStatus = "draft" | "pending" | "published" | "archived";
type TestimonialSource = "boutique" | "whatsapp";
type TestimonialForm = {
  id?: number;
  displayName: string;
  content: string;
  source: TestimonialSource;
  dateLabel: string;
  status: TestimonialStatus;
  publicationConsent: boolean;
};

const STATUS_LABELS: Record<TestimonialStatus, string> = {
  draft: "Brouillon",
  pending: "En attente",
  published: "Publié",
  archived: "Archivé",
};

function fromTestimonial(item: {
  id: number;
  displayName: string;
  content: string;
  source: TestimonialSource;
  dateLabel: string | null;
  status: TestimonialStatus;
  publicationConsent: boolean;
}): TestimonialForm {
  return {
    id: item.id,
    displayName: item.displayName,
    content: item.content,
    source: item.source,
    dateLabel: item.dateLabel ?? "",
    status: item.status,
    publicationConsent: item.publicationConsent,
  };
}

export default function AdminTestimonials() {
  const utils = trpc.useUtils();
  const { data, isLoading, error } = trpc.admin.testimonials.useQuery();
  const [editing, setEditing] = useState<TestimonialForm | null>(null);

  const save = trpc.admin.saveTestimonial.useMutation({
    onSuccess: () => {
      void utils.admin.testimonials.invalidate();
      void utils.catalog.testimonials.invalidate();
      setEditing(null);
      toast.success("Témoignage enregistré.");
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  const updateApprovedText = (patch: Partial<TestimonialForm>) => {
    setEditing((current) => {
      if (!current) return current;
      const changedApprovedContent =
        (patch.displayName !== undefined && patch.displayName !== current.displayName) ||
        (patch.content !== undefined && patch.content !== current.content) ||
        (patch.source !== undefined && patch.source !== current.source);
      return {
        ...current,
        ...patch,
        ...(changedApprovedContent
          ? {
              publicationConsent: false,
              status: current.status === "published" ? "pending" : current.status,
            }
          : {}),
      };
    });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[22px] font-bold">Témoignages</h1>
          <p className="mt-1 text-[14px] text-muted-foreground">
            Publiez uniquement des retours authentiques dont le texte et le nom d’affichage ont été autorisés.
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            setEditing({
              displayName: "",
              content: "",
              source: "boutique",
              dateLabel: "",
              status: "draft",
              publicationConsent: false,
            })
          }
          className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-blue-700 px-5 text-[14px] font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Ajouter
        </button>
      </div>

      {error && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-[14px] text-red-700">{error.message}</p>}
      {isLoading && <p className="mt-5 text-[14px] text-muted-foreground">Chargement des témoignages…</p>}
      {!isLoading && !error && data?.length === 0 && (
        <p className="mt-5 rounded-2xl border bg-white p-5 text-[14px] text-muted-foreground">
          Aucun témoignage pour le moment. La section publique restera masquée jusqu’à la publication d’un témoignage autorisé.
        </p>
      )}

      {!!data?.length && (
        <ul className="mt-5 overflow-hidden rounded-2xl border bg-white divide-y">
          {data.map((item) => (
            <li key={item.id} className="flex flex-wrap items-start gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">{item.displayName}</p>
                  <span className="rounded-full bg-mist px-2.5 py-1 text-[12px]">{STATUS_LABELS[item.status]}</span>
                  {!item.publicationConsent && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[12px] text-amber-800">
                      Autorisation non confirmée
                    </span>
                  )}
                </div>
                <p className="mt-2 line-clamp-3 text-[14px] text-muted-foreground">{item.content}</p>
                <p className="mt-2 text-[12px] text-muted-foreground">
                  {item.source === "boutique" ? "Achat en boutique" : "Commande via WhatsApp"}
                  {item.dateLabel ? ` · ${item.dateLabel}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(fromTestimonial(item))}
                aria-label={`Modifier le témoignage de ${item.displayName}`}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border hover:bg-mist"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <Dialog open onOpenChange={(open) => { if (!open) setEditing(null); }}>
          <DialogContent showCloseButton={false} className="max-h-[92vh] max-w-xl overflow-y-auto rounded-3xl bg-white p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-[18px] font-semibold">
                {editing.id ? "Modifier le témoignage" : "Nouveau témoignage"}
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Fermer"
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-mist"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <label className="mt-5 block text-[13px] font-medium">
              Nom d’affichage autorisé *
              <input
                value={editing.displayName}
                maxLength={80}
                onChange={(event) => updateApprovedText({ displayName: event.target.value })}
                className="mt-1.5 h-11 w-full rounded-xl border px-3.5 text-[14px]"
              />
            </label>

            <label className="mt-4 block text-[13px] font-medium">
              Texte exact du témoignage *
              <textarea
                value={editing.content}
                maxLength={1500}
                rows={5}
                onChange={(event) => updateApprovedText({ content: event.target.value })}
                className="mt-1.5 w-full resize-y rounded-xl border p-3.5 text-[14px]"
              />
            </label>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-[13px] font-medium">
                Provenance
                <select
                  value={editing.source}
                onChange={(event) =>
                  updateApprovedText({ source: event.target.value === "whatsapp" ? "whatsapp" : "boutique" })
                }
                  className="mt-1.5 h-11 w-full rounded-xl border bg-white px-3"
                >
                  <option value="boutique">Achat en boutique</option>
                  <option value="whatsapp">Commande via WhatsApp</option>
                </select>
              </label>
              <label className="block text-[13px] font-medium">
                Date ou période (facultatif)
                <input
                  value={editing.dateLabel}
                  maxLength={40}
                  placeholder="Ex. octobre 2026"
                  onChange={(event) => setEditing({ ...editing, dateLabel: event.target.value })}
                  className="mt-1.5 h-11 w-full rounded-xl border px-3"
                />
              </label>
            </div>

            <label className="mt-4 block text-[13px] font-medium">
              Statut
              <select
                value={editing.status}
                onChange={(event) => {
                  const status = (["draft", "pending", "published", "archived"] as const).find(
                    (candidate) => candidate === event.target.value,
                  );
                  if (status) setEditing({ ...editing, status });
                }}
                className="mt-1.5 h-11 w-full rounded-xl border bg-white px-3"
              >
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>

            <label className="mt-4 flex items-start gap-3 rounded-xl border p-3.5 text-[13px] leading-relaxed">
              <input
                type="checkbox"
                checked={editing.publicationConsent}
                onChange={(event) => setEditing({ ...editing, publicationConsent: event.target.checked })}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[#17658E]"
              />
              <span>
                J’ai confirmé l’autorisation explicite de publier ce texte exact et ce nom d’affichage. Après toute modification du texte ou du nom, cette confirmation doit être renouvelée. La preuve de l’accord doit être conservée séparément.
              </span>
            </label>

            {editing.status === "published" && !editing.publicationConsent && (
              <p role="alert" className="mt-3 text-[13px] text-red-700">
                Confirmez l’autorisation avant de publier ce témoignage.
              </p>
            )}

            <button
              type="button"
              onClick={() =>
                save.mutate({
                  id: editing.id,
                  displayName: editing.displayName,
                  content: editing.content,
                  source: editing.source,
                  dateLabel: editing.dateLabel || null,
                  status: editing.status,
                  publicationConsent: editing.publicationConsent,
                })
              }
              disabled={
                save.isPending ||
                editing.displayName.trim().length === 0 ||
                editing.content.trim().length < 10 ||
                (editing.status === "published" && !editing.publicationConsent)
              }
              className="mt-5 h-12 w-full rounded-full bg-brand-blue-700 text-[15px] font-semibold text-white disabled:opacity-50"
            >
              {save.isPending ? "Enregistrement…" : "Enregistrer"}
            </button>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
