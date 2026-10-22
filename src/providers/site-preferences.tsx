import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

export type SiteLanguage = "fr" | "en";

const translations: Record<string, string> = {
  Accueil: "Home",
  Boutique: "Shop",
  Occasion: "Pre-owned",
  Services: "Services",
  Contact: "Contact",
  Rechercher: "Search",
  "Rechercher un téléphone": "Search for a phone",
  "Navigation principale": "Main navigation",
  "Navigation mobile": "Mobile navigation",
  "Manaaf — Accueil": "Manaaf — Home",
  Sombre: "Dark",
  Clair: "Light",
  Langue: "Language",
  "Passer en anglais": "Switch to English",
  "Passer en français": "Switch to French",
  "Activer le thème sombre": "Enable dark theme",
  "Activer le thème clair": "Enable light theme",
  "Saint-Michel · Cotonou": "Saint-Michel · Cotonou",
  "Téléphones neufs & occasion, garantis.": "New and pre-owned phones, guaranteed.",
  "iPhone, Samsung, Tecno, Infinix, Xiaomi, Google Pixel — contrôlés avant la vente, garantis, et livrés. Commandez en un message.":
    "iPhone, Samsung, Tecno, Infinix, Xiaomi, Google Pixel — checked before sale, guaranteed, and delivered. Order with one message.",
  "Voir la boutique": "Shop phones",
  "Parcourir": "Browse",
  "Tout voir": "View all",
  "Nos marques": "Our brands",
  "Produits en promotion": "Products on sale",
  "Promotion précédente": "Previous promotion",
  "Promotion suivante": "Next promotion",
  "Manaaf — Téléphones neufs & occasion à Cotonou": "Manaaf — New & pre-owned phones in Cotonou",
  "Boutique de téléphones — Manaaf Cotonou": "Phone shop — Manaaf Cotonou",
  "Découvrez les téléphones neufs et d'occasion, accessoires et gadgets disponibles chez Manaaf à Saint-Michel, Cotonou.":
    "Shop new and pre-owned phones, accessories and gadgets at Manaaf in Saint-Michel, Cotonou.",
  "Téléphones neufs et d'occasion contrôlés et garantis à Saint-Michel, Cotonou. Découvrez iPhone, Samsung, Tecno, Infinix, Xiaomi et Google Pixel.":
    "New and pre-owned phones checked and covered by warranty in Saint-Michel, Cotonou. Discover iPhone, Samsung, Tecno, Infinix, Xiaomi and Google Pixel.",
  "Téléphones d'occasion contrôlés — Manaaf": "Checked pre-owned phones — Manaaf",
  "Téléphones d'occasion contrôlés en boutique, avec diagnostic et garantie. Découvrez les offres Manaaf à Cotonou.":
    "Pre-owned phones checked in-store, with diagnostics and warranty. Discover Manaaf offers in Cotonou.",
  "Réparation, garantie et livraison — Manaaf": "Repairs, warranty and delivery — Manaaf",
  "Découvrez les services de Manaaf à Saint-Michel, Cotonou : réparation, garantie, livraison et reprise de téléphone.":
    "Discover Manaaf services in Saint-Michel, Cotonou: repairs, warranty, delivery and trade-ins.",
  "Contact et adresse — Manaaf Cotonou": "Contact and address — Manaaf Cotonou",
  "Contactez Manaaf sur WhatsApp ou par téléphone, ou rendez-vous à la boutique de Saint-Michel à Cotonou.":
    "Contact Manaaf on WhatsApp or by phone, or visit the store in Saint-Michel, Cotonou.",
  "Informations sur les commandes, la livraison, le paiement et la garantie chez Manaaf à Cotonou.":
    "Information about ordering, delivery, payment and warranties at Manaaf in Cotonou.",
  "Mentions légales — Manaaf": "Legal notice — Manaaf",
  "Mentions légales et coordonnées de Manaaf, boutique de téléphones à Cotonou.":
    "Legal notice and contact information for Manaaf, phone shop in Cotonou.",
  "Politique de confidentialité — Manaaf": "Privacy policy — Manaaf",
  "Informations sur les données, stockages navigateur et services externes utilisés par le site Manaaf.":
    "Information about data, browser storage and external services used by the Manaaf website.",
  "Conditions générales de vente — Manaaf": "Terms and conditions of sale — Manaaf",
  "Conditions de vente des téléphones et accessoires chez Manaaf à Cotonou.":
    "Terms for the sale of phones and accessories at Manaaf in Cotonou.",
  "All Rights Reserved": "Tous droits réservés",
  "Votre confiance, notre priorité": "Your trust, our priority",
  "Ils nous font confiance": "They trust us",
  "Découvrez les retours de nos clients après leurs achats chez Manaaf, en boutique ou via WhatsApp.":
    "Read feedback from customers after shopping with Manaaf, in-store or via WhatsApp.",
  "Achat en boutique": "In-store purchase",
  "Commande via WhatsApp": "WhatsApp order",
  "À la une": "Featured",
  "Toute la boutique": "All products",
  "Des occasions contrôlées, pas des surprises.": "Carefully checked pre-owned phones, no surprises.",
  "Chaque téléphone d'occasion passe un contrôle en boutique avant sa mise en vente. Le diagnostic vous est présenté avant l'achat — et la batterie est affichée sur chaque fiche.":
    "Every pre-owned phone is checked in-store before sale. We share the diagnosis before purchase, and battery health is shown on every product page.",
  Batterie: "Battery",
  Écran: "Screen",
  Caméras: "Cameras",
  Charge: "Charging",
  "Réseau & SIM": "Network & SIM",
  "Haut-parleurs": "Speakers",
  "Voir les occasions": "Shop pre-owned",
  "Services de la boutique": "Store services",
  Réparation: "Repairs",
  Garantie: "Warranty",
  Livraison: "Delivery",
  "Reprise / échange": "Trade-in / exchange",
  "Écran cassé, batterie fatiguée, connectique, problème logiciel : apportez votre téléphone en boutique pour un diagnostic. Le devis vous est communiqué avant toute intervention.":
    "Cracked screen, worn battery, charging port or software issue: bring your phone in for a diagnosis. You will receive a quote before any work begins.",
  "Chaque téléphone vendu repart avec une garantie — constructeur pour les neufs, boutique pour les occasions. La durée exacte est indiquée sur chaque fiche produit.":
    "Every phone sold comes with a warranty — manufacturer warranty for new devices and store warranty for pre-owned devices. The exact duration is shown on each product page.",
  "Livraison disponible sur Cotonou et les environs. Le délai et les frais se confirment sur WhatsApp au moment de la commande. Retrait en boutique possible.":
    "Delivery is available in Cotonou and nearby areas. Timing and fees are confirmed on WhatsApp when you order. In-store pickup is also available.",
  "Votre ancien téléphone a de la valeur : apportez-le en boutique pour une estimation, ou décrivez-le nous sur WhatsApp (modèle, état, batterie).":
    "Your old phone may be worth something: bring it in for an estimate or message us on WhatsApp with its model, condition and battery health.",
  "Demander sur WhatsApp": "Ask us on WhatsApp",
  "Le moyen le plus rapide : WhatsApp. Sinon, appelez ou passez à la boutique.":
    "The fastest way to reach us is WhatsApp. You can also call or visit our store.",
  "réponse rapide aux horaires d'ouverture": "we reply quickly during opening hours",
  Téléphone: "Phone",
  "La boutique": "Store",
  "Ouvrir dans Google Maps": "Open in Google Maps",
  Horaires: "Opening hours",
  "Questions fréquentes": "Frequently asked questions",
  "Comment commander ?": "How do I place an order?",
  "Ouvrez la fiche du téléphone et touchez « Commander sur WhatsApp » : un message pré-rempli s'ouvre avec le nom et le prix du produit. Nous confirmons la disponibilité et la suite ensemble.":
    "Open the phone's product page and tap “Order on WhatsApp”. A pre-filled message with the product name and price will open. We will confirm availability and the next steps with you.",
  "Livrez-vous ?": "Do you deliver?",
  "Oui, la livraison est disponible sur Cotonou et les environs. Le délai et les frais exacts se confirment sur WhatsApp au moment de la commande. Vous pouvez aussi retirer en boutique à Saint-Michel.":
    "Yes, delivery is available in Cotonou and nearby areas. Timing and fees are confirmed on WhatsApp when you order. You can also pick up your order at our Saint-Michel store.",
  "Comment se passe le paiement ?": "How does payment work?",
  "Le paiement se fait à la remise du téléphone — en boutique ou à la livraison. Vous vérifiez le produit avant de payer.":
    "Payment is made when you receive the phone, in-store or on delivery. You can inspect the product before paying.",
  "Les téléphones d'occasion sont-ils garantis ?": "Do pre-owned phones come with a warranty?",
  "Oui. Chaque occasion est contrôlée en boutique (batterie, écran, caméras, charge, réseau) et repart avec une garantie dont la durée est indiquée sur la fiche produit.":
    "Yes. Every pre-owned phone is checked in-store (battery, screen, cameras, charging and network) and comes with a warranty. Its duration is shown on the product page.",
  "Puis-je échanger mon ancien téléphone ?": "Can I trade in my old phone?",
  "Oui, la reprise est possible : apportez votre ancien téléphone en boutique pour une estimation, ou écrivez-nous sur WhatsApp avec le modèle et son état.":
    "Yes. Bring your old phone to the store for an estimate, or message us on WhatsApp with its model and condition.",
  "Un produit affiché est-il vraiment en stock ?": "Is a listed product really in stock?",
  "Le statut de disponibilité est mis à jour par la boutique. En cas de doute, envoyez-nous un message WhatsApp depuis la fiche produit : nous confirmons en quelques minutes.":
    "The store updates product availability. If you are unsure, message us on WhatsApp from the product page and we will confirm shortly.",
  "Contactez-nous": "Contact us",
  "Passez nous voir à Saint-Michel.": "Visit us in Saint-Michel.",
  "Ouvrir dans Maps": "Open in Maps",
  "Les nouveaux arrivages sur TikTok": "See the latest arrivals on TikTok",
  "@smg.plug1 — vidéos des produits avant tout le monde.": "@smg.plug1 — product videos before anyone else.",
  Catégories: "Categories",
  "Écrire sur WhatsApp": "Message us on WhatsApp",
  "Téléphones neufs et d'occasion garantis, accessoires et gaming — Saint-Michel, Cotonou.":
    "Guaranteed new and pre-owned phones, accessories and gaming — Saint-Michel, Cotonou.",
  "Tout le catalogue": "Full catalogue",
  "Mentions légales": "Legal notice",
  Confidentialité: "Privacy",
  CGV: "Terms of sale",
  Filtres: "Filters",
  "Toutes les marques": "All brands",
  "Rechercher un téléphone, une marque…": "Search for a phone or brand…",
  "Rechercher dans la boutique": "Search the shop",
  "Trier": "Sort",
  Récents: "Newest",
  "Prix croissant": "Price: low to high",
  "Prix décroissant": "Price: high to low",
  "Nom A–Z": "Name A–Z",
  "Chargement…": "Loading…",
  "Aucun produit ne correspond. Essayez d'autres filtres ou écrivez-nous sur WhatsApp.":
    "No products match. Try different filters or message us on WhatsApp.",
  Marque: "Brand",
  État: "Condition",
  Neuf: "New",
  "Budget max": "Maximum budget",
  Réinitialiser: "Reset",
  "Voir les résultats": "Show results",
  "Un téléphone d'occasion, sans mauvaise surprise.":
    "A pre-owned phone, with no nasty surprises.",
  "Chaque occasion est contrôlée en boutique avant sa mise en vente : batterie, écran, caméras, charge, réseau. Le diagnostic vous est présenté avant l'achat, et la garantie est indiquée sur chaque fiche.":
    "Every pre-owned phone is checked in-store before sale: battery, screen, cameras, charging and network. We share the diagnosis before purchase, and the warranty is shown on every product page.",
  "Être conseillé sur WhatsApp": "Get advice on WhatsApp",
  "Téléphones d'occasion": "Pre-owned phones",
  occasion: "pre-owned phone",
  occasions: "pre-owned phones",
  "— triées par prix": "— sorted by price",
  "Aucune occasion en ligne pour le moment — les arrivages sont fréquents, écrivez-nous pour être prévenu.":
    "No pre-owned phones are listed right now. New arrivals come in often, so message us to be notified.",
  "Manaaf ne s'arrête pas à la vente. Voici ce que la boutique fait concrètement pour vous, à Saint-Michel.":
    "Manaaf is about more than sales. Here is how our Saint-Michel store can help.",
  "Partager ce produit": "Share this product",
  "Lien copié": "Link copied",
  Partager: "Share",
  Promo: "Sale",
  "Disponible en boutique": "Available in store",
  "Occasion contrôlée": "Checked pre-owned phone",
  "Contrôle en boutique avant mise en vente": "Checked in-store before sale",
  "Commander sur WhatsApp": "Order on WhatsApp",
  "Appeler la boutique": "Call the store",
  "Ce produit n'est pas encore disponible à la vente.": "This product is not available for sale yet.",
  "Être averti sur WhatsApp": "Notify me on WhatsApp",
  "Ce produit n'est plus disponible.": "This product is no longer available.",
  "Demandez-nous un modèle équivalent": "Ask us about a similar model",
  Description: "Description",
  Caractéristiques: "Specifications",
  "Livraison & retrait": "Delivery & pickup",
  "Retrait en boutique à Saint-Michel, Cotonou, ou livraison sur Cotonou et environs. Les détails et frais exacts se confirment sur WhatsApp au moment de la commande. Paiement à la remise du produit.":
    "Pick up your order at our Saint-Michel store in Cotonou, or choose delivery in Cotonou and nearby areas. Exact details and fees are confirmed on WhatsApp when you order. Payment is made upon receipt.",
  "Produits similaires": "Similar products",
  "Dans la même catégorie": "In the same category",
  "Ce produit n'est plus en ligne.": "This product is no longer listed.",
  "Retour à la boutique": "Back to the shop",
  "Retour à l'accueil": "Back to home",
  "Cette page n'existe pas.": "This page doesn't exist.",
  "Une autre question ?": "Have another question?",
  "Tapez le nom d'un téléphone, d'une marque ou d'un accessoire.":
    "Type a phone, brand or accessory name.",
  "Rechercher un produit": "Search products",
  Recherche: "Search",
  "Fermer la recherche": "Close search",
  "Fermer les catégories": "Close categories",
  "Aucun résultat pour": "No results for",
  "Désolé, aucun résultat.": "Sorry, no results found.",
  "Mode sombre": "Dark mode",
  "Mode clair": "Light mode",
  "Commande —": "Order —",
  Voir: "View",
  Commander: "Order",
  "sur WhatsApp": "on WhatsApp",
  produits: "products",
  produit: "product",
  Tout: "All",
  Marques: "Brands",
  Fermer: "Close",
  "Fermer les filtres": "Close filters",
  "Essayez une autre marque ou contactez-nous sur WhatsApp.":
    "Try another brand or contact us on WhatsApp.",
  "Accessoires": "Accessories",
  "Gaming & Gadgets": "Gaming & Gadgets",
  "Téléphones": "Phones",
  "Diagnostic et réparation en boutique — écran, batterie, connectique, logiciel.":
    "In-store diagnostics and repairs for screens, batteries, charging ports and software.",
  "Chaque téléphone repart avec une garantie. La durée est indiquée sur la fiche produit.":
    "Every phone comes with a warranty. Its duration is shown on the product page.",
  "Livraison disponible sur Cotonou et environs. Les détails se confirment sur WhatsApp.":
    "Delivery is available in Cotonou and nearby areas. Details are confirmed on WhatsApp.",
  "Votre ancien téléphone peut être repris : apportez-le en boutique pour une estimation.":
    "Trade in your old phone: bring it to the store for an estimate.",
  "Voir la boutique sur Google Maps": "View the store on Google Maps",
  "Carte — Manaaf, Saint-Michel, Cotonou": "Map — Manaaf, Saint-Michel, Cotonou",
  "Marques disponibles": "Available brands",
  "Produits à la une": "Featured products",
  "Filtrer par marque": "Filter by brand",
  "Saint-Michel, Cotonou — deuxième von après la von des techniciens":
    "Saint-Michel, Cotonou — second von after the technicians' von",
  "[À CONFIRMER] Lun – Sam : 9h – 19h": "[TO CONFIRM] Mon – Sat: 9 am – 7 pm",
  "Bénin": "Benin",
  "Le produit": "Product",
  "Heures": "Hours",
  "Appelez la boutique": "Call the store",
  "Questions fréquentes — Manaaf": "Frequently asked questions — Manaaf",
  "Politique de confidentialité": "Privacy policy",
  "Responsable du traitement : [À COMPLÉTER — dénomination légale, forme juridique, adresse légale et coordonnées du responsable].":
    "Data controller: [TO BE COMPLETED — legal name, legal form, registered address and controller contact details].",
  "Le site ne propose actuellement ni compte client, ni formulaire public de commande ou de contact. Il ne comporte pas de paiement en ligne ni de base de commandes ou de clients.":
    "The site currently offers no customer account or public order/contact form. It has no online payment feature or customer/order database.",
  "Lorsque vous choisissez un lien WhatsApp, un service externe s'ouvre. Certains liens préremplissent un message avec le nom et le prix du produit demandé. Le site ne transmet pas ce message à WhatsApp : vous décidez vous-même de l'envoyer. Les échanges et informations que vous communiquez ensuite sont traités par WhatsApp selon les conditions de ce service.":
    "When you choose a WhatsApp link, an external service opens. Some links prefill a message with the requested product name and price. The site does not send that message to WhatsApp; you decide whether to send it. Subsequent conversations and information you provide are handled by WhatsApp under its terms.",
  "Pour mémoriser vos choix sur cet appareil, le site conserve la langue et le thème dans le stockage local du navigateur (localStorage). Il garde temporairement, dans la session de navigation (sessionStorage), la dernière image de catégorie affichée afin de varier les images au prochain affichage. Ces éléments ne servent pas à mesurer l'audience ni à faire de la publicité.":
    "To remember your choices on this device, the site stores your language and theme in browser local storage (localStorage). It temporarily keeps the last displayed category image in session storage (sessionStorage) to vary images on the next display. These items are not used for audience measurement or advertising.",
  "Un cookie de session nommé smg_admin est utilisé pour l'authentification de l'espace administrateur uniquement. Il est HttpOnly, SameSite=Lax, sécurisé en production et expire après quatre heures. Aucun outil d'analyse d'audience ni pixel publicitaire n'a été trouvé dans le code audité.":
    "A session cookie named smg_admin is used only to authenticate the admin area. It is HttpOnly, SameSite=Lax, secure in production and expires after four hours. No audience analytics tool or advertising pixel was found in the audited code.",
  "Les polices du site sont chargées depuis Google Fonts. Cette requête externe peut transmettre à Google des données techniques nécessaires au chargement de la ressource. Les liens vers WhatsApp, Google Maps et les réseaux sociaux ne sont ouverts qu'à votre initiative.":
    "The site's fonts are loaded from Google Fonts. This external request may send Google technical data needed to load the resource. Links to WhatsApp, Google Maps and social networks are opened only at your initiative.",
  "À compléter avant la mise en production : finalités et bases juridiques applicables, durées de conservation (y compris celles des journaux de l'hébergeur), destinataires, éventuels transferts, modalités d'exercice des droits et contact dédié. Ces éléments dépendent aussi des pratiques réelles de la boutique et de l'hébergeur.":
    "To complete before production: applicable purposes and legal bases, retention periods (including hosting logs), recipients, any transfers, how to exercise rights and a dedicated contact. These also depend on the store's and hosting provider's actual practices.",
  "Pour toute demande relative à vos données : [À COMPLÉTER — adresse ou moyen de contact dédié].":
    "For any request regarding your data: [TO BE COMPLETED — dedicated address or contact method].",
  "Téléphone : +229 01 51 21 72 71 · +229 01 96 03 72 15.":
    "Phone: +229 01 51 21 72 71 · +229 01 96 03 72 15.",
  "[À COMPLÉTER] Informations d'immatriculation de l'entreprise.":
    "[TO BE COMPLETED] Business registration details.",
  "[À COMPLÉTER] conditions de retour et d'échange précises de la boutique.":
    "[TO BE COMPLETED] the store's exact return and exchange terms.",
  "Bonjour Manaaf, je cherche un téléphone d'occasion. Pouvez-vous me conseiller ?":
    "Hello Manaaf, I am looking for a pre-owned phone. Could you advise me?",
  "Bonjour Manaaf, j'ai besoin d'un service (réparation / reprise / livraison).":
    "Hello Manaaf, I need help with a service (repair / trade-in / delivery).",
  "Bonjour Manaaf, je souhaite être averti lorsque":
    "Hello Manaaf, please notify me when",
  "sera disponible.": "is available.",
  "Bientôt disponible": "Coming soon",
  "Indisponible": "Unavailable",
  "Disponible": "Available",
  "Cliquez pour sélectionner l'anglais": "Select English",
  "Cliquez pour sélectionner le français": "Select French",
  "Conditions générales de vente": "Terms and conditions of sale",
  "Les prix sont affichés en FCFA et confirmés sur WhatsApp au moment de la commande.":
    "Prices are shown in CFA francs and confirmed on WhatsApp when you order.",
  "Le paiement s'effectue à la remise du produit, en boutique ou à la livraison. Le produit peut être vérifié avant paiement.":
    "Payment is due when the product is handed over, in-store or on delivery. You can inspect it before paying.",
  "Les téléphones d'occasion sont contrôlés avant la vente et couverts par une garantie dont la durée figure sur la fiche produit.":
    "Pre-owned phones are checked before sale and come with a warranty whose duration is shown on the product page.",
  "Saint-Michel, Cotonou, Bénin (deuxième von après la von des techniciens).":
    "Saint-Michel, Cotonou, Benin (second von after the technicians' von).",
  "Photo": "Photo",
  "de": "of",
  "de capacité": "capacity",
};

type SitePreferences = {
  language: SiteLanguage;
  isDark: boolean;
  setLanguage: (language: SiteLanguage) => void;
  setIsDark: (isDark: boolean) => void;
  t: (frenchText: string) => string;
};

const PreferencesContext = createContext<SitePreferences | null>(null);

function readPreference<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const saved = window.localStorage.getItem(key);
    return allowed.includes(saved as T) ? (saved as T) : fallback;
  } catch {
    return fallback;
  }
}

export function SitePreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<SiteLanguage>(() =>
    readPreference("smg-pluq-language", ["fr", "en"], "fr"),
  );
  const [isDark, setIsDark] = useState(() =>
    readPreference("smg-pluq-theme", ["dark", "light"], "light") === "dark",
  );

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    const defaultTitle = "Manaaf — Téléphones neufs & occasion à Cotonou";
    const englishTitle = "Manaaf — New & pre-owned phones in Cotonou";
    if (document.title === defaultTitle || document.title === englishTitle) {
      document.title = language === "en" ? englishTitle : defaultTitle;
    }
    try {
      window.localStorage.setItem("smg-pluq-language", language);
      window.localStorage.setItem("smg-pluq-theme", isDark ? "dark" : "light");
    } catch {
      // Keep the selected preferences active for this page when storage is unavailable.
    }
  }, [language, isDark]);

  const value = useMemo<SitePreferences>(
    () => ({
      language,
      isDark,
      setLanguage,
      setIsDark,
      t: (frenchText) => (language === "en" ? translations[frenchText] ?? frenchText : frenchText),
    }),
    [language, isDark],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function useSitePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("useSitePreferences must be used inside SitePreferencesProvider.");
  }
  return context;
}
