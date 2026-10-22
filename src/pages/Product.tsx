import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { ArrowLeft, MessageCircle, Phone, Share2, Check } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useSettings } from "@/hooks/useSettings";
import { formatPrice, parseSpecs, AVAILABILITY } from "@/lib/format";
import { waLink, waProductMessage } from "@/lib/whatsapp";
import { ImageView } from "@/components/ImageView";
import { ProductCard } from "@/components/ProductCard";
import { useSitePreferences } from "@/providers/site-preferences";
import { updateSeoMetadata } from "@/lib/seo";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Product() {
  const { slug } = useParams<{ slug: string }>();
  const { s } = useSettings();
  const { language, t } = useSitePreferences();
  const locale = language === "en" ? "en-US" : "fr-FR";
  const { data, isLoading } = trpc.catalog.productBySlug.useQuery(
    { slug: slug! },
    { enabled: !!slug },
  );
  const [imgIndex, setImgIndex] = useState(0);
  const [shared, setShared] = useState(false);

  useEffect(() => {
    if (!data?.product) return;
    const product = data.product;
    updateSeoMetadata({
      title: `${product.name} — Manaaf`,
      description: product.description?.trim().slice(0, 300) ||
        `${product.name}${product.storage ? ` ${product.storage}` : ""} disponible chez Manaaf à Cotonou. Consultez le prix, l'état et la disponibilité.`,
      image: product.images[0]?.imageKey
        ? `/api/files/${encodeURIComponent(product.images[0].imageKey)}`
        : null,
      type: "product",
    });
  }, [data?.product, language]);

  if (isLoading) {
    return <div className="mx-auto max-w-6xl px-4 py-20 text-center text-muted-foreground">{t("Chargement…")}</div>;
  }
  if (!data?.product) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-center">
        <p className="text-[17px] font-medium">{t("Ce produit n'est plus en ligne.")}</p>
        <Link to="/boutique" className="link-underline mt-3 inline-block text-[15px] font-medium text-brand-blue-700">
          {t("Retour à la boutique")}
        </Link>
      </div>
    );
  }

  const p = data.product;
  const specs = parseSpecs(p.specifications);
  const avail = AVAILABILITY[p.availability];
  const orderable = p.availability === "disponible";
  const waMessage =
    p.availability === "bientot"
      ? language === "en"
        ? `Hello Manaaf, please notify me when ${p.name} is available.`
        : `Bonjour Manaaf, je souhaite être averti lorsque ${p.name} sera disponible.`
      : waProductMessage(p, language);
  const waUrl = waLink(s, waMessage);

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: `${p.name} — Manaaf`, url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setShared(true);
      setTimeout(() => setShared(false), 1500);
    }
  };

  return (
    <div className="brand-surface brand-surface-paper min-h-full">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-10">
      {/* Fil d'Ariane */}
      <div className="flex items-center justify-between">
        <Link to="/boutique" className="inline-flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground hover:text-brand-blue-700">
          <ArrowLeft className="h-4 w-4" />
          {t("Boutique")}
        </Link>
        <button onClick={share} className="inline-flex items-center gap-1.5 text-[14px] font-medium text-muted-foreground hover:text-brand-blue-700" aria-label={t("Partager ce produit")}>
          {shared ? <Check className="h-4 w-4 text-emerald-600" /> : <Share2 className="h-4 w-4" />}
          {shared ? t("Lien copié") : t("Partager")}
        </button>
      </div>

      <div className="mt-5 grid gap-8 md:grid-cols-2 md:gap-12">
        {/* Galerie */}
        <div>
          <div className="relative overflow-hidden rounded-2xl border bg-mist">
            <ImageView
              imageKey={p.images[imgIndex]?.imageKey}
              alt={p.images[imgIndex]?.alt || p.name}
              className="aspect-[4/5] w-full"
            />
            {p.oldPrice && p.oldPrice > p.price && (
              <span className="absolute left-3 top-3 rounded-full bg-brand-green-800 px-3 py-1 text-[12px] font-semibold text-white">
                Promo
              </span>
            )}
          </div>
          {p.images.length > 1 && (
            <div className="no-scrollbar mt-3 flex gap-2.5 overflow-x-auto">
              {p.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setImgIndex(i)}
                  aria-label={`${t("Photo")} ${i + 1} ${t("de")} ${p.name}`}
                  aria-current={i === imgIndex}
                  className={`shrink-0 overflow-hidden rounded-xl border-2 ${i === imgIndex ? "border-brand-blue-700" : "border-transparent"}`}
                >
                  <ImageView imageKey={img.imageKey} alt="" className="h-16 w-14" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informations */}
        <div>
          <p className="text-[13px] font-medium uppercase tracking-wide text-muted-foreground">
            {[p.brand?.name, p.category?.name].filter(Boolean).join(" · ")}
          </p>
          <h1 className="font-display mt-1.5 text-[26px] font-bold leading-tight tracking-tight md:text-[34px]">
            {p.name}
          </h1>
          <p className="mt-2 text-[15px] text-muted-foreground">
            {[p.storage, p.color, t(p.condition === "occasion" ? "Occasion" : "Neuf")].filter(Boolean).join(" · ")}
          </p>

          <div className="mt-5 flex items-baseline gap-3">
            <p className="font-display text-[30px] font-bold tracking-tight text-brand-blue-700">
              {formatPrice(p.price, p.currency, locale)}
            </p>
            {p.oldPrice && p.oldPrice > p.price && (
              <p className="text-[17px] text-muted-foreground line-through">
                {formatPrice(p.oldPrice, p.currency, locale)}
              </p>
            )}
          </div>

          <p className={`mt-2.5 flex items-center gap-2 text-[14px] font-medium ${avail.text}`}>
            <span className={`h-2 w-2 rounded-full ${avail.dot}`} aria-hidden />
            {t(p.availability === "disponible" ? "Disponible en boutique" : avail.label)}
          </p>

          {/* Bloc confiance occasion */}
          {p.condition === "occasion" && (
            <div className="mt-6 rounded-2xl border bg-mist p-4.5 p-5">
              <h2 className="font-display text-[15px] font-semibold">{t("Occasion contrôlée")}</h2>
              <ul className="mt-2.5 space-y-1.5 text-[14px] text-muted-foreground">
                {p.batteryHealth != null && <li>{t("Batterie")} : {p.batteryHealth} % {t("de capacité")}</li>}
                <li>{t("Contrôle en boutique avant mise en vente")}</li>
                {p.warranty && <li>{p.warranty}</li>}
              </ul>
            </div>
          )}
          {p.condition === "neuf" && p.warranty && (
            <p className="mt-6 rounded-2xl border bg-mist p-4 text-[14px] text-muted-foreground">
              {p.warranty}
            </p>
          )}

          {/* CTA */}
          {orderable ? (
            <div className="mt-7 flex flex-col gap-3">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[54px] items-center justify-center gap-2.5 rounded-full bg-whatsapp text-[16px] font-semibold text-white transition-opacity hover:opacity-90"
              >
                <MessageCircle className="h-5 w-5" />
                {t("Commander sur WhatsApp")}
              </a>
              <a
                href={`tel:${s.phone?.replace(/\s/g, "")}`}
                className="inline-flex h-[54px] items-center justify-center gap-2.5 rounded-full border border-brand-blue-700/20 text-[16px] font-semibold transition-colors hover:bg-mist"
              >
                <Phone className="h-5 w-5" />
                {t("Appeler la boutique")}
              </a>
            </div>
          ) : p.availability === "bientot" ? (
            <div className="mt-7">
              <p className="rounded-2xl border bg-mist p-4 text-[14px] text-muted-foreground">
                {t("Ce produit n'est pas encore disponible à la vente.")}{" "}
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="link-underline font-medium text-brand-blue-700">
                  {t("Être averti sur WhatsApp")}
                </a>
                .
              </p>
            </div>
          ) : (
            <div className="mt-7">
              <p className="rounded-2xl border bg-mist p-4 text-[14px] text-muted-foreground">
                {t("Ce produit n'est plus disponible.")}{" "}
                <a href={waUrl} target="_blank" rel="noopener noreferrer" className="link-underline font-medium text-brand-blue-700">
                  {t("Demandez-nous un modèle équivalent")}
                </a>
                .
              </p>
            </div>
          )}

          {/* Détails */}
          <div className="mt-8">
            <Accordion type="multiple" defaultValue={["specs"]}>
              {p.description && (
                <AccordionItem value="desc" className="border-b hairline">
                  <AccordionTrigger className="py-4 text-[15px] font-semibold hover:no-underline">{t("Description")}</AccordionTrigger>
                  <AccordionContent className="whitespace-pre-line text-[14px] leading-relaxed text-muted-foreground">
                    {p.description}
                  </AccordionContent>
                </AccordionItem>
              )}
              {specs.length > 0 && (
                <AccordionItem value="specs" className="border-b hairline">
                  <AccordionTrigger className="py-4 text-[15px] font-semibold hover:no-underline">{t("Caractéristiques")}</AccordionTrigger>
                  <AccordionContent>
                    <dl className="divide-y divide-[hsl(222_27%_92%)]">
                      {specs.map((sp, i) => (
                        <div key={i} className="flex justify-between gap-4 py-2.5 text-[14px]">
                          <dt className="text-muted-foreground">{sp.key}</dt>
                          <dd className="text-right font-medium">{sp.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </AccordionContent>
                </AccordionItem>
              )}
              <AccordionItem value="livraison" className="border-b hairline">
                <AccordionTrigger className="py-4 text-[15px] font-semibold hover:no-underline">{t("Livraison & retrait")}</AccordionTrigger>
                <AccordionContent className="text-[14px] leading-relaxed text-muted-foreground">
                  {t("Retrait en boutique à Saint-Michel, Cotonou, ou livraison sur Cotonou et environs. Les détails et frais exacts se confirment sur WhatsApp au moment de la commande. Paiement à la remise du produit.")}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>

      {/* Produits liés */}
      {data.related.length > 0 && (
        <section className="mt-14 md:mt-20" aria-label={t("Liste des produits similaires")}>
          <h2 className="font-display text-[20px] font-bold tracking-tight md:text-[24px]">
            {t("Dans la même catégorie")}
          </h2>
          <div className="mt-5 grid grid-cols-2 gap-3.5 md:grid-cols-4 md:gap-5">
            {data.related.map((r) => (
              <ProductCard key={r.id} product={r} />
            ))}
          </div>
        </section>
      )}

      {/* Barre CTA fixe mobile */}
      {orderable && (
        <div className="fixed inset-x-0 bottom-[64px] z-30 border-t hairline bg-white/95 p-3 backdrop-blur md:hidden">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[50px] items-center justify-center gap-2 rounded-full bg-whatsapp text-[15px] font-semibold text-white"
          >
            <MessageCircle className="h-5 w-5" />
            {t("Commander")} — {formatPrice(p.price, p.currency, locale)}
          </a>
        </div>
      )}
    </div>
    </div>
  );
}
