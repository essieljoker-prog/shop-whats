import { useEffect, useState } from "react";
import { Link } from "react-router";
import { MessageCircle, ArrowLeft, ArrowRight, MapPin, Clock, Phone } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useSettings } from "@/hooks/useSettings";
import { waLink, waGeneralMessage } from "@/lib/whatsapp";
import { ProductCard } from "@/components/ProductCard";
import { ImageView } from "@/components/ImageView";
import { Reveal } from "@/components/Reveal";
import { Faq } from "@/components/Faq";
import { useSitePreferences } from "@/providers/site-preferences";

const CATEGORY_IMAGE_HISTORY_KEY = "homepage-category-images";

function readCategoryImageHistory(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const value: unknown = JSON.parse(window.sessionStorage.getItem(CATEGORY_IMAGE_HISTORY_KEY) ?? "{}");
  if (typeof value !== "object" || value === null || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([key, imageKey]) => /^\d+$/.test(key) && typeof imageKey === "string"),
  );
}

function rememberCategoryImage(categoryId: number, imageKey: string) {
  window.sessionStorage.setItem(
    CATEGORY_IMAGE_HISTORY_KEY,
    JSON.stringify({ ...readCategoryImageHistory(), [categoryId]: imageKey }),
  );
}

export default function Home() {
  const { s } = useSettings();
  const { language, t } = useSitePreferences();
  const { data } = trpc.catalog.home.useQuery();
  const [previousCategoryImages] = useState(readCategoryImageHistory);
  const { data: cats } = trpc.catalog.categories.useQuery(
    { previousImages: previousCategoryImages },
    { refetchOnMount: "always" },
  );
  const { data: brands } = trpc.catalog.brands.useQuery();
  const { data: testimonials } = trpc.catalog.testimonials.useQuery();
  const promotions = data?.promotions ?? [];
  const [promotionIndex, setPromotionIndex] = useState(0);
  const vedette = promotions.length
    ? promotions[promotionIndex % promotions.length]
    : data?.featured[0];

  useEffect(() => {
    if (
      promotions.length < 2 ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) return;
    const timer = window.setInterval(() => {
      setPromotionIndex((current) => (current + 1) % promotions.length);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [promotions.length]);

  return (
    <>
      {/* ---------- HERO ---------- */}
      <section className="brand-surface brand-surface-deep text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 pb-14 pt-12 md:grid-cols-2 md:items-center md:px-6 md:pb-20 md:pt-20">
          <Reveal>
            <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-brand-green">
              {t("Saint-Michel · Cotonou")}
            </p>
            <h1 className="font-display mt-4 text-[34px] font-bold leading-[1.08] tracking-tight md:text-[52px]">
              {t("Téléphones neufs & occasion, garantis.")}
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/70 md:text-[17px]">
              {t("iPhone, Samsung, Tecno, Infinix, Xiaomi, Google Pixel — contrôlés avant la vente, garantis, et livrés. Commandez en un message.")}
            </p>
            <p className="mt-3 text-[14px] font-medium text-white/85">
              {t("Votre confiance, notre priorité")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/boutique"
                className="navy-cta inline-flex h-[52px] items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-brand-blue-700 transition-colors hover:bg-mist"
              >
                {t("Voir la boutique")}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={waLink(s, waGeneralMessage(language))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[52px] items-center gap-2 rounded-full border border-white/30 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </div>
          </Reveal>

          {/* Produit vedette — données réelles du catalogue */}
          {vedette && (
            <Reveal delay={120} className="md:justify-self-end">
              <div className="w-full max-w-[340px] md:ml-auto">
                <div key={vedette.id} className="promo-product-enter">
                  <ProductCard product={vedette} />
                </div>
                {promotions.length > 1 && (
                  <div className="mt-3 flex items-center justify-center gap-3" aria-label={t("Produits en promotion")}>
                    <button
                      type="button"
                      aria-label={t("Promotion précédente")}
                      onClick={() => setPromotionIndex((current) => (current - 1 + promotions.length) % promotions.length)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label={t("Promotion suivante")}
                      onClick={() => setPromotionIndex((current) => (current + 1) % promotions.length)}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ---------- CATÉGORIES ---------- */}
      <section className="brand-surface brand-surface-sky border-b hairline" aria-label={t("Catégories")}>
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[22px] font-bold tracking-tight md:text-[28px]">
              {t("Parcourir")}
            </h2>
            <Link to="/boutique" className="link-underline text-[14px] font-medium text-muted-foreground">
              {t("Tout voir")}
            </Link>
          </div>
          <div className="mx-auto mt-6 flex max-w-6xl flex-wrap justify-center gap-3.5 md:gap-5">
            {cats?.map((c, i) => (
              <Reveal
                key={c.id}
                delay={i * 50}
                className="h-full w-[calc((100%-0.875rem)/2)] min-w-0 max-w-[360px] sm:w-[calc((100%-2.5rem)/3)]"
              >
                <Link
                  to={`/boutique?categorie=${c.slug}`}
                  className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-brand-blue-700/40"
                >
                  <span className="font-display px-3.5 pt-3.5 text-[15px] font-semibold sm:text-[16px]">{t(c.name)}</span>
                  <ImageView
                    imageKey={c.imageKey}
                    alt={`${t(c.name)} — ${t("catégorie")}`}
                    fit="contain"
                    className="mt-3 aspect-[4/3] w-full flex-none min-h-0 transition-transform duration-300 group-hover:scale-[1.02]"
                    onImageLoad={(imageKey) => rememberCategoryImage(c.id, imageKey)}
                  />
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {brands && brands.length > 0 && (
        <section className="brand-surface brand-surface-leaf border-b hairline" aria-label={t("Marques disponibles")}>
          <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-12">
            <h2 className="font-display text-[20px] font-bold tracking-tight md:text-[24px]">
              {t("Nos marques")}
            </h2>
            <div className="brand-marquee mt-5" aria-label={t("Défilement des marques")}>
              <div className="brand-marquee-track">
                <div className="brand-marquee-group">
                  {brands.map((brand) => (
                    <Link
                      key={brand.id}
                      to={`/boutique?marque=${brand.id}`}
                      className="brand-marquee-chip"
                    >
                      {brand.name}
                    </Link>
                  ))}
                </div>
                <div className="brand-marquee-group" aria-hidden="true">
                  {brands.map((brand) => (
                    <span key={brand.id} className="brand-marquee-chip">
                      {brand.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {testimonials && testimonials.length > 0 && (
        <section className="brand-surface brand-surface-sky border-b hairline" aria-labelledby="testimonials-title">
          <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
            <h2 id="testimonials-title" className="font-display text-[22px] font-bold tracking-tight md:text-[28px]">
              {t("Ils nous font confiance")}
            </h2>
            <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-muted-foreground">
              {t("Découvrez les retours de nos clients après leurs achats chez Manaaf, en boutique ou via WhatsApp.")}
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial) => (
                <article key={testimonial.id} className="rounded-2xl border bg-card p-5 shadow-xs">
                  <blockquote className="text-[15px] leading-relaxed">
                    “{testimonial.content}”
                  </blockquote>
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-2 border-t hairline pt-4 text-[13px]">
                    <span className="font-semibold">{testimonial.displayName}</span>
                    <span className="rounded-full bg-mist px-3 py-1 text-muted-foreground">
                      {t(testimonial.source === "boutique" ? "Achat en boutique" : "Commande via WhatsApp")}
                    </span>
                  </div>
                  {testimonial.dateLabel && (
                    <p className="mt-2 text-[12px] text-muted-foreground">{testimonial.dateLabel}</p>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ---------- À LA UNE ---------- */}
      <section className="brand-surface brand-surface-paper" aria-label={t("Produits à la une")}>
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <div className="flex items-baseline justify-between">
            <h2 className="font-display text-[22px] font-bold tracking-tight md:text-[28px]">
              {t("À la une")}
            </h2>
            <Link to="/boutique" className="link-underline text-[14px] font-medium text-muted-foreground">
              {t("Toute la boutique")}
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3.5 md:grid-cols-4 md:gap-5">
            {(data?.featured.length ? data.featured : data?.latest)?.slice(0, 8).map((p, i) => (
              <Reveal key={p.id} delay={(i % 4) * 60}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- OCCASION ---------- */}
      <section className="brand-surface brand-surface-deep-leaf text-white" aria-label={t("Téléphones d'occasion")}>
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 md:grid-cols-2 md:px-6 md:py-20">
          <Reveal>
            <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-brand-green">
              {t("Occasion")}
            </p>
            <h2 className="font-display mt-3 text-[24px] font-bold leading-tight tracking-tight md:text-[34px]">
              {t("Des occasions contrôlées, pas des surprises.")}
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/70">
              {t("Chaque téléphone d'occasion passe un contrôle en boutique avant sa mise en vente. Le diagnostic vous est présenté avant l'achat — et la batterie est affichée sur chaque fiche.")}
            </p>
            <ul className="mt-6 grid max-w-md grid-cols-2 gap-x-6 gap-y-2.5 text-[14px] text-white/85">
              {["Batterie", "Écran", "Caméras", "Charge", "Réseau & SIM", "Haut-parleurs"].map((c) => (
                <li key={c} className="flex items-center gap-2.5">
                  <span className="h-1 w-4 rounded-full bg-brand-green" aria-hidden />
                  {t(c)}
                </li>
              ))}
            </ul>
            <Link
              to="/occasion"
              className="navy-cta mt-8 inline-flex h-[52px] items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-brand-blue-700 transition-colors hover:bg-mist"
            >
              {t("Voir les occasions")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
          <div className="grid grid-cols-2 content-start gap-3.5">
            {data?.occasions.slice(0, 4).map((p, i) => (
              <Reveal key={p.id} delay={i * 60}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- SERVICES ---------- */}
      <section className="brand-surface brand-surface-sky" aria-label={t("Services")}>
        <div className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-16">
          <h2 className="font-display text-[22px] font-bold tracking-tight md:text-[28px]">
            {t("Services de la boutique")}
          </h2>
          <div className="mt-6 divide-y divide-[hsl(222_27%_92%)] border-y hairline md:grid md:grid-cols-2 md:divide-y-0">
            {[
              { t: "Réparation", d: "Diagnostic et réparation en boutique — écran, batterie, connectique, logiciel." },
              { t: "Garantie", d: "Chaque téléphone repart avec une garantie. La durée est indiquée sur la fiche produit." },
              { t: "Livraison", d: "Livraison disponible sur Cotonou et environs. Les détails se confirment sur WhatsApp." },
              { t: "Reprise / échange", d: "Votre ancien téléphone peut être repris : apportez-le en boutique pour une estimation." },
            ].map((sv, i) => (
              <Reveal key={sv.t} delay={i * 50}>
                <div className="flex items-start gap-4 py-5 md:px-6 md:first:pl-0">
                  <span className="font-display mt-0.5 text-[13px] font-semibold text-brand-green">
                    0{i + 1}
                  </span>
                  <div>
                    <h3 className="font-display text-[17px] font-semibold">{t(sv.t)}</h3>
                    <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{t(sv.d)}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ---------- LA BOUTIQUE ---------- */}
      <section className="brand-surface brand-surface-leaf" aria-label={t("La boutique")}>
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 md:grid-cols-2 md:items-center md:px-6 md:py-20">
          <Reveal>
            <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-brand-green-800">
              {t("La boutique")}
            </p>
            <h2 className="font-display mt-3 text-[24px] font-bold tracking-tight md:text-[34px]">
              {t("Passez nous voir à Saint-Michel.")}
            </h2>
            <ul className="mt-6 space-y-4 text-[15px]">
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-green-800" />
                {s.address}
              </li>
              <li className="flex items-start gap-3">
                <Clock className="mt-0.5 h-5 w-5 shrink-0 text-brand-green-800" />
                {s.hours}
              </li>
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-brand-green-800" />
                <a href={`tel:${s.phone?.replace(/\s/g, "")}`} className="link-underline font-medium">
                  {s.phone}
                </a>
              </li>
            </ul>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Manaaf Saint-Michel Cotonou")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[52px] items-center rounded-full bg-brand-blue-700 px-6 text-[15px] font-semibold text-white transition-colors hover:bg-brand-blue-800"
              >
                {t("Ouvrir dans Maps")}
              </a>
              <a
                href={waLink(s, waGeneralMessage(language))}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-[52px] items-center gap-2 rounded-full border border-brand-blue-700/20 px-6 text-[15px] font-semibold transition-colors hover:bg-white"
              >
                <MessageCircle className="h-4 w-4 text-whatsapp" />
                WhatsApp
              </a>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Manaaf Saint-Michel Cotonou")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-2xl border hairline"
              aria-label={t("Voir la boutique sur Google Maps")}
            >
              <iframe
                title={t("Carte — Manaaf, Saint-Michel, Cotonou")}
                src={`https://www.google.com/maps?q=${encodeURIComponent("Saint-Michel, Cotonou, Bénin")}&output=embed`}
                className="pointer-events-none h-[300px] w-full md:h-[360px]"
                loading="lazy"
              />
            </a>
          </Reveal>
        </div>
      </section>

      {/* ---------- TIKTOK ---------- */}
      {s.tiktok && (
        <section className="brand-surface brand-surface-paper" aria-label="TikTok">
          <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
            <Reveal>
              <a
                href={s.tiktok}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between gap-4 rounded-2xl border p-5 transition-colors hover:border-brand-blue-700/30 md:p-6"
              >
                <div>
                  <h2 className="font-display text-[17px] font-semibold md:text-[19px]">
                    {t("Les nouveaux arrivages sur TikTok")}
                  </h2>
                  <p className="mt-1 text-[14px] text-muted-foreground">
                    {t("@smg.plug1 — vidéos des produits avant tout le monde.")}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 shrink-0 text-brand-green-800" />
              </a>
            </Reveal>
          </div>
        </section>
      )}

      {/* ---------- FAQ ---------- */}
      <section className="brand-surface brand-surface-sky" aria-label={t("Questions fréquentes")}>
        <div className="mx-auto max-w-3xl px-4 py-12 md:py-16">
          <h2 className="font-display text-[22px] font-bold tracking-tight md:text-[28px]">
            {t("Questions fréquentes")}
          </h2>
          <div className="mt-6">
            <Faq />
          </div>
          <p className="mt-6 text-[14px] text-muted-foreground">
            {t("Une autre question ?")}{" "}
            <Link to="/contact" className="link-underline font-medium text-brand-blue-700">
              {t("Contactez-nous")}
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
