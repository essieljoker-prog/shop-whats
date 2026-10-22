import { Link } from "react-router";
import { MessageCircle, Phone, MapPin, Clock } from "lucide-react";
import { Logo } from "./Logo";
import { useSettings } from "@/hooks/useSettings";
import { waLink, waGeneralMessage } from "@/lib/whatsapp";
import { trpc } from "@/providers/trpc";
import { useSitePreferences } from "@/providers/site-preferences";

export function SiteFooter() {
  const { s } = useSettings();
  const { language, t } = useSitePreferences();
  const { data: cats } = trpc.catalog.categories.useQuery();

  return (
    <footer className="brand-surface brand-surface-paper border-t hairline pb-24 md:pb-0">
      <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
        <div className="grid grid-cols-2 gap-x-5 gap-y-7 md:grid-cols-4 md:gap-8">
          <div className="col-span-2 md:col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
              {t("Téléphones neufs et d'occasion garantis, accessoires et gaming — Saint-Michel, Cotonou.")}
            </p>
            <a
              href={waLink(s, waGeneralMessage(language))}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex h-10 items-center gap-2 rounded-full bg-whatsapp px-4 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              <MessageCircle className="h-4 w-4" />
              {t("Écrire sur WhatsApp")}
            </a>
          </div>

          <nav aria-label={t("Catégories")}>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("Catégories")}
            </h3>
            <ul className="mt-3 space-y-2 text-[13px]">
              {cats?.slice(0, 6).map((c) => (
                <li key={c.id}>
                  <Link to={`/boutique?categorie=${c.slug}`} className="link-underline">
                    {t(c.name)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
              {t("Contact")}
            </h3>
            <ul className="mt-3 space-y-2.5 text-[13px]">
              {s.address && <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-800" />
                <span>{s.address}</span>
              </li>}
              {s.hours && <li className="flex items-start gap-2">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-800" />
                <span>{s.hours}</span>
              </li>}
              {s.phone && <li className="flex items-start gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand-green-800" />
                <a href={`tel:${s.phone?.replace(/\s/g, "")}`} className="link-underline">
                  {s.phone}
                </a>
              </li>}
            </ul>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[13px]">
              {s.tiktok && (
                <a href={s.tiktok} target="_blank" rel="noopener noreferrer" className="link-underline">
                  TikTok
                </a>
              )}
              {s.instagram && (
                <a href={s.instagram} target="_blank" rel="noopener noreferrer" className="link-underline">
                  Instagram
                </a>
              )}
              {s.facebook && (
                <a href={s.facebook} target="_blank" rel="noopener noreferrer" className="link-underline">
                  Facebook
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t hairline pt-4 text-[12px] text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Manaaf — {t("All Rights Reserved")}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            <Link to="/mentions-legales" className="link-underline">{t("Mentions légales")}</Link>
            <Link to="/politique-confidentialite" className="link-underline">{t("Confidentialité")}</Link>
            <Link to="/cgv" className="link-underline">{t("CGV")}</Link>
          </div>
        </div>
        <div className="mt-3 text-center text-[11px] text-muted-foreground">
          <a className="link-underline" href="mailto:tech05cullinan@gmail.com">@techcullinan</a>
        </div>
      </div>
    </footer>
  );
}
