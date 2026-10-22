import { Link } from "react-router";
import { useSitePreferences } from "@/providers/site-preferences";

export default function NotFound() {
  const { t } = useSitePreferences();
  return (
    <div className="brand-surface brand-surface-sky">
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="font-display text-[64px] font-bold text-brand-blue-700">404</p>
        <p className="mt-2 text-[17px] font-medium">{t("Cette page n'existe pas.")}</p>
        <Link
          to="/"
          className="mt-6 inline-flex h-12 items-center rounded-full bg-brand-blue-700 px-6 text-[15px] font-semibold text-white"
        >
          {t("Retour à l'accueil")}
        </Link>
      </div>
    </div>
  );
}
