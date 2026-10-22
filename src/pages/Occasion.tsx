import { MessageCircle } from "lucide-react";
import { trpc } from "@/providers/trpc";
import { useSettings } from "@/hooks/useSettings";
import { waLink } from "@/lib/whatsapp";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { useSitePreferences } from "@/providers/site-preferences";

export default function Occasion() {
  const { s } = useSettings();
  const { language, t } = useSitePreferences();
  const { data } = trpc.catalog.products.useQuery({
    condition: "occasion",
    sort: "price_asc",
    limit: 60,
  });

  return (
    <div>
      <section className="brand-surface brand-surface-deep text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 md:px-6 md:py-20">
          <Reveal>
            <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-brand-green">
              {t("Occasion")}
            </p>
            <h1 className="font-display mt-3 max-w-xl text-[28px] font-bold leading-tight tracking-tight md:text-[40px]">
              {t("Un téléphone d'occasion, sans mauvaise surprise.")}
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-white/70 md:text-[16px]">
              {t("Chaque occasion est contrôlée en boutique avant sa mise en vente : batterie, écran, caméras, charge, réseau. Le diagnostic vous est présenté avant l'achat, et la garantie est indiquée sur chaque fiche.")}
            </p>
            <a
              href={waLink(s, language === "en"
                ? "Hello Manaaf, I am looking for a pre-owned phone. Could you advise me?"
                : "Bonjour Manaaf, je cherche un téléphone d'occasion. Pouvez-vous me conseiller ?")}
              target="_blank"
              rel="noopener noreferrer"
              className="navy-cta mt-7 inline-flex h-[52px] items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-brand-blue-700 transition-colors hover:bg-mist"
            >
              <MessageCircle className="h-4 w-4 text-whatsapp" />
              {t("Être conseillé sur WhatsApp")}
            </a>
          </Reveal>
        </div>
      </section>

      <section className="brand-surface brand-surface-leaf" aria-label={t("Téléphones d'occasion")}>
        <div className="mx-auto max-w-6xl px-4 py-10 md:px-6 md:py-14">
        <p className="text-[13px] text-muted-foreground" aria-live="polite">
          {data
            ? `${data.total} ${t(data.total === 1 ? "occasion" : "occasions")} ${t("— triées par prix")}`
            : t("Chargement…")}
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3.5 md:grid-cols-4 md:gap-5">
          {data?.items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {data?.items.length === 0 && (
          <p className="py-16 text-center text-[15px] text-muted-foreground">
            {t("Aucune occasion en ligne pour le moment — les arrivages sont fréquents, écrivez-nous pour être prévenu.")}
          </p>
        )}
        </div>
      </section>
    </div>
  );
}
