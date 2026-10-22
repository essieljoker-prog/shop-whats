import { Link } from "react-router";
import { MessageCircle, ArrowRight } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { waLink } from "@/lib/whatsapp";
import { Reveal } from "@/components/Reveal";
import { useSitePreferences } from "@/providers/site-preferences";

const SERVICES = [
  {
    t: "Réparation",
    d: "Écran cassé, batterie fatiguée, connectique, problème logiciel : apportez votre téléphone en boutique pour un diagnostic. Le devis vous est communiqué avant toute intervention.",
  },
  {
    t: "Garantie",
    d: "Chaque téléphone vendu repart avec une garantie — constructeur pour les neufs, boutique pour les occasions. La durée exacte est indiquée sur chaque fiche produit.",
  },
  {
    t: "Livraison",
    d: "Livraison disponible sur Cotonou et les environs. Le délai et les frais se confirment sur WhatsApp au moment de la commande. Retrait en boutique possible.",
  },
  {
    t: "Reprise / échange",
    d: "Votre ancien téléphone a de la valeur : apportez-le en boutique pour une estimation, ou décrivez-le nous sur WhatsApp (modèle, état, batterie).",
  },
];

export default function Services() {
  const { s } = useSettings();
  const { language, t } = useSitePreferences();
  return (
    <div className="brand-surface brand-surface-sky min-h-full">
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <Reveal>
        <h1 className="font-display text-[26px] font-bold tracking-tight md:text-[34px]">
          {t("Services")}
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted-foreground">
          {t("Manaaf ne s'arrête pas à la vente. Voici ce que la boutique fait concrètement pour vous, à Saint-Michel.")}
        </p>
      </Reveal>

      <div className="mt-8 divide-y divide-[hsl(222_27%_92%)] border-y hairline">
        {SERVICES.map((sv, i) => (
          <Reveal key={sv.t} delay={i * 50}>
            <div className="flex items-start gap-5 py-6">
              <span className="font-display mt-1 text-[14px] font-semibold text-brand-green-800">
                0{i + 1}
              </span>
              <div>
                <h2 className="font-display text-[18px] font-semibold">{t(sv.t)}</h2>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted-foreground">{t(sv.d)}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <a
          href={waLink(s, language === "en"
            ? "Hello Manaaf, I need help with a service (repair / trade-in / delivery)."
            : "Bonjour Manaaf, j'ai besoin d'un service (réparation / reprise / livraison).")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-[52px] items-center gap-2 rounded-full bg-whatsapp px-6 text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
        >
          <MessageCircle className="h-4 w-4" />
          {t("Demander sur WhatsApp")}
        </a>
        <Link
          to="/boutique"
          className="inline-flex h-[52px] items-center gap-2 rounded-full border border-brand-blue-700/20 px-6 text-[15px] font-semibold transition-colors hover:bg-mist"
        >
          {t("Voir la boutique")}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
    </div>
  );
}
