import { useEffect } from "react";
import { useSitePreferences } from "@/providers/site-preferences";
import { updateSeoMetadata } from "@/lib/seo";

const CONTENT: Record<string, { title: string; body: string[] }> = {
  "mentions-legales": {
    title: "Mentions légales",
    body: [
      "Manaaf — boutique de vente de téléphones, accessoires et gadgets.",
      "Adresse : Saint-Michel, Cotonou, Bénin (deuxième von après la von des techniciens).",
      "Téléphone : +229 01 51 21 72 71 · +229 01 96 03 72 15.",
      "[À COMPLÉTER] Informations d'immatriculation de l'entreprise.",
    ],
  },
  "politique-confidentialite": {
    title: "Politique de confidentialité",
    body: [
      "Responsable du traitement : [À COMPLÉTER — dénomination légale, forme juridique, adresse légale et coordonnées du responsable].",
      "Le site ne propose actuellement ni compte client, ni formulaire public de commande ou de contact. Il ne comporte pas de paiement en ligne ni de base de commandes ou de clients.",
      "Lorsque vous choisissez un lien WhatsApp, un service externe s'ouvre. Certains liens préremplissent un message avec le nom et le prix du produit demandé. Le site ne transmet pas ce message à WhatsApp : vous décidez vous-même de l'envoyer. Les échanges et informations que vous communiquez ensuite sont traités par WhatsApp selon les conditions de ce service.",
      "Pour mémoriser vos choix sur cet appareil, le site conserve la langue et le thème dans le stockage local du navigateur (localStorage). Il garde temporairement, dans la session de navigation (sessionStorage), la dernière image de catégorie affichée afin de varier les images au prochain affichage. Ces éléments ne servent pas à mesurer l'audience ni à faire de la publicité.",
      "Un cookie de session nommé smg_admin est utilisé pour l'authentification de l'espace administrateur uniquement. Il est HttpOnly, SameSite=Lax, sécurisé en production et expire après quatre heures. Aucun outil d'analyse d'audience ni pixel publicitaire n'a été trouvé dans le code audité.",
      "Les polices du site sont chargées depuis Google Fonts. Cette requête externe peut transmettre à Google des données techniques nécessaires au chargement de la ressource. Les liens vers WhatsApp, Google Maps et les réseaux sociaux ne sont ouverts qu'à votre initiative.",
      "À compléter avant la mise en production : finalités et bases juridiques applicables, durées de conservation (y compris celles des journaux de l'hébergeur), destinataires, éventuels transferts, modalités d'exercice des droits et contact dédié. Ces éléments dépendent aussi des pratiques réelles de la boutique et de l'hébergeur.",
      "Pour toute demande relative à vos données : [À COMPLÉTER — adresse ou moyen de contact dédié].",
    ],
  },
  cgv: {
    title: "Conditions générales de vente",
    body: [
      "Les prix sont affichés en FCFA et confirmés sur WhatsApp au moment de la commande.",
      "Le paiement s'effectue à la remise du produit, en boutique ou à la livraison. Le produit peut être vérifié avant paiement.",
      "Les téléphones d'occasion sont contrôlés avant la vente et couverts par une garantie dont la durée figure sur la fiche produit.",
      "[À COMPLÉTER] conditions de retour et d'échange précises de la boutique.",
    ],
  },
};

export default function Legal({ kind }: { kind: keyof typeof CONTENT }) {
  const page = CONTENT[kind];
  const { language, t } = useSitePreferences();
  useEffect(() => {
    updateSeoMetadata({
      title: `${t(page.title)} — Manaaf`,
      description: `${t(page.title)} : informations officielles relatives à Manaaf, boutique à Cotonou.`,
    });
  }, [language, page.title, t]);

  return (
    <div className="brand-surface brand-surface-leaf">
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
        <h1 className="font-display text-[26px] font-bold tracking-tight md:text-[34px]">{t(page.title)}</h1>
        <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-muted-foreground">
          {page.body.map((p, i) => (
            <p key={i}>{t(p)}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
