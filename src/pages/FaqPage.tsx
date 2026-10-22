import { useEffect } from "react";
import { Link } from "react-router";
import { FAQ_ITEMS, Faq } from "@/components/Faq";
import { useSettings } from "@/hooks/useSettings";
import { useSitePreferences } from "@/providers/site-preferences";
import { updateSeoMetadata } from "@/lib/seo";

export default function FaqPage() {
  useSettings();
  const { language, t } = useSitePreferences();
  useEffect(() => {
    updateSeoMetadata({
      title: `${t("Questions fréquentes")} — Manaaf`,
      description: "Réponses sur les commandes, la livraison, le paiement et les garanties de Manaaf à Cotonou.",
    });
  }, [language, t]);

  return (
    <div className="brand-surface brand-surface-sky">
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        <h1 className="font-display text-[26px] font-bold tracking-tight md:text-[34px]">
          {t("Questions fréquentes")}
        </h1>
        <div className="mt-6">
          <Faq />
        </div>
        {/* Données structurées FAQ pour le SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: FAQ_ITEMS.map((i) => ({
                "@type": "Question",
                name: t(i.q),
                acceptedAnswer: { "@type": "Answer", text: t(i.a) },
              })),
            }),
          }}
        />
        <p className="mt-6 text-[14px] text-muted-foreground">
          {t("Une autre question ?")}{" "}
          <Link to="/contact" className="link-underline font-medium text-brand-blue-700">
            {t("Contactez-nous")}
          </Link>
        </p>
      </div>
    </div>
  );
}
