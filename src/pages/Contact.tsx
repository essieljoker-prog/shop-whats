import { MessageCircle, Phone, MapPin, Clock } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import { waLink, waGeneralMessage } from "@/lib/whatsapp";
import { Reveal } from "@/components/Reveal";
import { useSitePreferences } from "@/providers/site-preferences";

export default function Contact() {
  const { s } = useSettings();
  const { language, t } = useSitePreferences();
  return (
    <div className="brand-surface brand-surface-leaf min-h-full">
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-16">
      <Reveal>
        <h1 className="font-display text-[26px] font-bold tracking-tight md:text-[34px]">{t("Contact")}</h1>
        <p className="mt-3 text-[15px] text-muted-foreground">
          {t("Le moyen le plus rapide : WhatsApp. Sinon, appelez ou passez à la boutique.")}
        </p>
      </Reveal>

      <div className="mt-8 space-y-3">
        <a
          href={waLink(s, waGeneralMessage(language))}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-4 rounded-2xl border p-5 transition-colors hover:border-whatsapp"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-whatsapp text-white">
            <MessageCircle className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-[16px] font-semibold">WhatsApp</p>
            <p className="text-[14px] text-muted-foreground">{s.phone} — {t("réponse rapide aux horaires d'ouverture")}</p>
          </div>
        </a>

        <a
          href={`tel:${s.phone?.replace(/\s/g, "")}`}
          className="flex items-center gap-4 rounded-2xl border p-5 transition-colors hover:border-brand-blue-700/30"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-blue-700 text-white">
            <Phone className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-[16px] font-semibold">{t("Téléphone")}</p>
            <p className="text-[14px] text-muted-foreground">
              {s.phone}{s.phone2 ? ` · ${s.phone2}` : ""}
            </p>
          </div>
        </a>

        <div className="flex items-start gap-4 rounded-2xl border p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mist text-brand-blue-700">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-[16px] font-semibold">{t("La boutique")}</p>
            <p className="mt-0.5 text-[14px] leading-relaxed text-muted-foreground">{s.address}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("Manaaf Saint-Michel Cotonou")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="link-underline mt-1.5 inline-block text-[14px] font-medium text-brand-blue-700"
            >
              {t("Ouvrir dans Google Maps")}
            </a>
          </div>
        </div>

        <div className="flex items-start gap-4 rounded-2xl border p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-mist text-brand-blue-700">
            <Clock className="h-5 w-5" />
          </span>
          <div>
            <p className="font-display text-[16px] font-semibold">{t("Horaires")}</p>
            <p className="mt-0.5 text-[14px] text-muted-foreground">{s.hours}</p>
          </div>
        </div>
      </div>

      <Reveal className="mt-8">
        <div className="flex gap-5 text-[15px]">
          {s.tiktok && <a href={s.tiktok} target="_blank" rel="noopener noreferrer" className="link-underline font-medium">TikTok</a>}
          {s.instagram && <a href={s.instagram} target="_blank" rel="noopener noreferrer" className="link-underline font-medium">Instagram</a>}
          {s.facebook && <a href={s.facebook} target="_blank" rel="noopener noreferrer" className="link-underline font-medium">Facebook</a>}
        </div>
      </Reveal>
    </div>
    </div>
  );
}
