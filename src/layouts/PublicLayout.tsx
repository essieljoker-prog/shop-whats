import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { useLocation } from "react-router";
import { Header } from "@/components/Header";
import { BottomNav } from "@/components/BottomNav";
import { SearchOverlay } from "@/components/SearchOverlay";
import { CategoriesSheet } from "@/components/CategoriesSheet";
import { SiteFooter } from "@/components/SiteFooter";
import { useSitePreferences } from "@/providers/site-preferences";
import { updateSeoMetadata } from "@/lib/seo";

export function PublicLayout() {
  const location = useLocation();
  const { language, t } = useSitePreferences();
  const [searchOpen, setSearchOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);

  useEffect(() => {
    const path = location.pathname;
    const metadataByPath: Record<string, { title: string; description: string }> = {
      "/": {
        title: t("Manaaf — Téléphones neufs & occasion à Cotonou"),
        description: t("Téléphones neufs et d'occasion contrôlés et garantis à Saint-Michel, Cotonou. Découvrez iPhone, Samsung, Tecno, Infinix, Xiaomi et Google Pixel."),
      },
      "/boutique": {
        title: t("Boutique de téléphones — Manaaf Cotonou"),
        description: t("Découvrez les téléphones neufs et d'occasion, accessoires et gadgets disponibles chez Manaaf à Saint-Michel, Cotonou."),
      },
      "/occasion": {
        title: t("Téléphones d'occasion contrôlés — Manaaf"),
        description: t("Téléphones d'occasion contrôlés en boutique, avec diagnostic et garantie. Découvrez les offres Manaaf à Cotonou."),
      },
      "/services": {
        title: t("Réparation, garantie et livraison — Manaaf"),
        description: t("Découvrez les services de Manaaf à Saint-Michel, Cotonou : réparation, garantie, livraison et reprise de téléphone."),
      },
      "/contact": {
        title: t("Contact et adresse — Manaaf Cotonou"),
        description: t("Contactez Manaaf sur WhatsApp ou par téléphone, ou rendez-vous à la boutique de Saint-Michel à Cotonou."),
      },
      "/faq": {
        title: t("Questions fréquentes — Manaaf"),
        description: t("Informations sur les commandes, la livraison, le paiement et la garantie chez Manaaf à Cotonou."),
      },
      "/mentions-legales": {
        title: t("Mentions légales — Manaaf"),
        description: t("Mentions légales et coordonnées de Manaaf, boutique de téléphones à Cotonou."),
      },
      "/politique-confidentialite": {
        title: t("Politique de confidentialité — Manaaf"),
        description: t("Informations sur les données, stockages navigateur et services externes utilisés par le site Manaaf."),
      },
      "/cgv": {
        title: t("Conditions générales de vente — Manaaf"),
        description: t("Conditions de vente des téléphones et accessoires chez Manaaf à Cotonou."),
      },
    };
    const metadata = metadataByPath[path] ?? {
      title: t("Manaaf — Téléphones neufs & occasion à Cotonou"),
      description: t("Téléphones neufs et d'occasion contrôlés et garantis à Saint-Michel, Cotonou."),
    };

    if (!path.startsWith("/produit/")) {
      updateSeoMetadata(metadata);
    }
  }, [language, location.pathname, t]);

  return (
    <div className="min-h-screen bg-white">
      <Header onSearch={() => setSearchOpen(true)} />
      <main className="pt-16 md:pt-20">
        <Outlet />
      </main>
      <SiteFooter />
      <BottomNav
        onSearch={() => setSearchOpen(true)}
        onCategories={() => setCatsOpen(true)}
      />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CategoriesSheet open={catsOpen} onClose={() => setCatsOpen(false)} />
      {/* Espace pour la barre basse mobile */}
      <div className="h-16 md:hidden" aria-hidden />
    </div>
  );
}
