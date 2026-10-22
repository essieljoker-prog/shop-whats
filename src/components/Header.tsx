import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router";
import { Search, Moon, Sun } from "lucide-react";
import { Logo } from "./Logo";
import { useSitePreferences } from "@/providers/site-preferences";

const NAV = [
  { to: "/", label: "Accueil" },
  { to: "/boutique", label: "Boutique" },
  { to: "/occasion", label: "Occasion" },
  { to: "/services", label: "Services" },
  { to: "/contact", label: "Contact" },
];

/** En-tête fixe et compact, avec un léger relief après le début du scroll. */
export function Header({ onSearch }: { onSearch: () => void }) {
  const { language, isDark, setLanguage, setIsDark, t } = useSitePreferences();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`glass-bar fixed inset-x-2 top-2 z-40 rounded-2xl border hairline transition-[box-shadow] duration-200 motion-reduce:transition-none md:inset-x-4 md:top-3 ${
        scrolled ? "shadow-xs" : ""
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:h-16 md:px-6">
        <Link to="/" aria-label={t("Manaaf — Accueil")} className="logo-frame rounded-xl px-1.5 py-1">
          <Logo />
        </Link>

        <nav className="glass-control hidden items-center gap-1 rounded-xl border hairline p-1 md:flex lg:gap-2" aria-label={t("Navigation principale")}>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-lg px-2 py-1.5 text-[12px] font-medium transition-colors lg:px-2.5 lg:text-[14px] ${
                  isActive ? "bg-brand-blue-700/10 text-brand-blue-700" : "text-muted-foreground hover:bg-mist hover:text-brand-blue-700"
                }`
              }
            >
              {t(item.label)}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            onClick={onSearch}
            aria-label={t("Rechercher un téléphone")}
            className="glass-control flex h-9 w-9 items-center justify-center rounded-xl border hairline transition-colors hover:bg-mist xl:hidden"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={onSearch}
            className="glass-control hidden h-9 items-center gap-2 rounded-xl border hairline px-3 text-[13px] text-muted-foreground transition-colors hover:bg-mist xl:flex"
          >
            <Search className="h-4 w-4" />
            {t("Rechercher")}
          </button>
          <div className="glass-control flex h-9 items-center rounded-xl border hairline p-0.5" role="group" aria-label={t("Langue")}>
            {(["fr", "en"] as const).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={language === option}
                aria-label={option === "en" ? t("Passer en anglais") : t("Passer en français")}
                onClick={() => setLanguage(option)}
                className={`h-7 min-w-7 rounded-full px-1.5 text-[11px] font-semibold transition-colors ${
                  language === option ? "bg-brand-blue-700 text-white" : "text-muted-foreground hover:bg-mist"
                }`}
              >
                {option.toUpperCase()}
              </button>
            ))}
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={isDark}
            aria-label={t(isDark ? "Activer le thème clair" : "Activer le thème sombre")}
            title={t(isDark ? "Activer le thème clair" : "Activer le thème sombre")}
            onClick={() => setIsDark(!isDark)}
            className={`glass-control relative flex h-9 w-[42px] shrink-0 items-center rounded-xl border p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue-700 motion-reduce:transition-none ${
              isDark ? "justify-end bg-brand-blue-700" : "justify-start bg-mist"
            }`}
          >
            <span className="sr-only">{t(isDark ? "Sombre" : "Clair")}</span>
            <span className="theme-toggle-thumb flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand-blue-700 shadow-xs">
              {isDark ? <Moon className="h-4 w-4" aria-hidden /> : <Sun className="h-4 w-4" aria-hidden />}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
