import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import { ArrowLeft, Star, Trash2, ArrowUp, ArrowDown, ImagePlus, Plus, X } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { formatPrice, parseSpecs, type Spec } from "@/lib/format";
import { ImageView } from "@/components/ImageView";
import { toast } from "sonner";
import { persistUploadedImage } from "@/lib/persist-uploaded-image";

type FormState = {
  name: string;
  description: string;
  brandId: number | null;
  categoryId: number | null;
  price: number;
  oldPrice: number | null;
  currency: string;
  availability: "disponible" | "indisponible" | "bientot";
  condition: "neuf" | "occasion";
  storage: string;
  color: string;
  batteryHealth: number | null;
  warranty: string;
  featured: boolean;
  active: boolean;
};

type ProductAvailability = FormState["availability"];
type ProductCondition = FormState["condition"];

const EMPTY: FormState = {
  name: "",
  description: "",
  brandId: null,
  categoryId: null,
  price: 0,
  oldPrice: null,
  currency: "FCFA",
  availability: "disponible",
  condition: "neuf",
  storage: "",
  color: "",
  batteryHealth: null,
  warranty: "",
  featured: false,
  active: true,
};

const STORAGE_OPTIONS = [
  "16 Go",
  "32 Go",
  "64 Go",
  "128 Go",
  "256 Go",
  "512 Go",
  "1 To",
  "2 To",
] as const;

const SUPPORTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
] as const;

function isSupportedImageType(
  type: string,
): type is (typeof SUPPORTED_IMAGE_TYPES)[number] {
  return SUPPORTED_IMAGE_TYPES.some((supportedType) => supportedType === type);
}

function isProductAvailability(value: string): value is ProductAvailability {
  return ["disponible", "indisponible", "bientot"].includes(value);
}

function isProductCondition(value: string): value is ProductCondition {
  return ["neuf", "occasion"].includes(value);
}

export default function ProductEdit() {
  const { id } = useParams<{ id: string }>();
  const routeProductId = id ? Number(id) : null;
  const navigate = useNavigate();
  const utils = trpc.useUtils();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [specs, setSpecs] = useState<Spec[]>([]);
  const [loadedProductId, setLoadedProductId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [createdProductId, setCreatedProductId] = useState<number | null>(null);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const productId = routeProductId ?? createdProductId;
  const isNew = productId === null;

  const removePreview = (idx: number) => {
    setPreviewUrls((prev) => {
      const url = prev[idx];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== idx);
    });
    setNewFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  // Cleanup any object URLs when the component unmounts or previews change
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const existing = trpc.admin.product.useQuery(
    { id: productId! },
    { enabled: !!productId },
  );
  const { data: cats } = trpc.admin.categories.useQuery();
  const { data: brands } = trpc.admin.brands.useQuery();

  if (existing.data && loadedProductId !== existing.data.id) {
    const p = existing.data;
    setForm({
      name: p.name,
      description: p.description ?? "",
      brandId: p.brandId,
      categoryId: p.categoryId,
      price: p.price,
      oldPrice: p.oldPrice,
      currency: p.currency,
      availability: p.availability,
      condition: p.condition,
      storage: p.storage ?? "",
      color: p.color ?? "",
      batteryHealth: p.batteryHealth,
      warranty: p.warranty ?? "",
      featured: p.featured,
      active: p.active,
    });
    setSpecs(parseSpecs(p.specifications));
    setLoadedProductId(p.id);
  }

  const invalidate = () => {
    utils.admin.products.invalidate();
    utils.admin.dashboard.invalidate();
    utils.catalog.products.invalidate();
    if (productId) utils.admin.product.invalidate({ id: productId });
  };

  const create = trpc.admin.createProduct.useMutation({
    onSuccess: invalidate,
    onError: (e) => setError(e.message),
  });
  const update = trpc.admin.updateProduct.useMutation({
    onSuccess: () => {
      invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    },
    onError: (e) => setError(e.message),
  });

  const upload = trpc.storage.upload.useMutation();
  const removeUpload = trpc.storage.remove.useMutation();
  const addImages = trpc.admin.addImages.useMutation({ onSuccess: invalidate });
  const reorder = trpc.admin.reorderImages.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success("Ordre des photos mis à jour.");
    },
    onError: (error) => toast.error(error.message),
  });
  const setPrimary = trpc.admin.setPrimaryImage.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success("Photo principale mise à jour.");
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteImage = trpc.admin.deleteImage.useMutation({
    onSuccess: () => {
      invalidate();
      toast.success("Photo supprimée.");
    },
    onError: (error) => toast.error(error.message),
  });

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const storageIsRelevant = (categoryId: number | null) => {
    const category = cats?.find((item) => item.id === categoryId);
    return !category?.slug.toLowerCase().startsWith("accessoire");
  };

  const showPreview = () => {
    setError("");
    if (form.name.trim().length < 2) return setError("Le nom est obligatoire.");
    if (form.price <= 0) return setError("Le prix doit être supérieur à 0.");
    setPreviewing(true);
  };

  const submit = async () => {
    setError("");
    if (form.name.trim().length < 2) return setError("Le nom est obligatoire.");
    if (form.price <= 0) return setError("Le prix doit être supérieur à 0.");
    const payload = {
      name: form.name.trim(),
      description: form.description || null,
      brandId: form.brandId,
      categoryId: form.categoryId,
      price: form.price,
      oldPrice: form.oldPrice,
      currency: form.currency,
      availability: form.availability,
      condition: form.condition,
      storage: storageIsRelevant(form.categoryId) ? form.storage || null : null,
      color: form.color || null,
      batteryHealth: form.condition === "occasion" ? form.batteryHealth : null,
      warranty: form.warranty || null,
      specifications: specs.filter((s) => s.key.trim() && s.value.trim()),
      featured: form.featured,
      active: form.active,
    };
    try {
      let pid = productId;
      const creatingProduct = isNew;
      const hasNewPhotos = newFiles.length > 0;
      if (isNew) {
        const res = await create.mutateAsync(payload);
        pid = res.id;
        setCreatedProductId(res.id);
      } else {
        await update.mutateAsync({ id: productId, data: payload });
      }
      // Upload new files after we have a product id
      if (newFiles.length > 0 && pid) {
        for (let i = 0; i < newFiles.length; i++) {
          const file = newFiles[i];
          const base64 = await new Promise<string>((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve((r.result as string).split(",")[1]);
            r.onerror = reject;
            r.readAsDataURL(file);
          });
          const res = await upload.mutateAsync({
            name: `produits/${pid}/${file.name}`,
            contentBase64: base64,
            contentType: isSupportedImageType(file.type) ? file.type : undefined,
          });
          await persistUploadedImage(
            res,
            async (key) => addImages.mutateAsync({ productId: pid, keys: [key] }),
            async (key) => removeUpload.mutateAsync({ key }),
          );
        }
        // clear previews after successful upload
        setNewFiles([]);
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        setPreviewUrls([]);
      }
      if (creatingProduct && pid) {
        toast.success("Produit ajouté avec succès.");
        navigate(`/admin/produits/${pid}`, { replace: true });
      } else {
        toast.success(
          hasNewPhotos
            ? "Produit modifié et photos ajoutées."
            : "Modifications du produit enregistrées.",
        );
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Erreur lors de l'enregistrement.";
      setError(message);
      toast.error(message);
    }
  };

  const onFiles = (files: FileList | null) => {
    if (!files) return;
    setError("");
    const selected = Array.from(files);
    const addedFiles: File[] = [];
    const addedPreviews: string[] = [];
    for (const file of selected) {
      if (file.size > 8 * 1024 * 1024) {
        setError(`« ${file.name} » dépasse 8 Mo.`);
        continue;
      }
      const url = URL.createObjectURL(file);
      addedFiles.push(file);
      addedPreviews.push(url);
      // Limit total to 12 files
      if (addedFiles.length + newFiles.length >= 12) break;
    }
    setNewFiles((prev) => [...prev, ...addedFiles].slice(0, 12));
    setPreviewUrls((prev) => [...prev, ...addedPreviews].slice(0, 12));
  };

  const images = existing.data?.images ?? [];

  const move = (index: number, dir: -1 | 1) => {
    const ids = images.map((i) => i.id);
    const j = index + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    reorder.mutate({ productId: productId!, orderedIds: ids });
  };

  if (isNew && previewing) {
    const categoryName = cats?.find((category) => category.id === form.categoryId)?.name;
    const brandName = brands?.find((brand) => brand.id === form.brandId)?.name;

    return (
      <div className="mx-auto max-w-3xl">
        <Link to="/admin/produits" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground hover:text-brand-blue-700">
          <ArrowLeft className="h-4 w-4" />
          Produits
        </Link>
        <h1 className="font-display mt-3 text-[22px] font-bold">Aperçu du produit</h1>
        <p className="mt-1 text-[14px] text-muted-foreground">
          Vérifiez les informations avant l’enregistrement. Vous pourrez encore les modifier.
        </p>

        <Section title="Aperçu">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_1.2fr]">
            <div className="grid grid-cols-2 gap-2">
              {previewUrls.length ? previewUrls.map((url, index) => (
                <div key={url} className="image-stage flex aspect-square items-center justify-center overflow-hidden rounded-xl">
                  <img src={url} alt={`${form.name} — photo ${index + 1}`} className="h-full w-full object-contain" />
                </div>
              )) : (
                <div className="col-span-2 flex aspect-[4/3] items-center justify-center rounded-xl bg-mist text-[13px] text-muted-foreground">
                  Aucune photo ajoutée
                </div>
              )}
            </div>
            <div>
              <p className="font-display text-xl font-bold">{form.name}</p>
              <p className="mt-2 text-lg font-semibold">{formatPrice(form.price, form.currency)}</p>
              {form.oldPrice && <p className="text-[13px] text-muted-foreground line-through">{formatPrice(form.oldPrice, form.currency)}</p>}
              <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
                {categoryName && <><dt className="text-muted-foreground">Catégorie</dt><dd>{categoryName}</dd></>}
                {brandName && <><dt className="text-muted-foreground">Marque</dt><dd>{brandName}</dd></>}
                <dt className="text-muted-foreground">État</dt><dd>{form.condition === "neuf" ? "Neuf" : "Occasion"}</dd>
                <dt className="text-muted-foreground">Disponibilité</dt>
                <dd>{form.availability === "disponible" ? "Disponible" : form.availability === "bientot" ? "Bientôt disponible" : "Indisponible"}</dd>
                {storageIsRelevant(form.categoryId) && form.storage && <><dt className="text-muted-foreground">Stockage</dt><dd>{form.storage}</dd></>}
                {form.color && <><dt className="text-muted-foreground">Couleur</dt><dd>{form.color}</dd></>}
                {form.condition === "occasion" && form.batteryHealth !== null && <><dt className="text-muted-foreground">Batterie</dt><dd>{form.batteryHealth} %</dd></>}
                {form.warranty && <><dt className="text-muted-foreground">Garantie</dt><dd>{form.warranty}</dd></>}
              </dl>
            </div>
          </div>
          {form.description && <p className="mt-5 whitespace-pre-wrap border-t pt-4 text-[14px]">{form.description}</p>}
          {specs.some((item) => item.key.trim() && item.value.trim()) && (
            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 border-t pt-4 text-[13px]">
              {specs.filter((item) => item.key.trim() && item.value.trim()).map((item, index) => (
                <div key={`${item.key}-${index}`} className="contents">
                  <dt className="text-muted-foreground">{item.key}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </Section>

        {error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700">{error}</p>}
        <div className="mt-6 flex gap-3 pb-10">
          <button onClick={() => setPreviewing(false)} className="h-[52px] flex-1 rounded-full border text-[15px] font-semibold md:flex-none md:px-8">
            Modifier
          </button>
          <button
            onClick={submit}
            disabled={create.isPending || update.isPending || upload.isPending}
            className="h-[52px] flex-1 rounded-full bg-brand-blue-700 text-[15px] font-semibold text-white disabled:opacity-60 md:flex-none md:px-10"
          >
            {create.isPending || update.isPending || upload.isPending ? "Enregistrement…" : "Enregistrer le produit"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <Link to="/admin/produits" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground hover:text-brand-blue-700">
          <ArrowLeft className="h-4 w-4" />
          Produits
        </Link>
        {saved && <span className="text-[13px] font-medium text-emerald-600">Enregistré</span>}
      </div>
      <h1 className="font-display mt-3 text-[22px] font-bold">
        {isNew ? "Nouveau produit" : `Modifier — ${existing.data?.name ?? ""}`}
      </h1>

      {/* Infos de base */}
      <Section title="Informations">
        <Field label="Nom du produit *">
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="iPhone 15 Pro" className={inputCls} />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Catégorie">
            <select
              value={form.categoryId ?? ""}
              onChange={(e) => {
                const categoryId = e.target.value ? Number(e.target.value) : null;
                setForm((current) => ({
                  ...current,
                  categoryId,
                  storage: storageIsRelevant(categoryId) ? current.storage : "",
                }));
              }}
              className={inputCls}
            >
              <option value="">Choisir une catégorie…</option>
              {cats?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {(!cats || cats.length === 0) && (
              <span className="mt-1 block text-[12px] font-normal text-muted-foreground">
                Aucune catégorie enregistrée. Ajoutez-en dans la page Catégories de l’administration.
              </span>
            )}
          </Field>
          <Field label="Marque">
            <select value={form.brandId ?? ""} onChange={(e) => set("brandId", e.target.value ? Number(e.target.value) : null)} className={inputCls}>
              <option value="">Choisir une marque…</option>
              {brands?.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {(!brands || brands.length === 0) && (
              <span className="mt-1 block text-[12px] font-normal text-muted-foreground">
                Aucune marque enregistrée. Ajoutez-en dans la page Marques de l’administration.
              </span>
            )}
          </Field>
        </div>
        <Field label="Description">
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={4} className={inputCls} />
        </Field>
      </Section>

      {/* Prix */}
      <Section title="Prix">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Prix actuel (FCFA) *">
            <input type="number" min={0} value={form.price || ""} onChange={(e) => set("price", Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Ancien prix (promo)">
            <input type="number" min={0} value={form.oldPrice ?? ""} onChange={(e) => set("oldPrice", e.target.value ? Number(e.target.value) : null)} className={inputCls} />
          </Field>
          <Field label="Devise">
            <input value={form.currency} onChange={(e) => set("currency", e.target.value)} className={inputCls} />
          </Field>
        </div>
      </Section>

      {/* État & détails */}
      <Section title="État et détails">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Disponibilité">
            <select
              value={form.availability}
              onChange={(e) => {
                if (isProductAvailability(e.target.value)) set("availability", e.target.value);
              }}
              className={inputCls}
            >
              <option value="disponible">Disponible</option>
              <option value="indisponible">Indisponible</option>
              <option value="bientot">Bientôt disponible</option>
            </select>
          </Field>
          <Field label="État">
            <select
              value={form.condition}
              onChange={(e) => {
                if (isProductCondition(e.target.value)) set("condition", e.target.value);
              }}
              className={inputCls}
            >
              <option value="neuf">Neuf</option>
              <option value="occasion">Occasion</option>
            </select>
          </Field>
          {form.condition === "occasion" && (
            <Field label="Batterie (%)">
              <input type="number" min={0} max={100} value={form.batteryHealth ?? ""} onChange={(e) => set("batteryHealth", e.target.value ? Number(e.target.value) : null)} className={inputCls} />
            </Field>
          )}
          {storageIsRelevant(form.categoryId) && (
            <Field label="Stockage">
              <select value={form.storage} onChange={(e) => set("storage", e.target.value)} className={inputCls}>
                <option value="">Choisir un stockage…</option>
                {form.storage && !STORAGE_OPTIONS.includes(form.storage as (typeof STORAGE_OPTIONS)[number]) && (
                  <option value={form.storage}>{form.storage}</option>
                )}
                {STORAGE_OPTIONS.map((storage) => (
                  <option key={storage} value={storage}>{storage}</option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Couleur">
            <input value={form.color} onChange={(e) => set("color", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Garantie">
            <input value={form.warranty} onChange={(e) => set("warranty", e.target.value)} placeholder="Garantie boutique 3 mois" className={inputCls} />
          </Field>
        </div>
        <div className="mt-4 flex flex-wrap gap-6">
          <label className="flex items-center gap-2.5 text-[14px] font-medium">
            <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} className="h-4 w-4 accent-[#06162d]" />
            À la une (accueil)
          </label>
          <label className="flex items-center gap-2.5 text-[14px] font-medium">
            <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="h-4 w-4 accent-[#06162d]" />
            Visible sur le site
          </label>
        </div>
      </Section>

      {/* Caractéristiques */}
      <Section title="Caractéristiques">
        {specs.map((sp, i) => (
          <div key={i} className="mt-2.5 flex gap-2">
            <input value={sp.key} onChange={(e) => setSpecs(specs.map((x, j) => (j === i ? { ...x, key: e.target.value } : x)))} placeholder="Écran" aria-label="Caractéristique" className={inputCls} />
            <input value={sp.value} onChange={(e) => setSpecs(specs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))} placeholder="6,1 pouces OLED" aria-label="Valeur" className={inputCls} />
            <button onClick={() => setSpecs(specs.filter((_, j) => j !== i))} aria-label="Supprimer" className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border text-muted-foreground hover:bg-mist">
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          onClick={() => setSpecs([...specs, { key: "", value: "" }])}
          className="mt-3 inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[13px] font-medium hover:bg-mist"
        >
          <Plus className="h-4 w-4" />
          Ajouter une caractéristique
        </button>
      </Section>

      {/* Images (produit existant ou nouveau) */}
        <Section title="Photos">
          <div className="grid grid-cols-3 gap-3 md:grid-cols-4">
            {/* New image previews */}
            {previewUrls.map((url, i) => (
              <div key={`preview-${i}`} className="image-stage relative aspect-[4/5] overflow-hidden rounded-xl border-2 border-dashed">
                <img src={url} alt={form.name} className="h-full w-full object-contain" />
                <div className="absolute inset-x-1.5 bottom-1.5 flex justify-center gap-1">
                  <IconBtn label="Supprimer la prévisualisation" danger onClick={() => removePreview(i)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconBtn>
                </div>
              </div>
            ))}
            {/* Existing images (only when editing) */}
            {!isNew && images.map((img, i) => (
              <div key={img.id} className={`relative overflow-hidden rounded-xl border-2 ${img.isPrimary ? "border-brand-green" : "border-transparent"}`}>
                <ImageView imageKey={img.imageKey} alt={img.alt || form.name} className="aspect-[4/5] w-full" />
                {img.isPrimary && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-brand-green-800 p-1 text-white" title="Image principale">
                    <Star className="h-3 w-3" />
                  </span>
                )}
                <div className="absolute inset-x-1.5 bottom-1.5 flex justify-center gap-1">
                  <IconBtn label="Monter" onClick={() => move(i, -1)}><ArrowUp className="h-3.5 w-3.5" /></IconBtn>
                  <IconBtn label="Descendre" onClick={() => move(i, 1)}><ArrowDown className="h-3.5 w-3.5" /></IconBtn>
                  {!img.isPrimary && (
                    <IconBtn label="Définir principale" onClick={() => setPrimary.mutate({ productId: productId!, imageId: img.id })}>
                      <Star className="h-3.5 w-3.5" />
                    </IconBtn>
                  )}
                  <IconBtn label="Supprimer" danger onClick={() => confirm("Supprimer cette photo ?") && deleteImage.mutate({ imageId: img.id })}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </IconBtn>
                </div>
              </div>
            ))}
            <button
              onClick={() => fileRef.current?.click()}
              className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed text-[13px] font-medium text-muted-foreground transition-colors hover:border-brand-blue-700/40 hover:text-brand-blue-700"
            >
              <ImagePlus className="h-6 w-6" />
              {upload.isPending ? "Envoi…" : "Ajouter"}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { onFiles(e.target.files); e.target.value = ""; }} />
          <p className="mt-2.5 text-[12.5px] text-muted-foreground">
            La première photo (étoile) est l'image principale affichée partout.
          </p>
        </Section>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-[14px] text-red-700">{error}</p>
      )}

      <div className="mt-6 flex gap-3 pb-10">
        <button
          onClick={isNew ? showPreview : submit}
          disabled={create.isPending || update.isPending}
          className="h-[52px] flex-1 rounded-full bg-brand-blue-700 text-[15px] font-semibold text-white transition-colors hover:bg-brand-blue-800 disabled:opacity-60 md:flex-none md:px-10"
        >
          {create.isPending || update.isPending ? "Enregistrement…" : isNew ? "Aperçu avant enregistrement" : "Enregistrer"}
        </button>
        <Link to="/admin/produits" className="inline-flex h-[52px] items-center rounded-full border px-6 text-[15px] font-medium">
          Annuler
        </Link>
      </div>
    </div>
  );
}

const inputCls =
  "mt-1.5 h-12 w-full rounded-xl border bg-white px-4 text-[15px] outline-none focus:border-brand-blue-700/40";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-5 rounded-2xl border bg-white p-5">
      <h2 className="font-display text-[16px] font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[13px] font-medium">
      {label}
      {children}
    </label>
  );
}

function IconBtn({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex h-7 w-7 items-center justify-center rounded-full bg-white/95 shadow-sm transition-colors ${
        danger ? "text-red-600 hover:bg-red-50" : "text-brand-blue-700 hover:bg-mist"
      }`}
    >
      {children}
    </button>
  );
}
