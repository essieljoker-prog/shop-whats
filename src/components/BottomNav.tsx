import { NavLink } from "react-router";
import { Home, ShoppingBag, Search, LayoutGrid, MessageCircle } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { waLink, waGeneralMessage } from "@/lib/whatsapp";
import { useSitePreferences } from "@/providers/site-preferences";

/** Barre de navigation mobile fixe — 5 destinations, accessible au pouce. */
export function BottomNav({
  onSearch,
  onCategories,
}: {
  onSearch: () => void;
  onCategories: () => void;
}) {
  const { s } = useSettings();
  const { language, t } = useSitePreferences();
  const item =
    "mx-0.5 flex flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-2 text-[10.5px] font-medium transition-colors";

  return (
    <nav
      className="glass-bar fixed inset-x-2 bottom-2 z-40 overflow-hidden rounded-2xl border hairline pb-[env(safe-area-inset-bottom)] md:hidden"
      aria-label={t("Navigation mobile")}
    >
      <div className="flex px-1 pt-1">
        <NavLink to="/" end className={({ isActive }) => `${item} ${isActive ? "bg-brand-blue-700/10 text-brand-blue-700" : "text-muted-foreground"}`}>
          <Home className="h-5 w-5" />
          {t("Accueil")}
        </NavLink>
        <NavLink to="/boutique" className={({ isActive }) => `${item} ${isActive ? "bg-brand-blue-700/10 text-brand-blue-700" : "text-muted-foreground"}`}>
          <ShoppingBag className="h-5 w-5" />
          {t("Boutique")}
        </NavLink>
        <button onClick={onSearch} className={`${item} text-muted-foreground`}>
          <Search className="h-5 w-5" />
          {t("Recherche")}
        </button>
        <button onClick={onCategories} className={`${item} text-muted-foreground`}>
          <LayoutGrid className="h-5 w-5" />
          {t("Catégories")}
        </button>
        <a
          href={waLink(s, waGeneralMessage(language))}
          target="_blank"
          rel="noopener noreferrer"
          className={`${item} text-whatsapp`}
        >
          <MessageCircle className="h-5 w-5" />
          WhatsApp
        </a>
      </div>
    </nav>
  );
}
