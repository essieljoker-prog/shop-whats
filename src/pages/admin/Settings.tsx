import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/providers/trpc";
import {
  DEFAULT_OPENING_HOURS,
  parseOpeningHours,
  serializeOpeningHours,
  WEEK_DAYS,
  type OpeningHours,
} from "@/lib/opening-hours";

const FIELDS: { key: string; label: string; hint?: string }[] = [
  { key: "currency", label: "Devise", hint: "FCFA" },
  { key: "whatsapp", label: "Numéro WhatsApp", hint: "Format international sans + : 2290151217271" },
  { key: "phone", label: "Téléphone principal" },
  { key: "phone2", label: "Téléphone secondaire" },
  { key: "address", label: "Adresse de la boutique" },
  { key: "tiktok", label: "Lien TikTok" },
  { key: "instagram", label: "Lien Instagram" },
  { key: "facebook", label: "Lien Facebook" },
];

export default function AdminSettings() {
  const utils = trpc.useUtils();
  const { data } = trpc.admin.settings.useQuery();
  const [values, setValues] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settingsError, setSettingsError] = useState("");
  const [hours, setHours] = useState<OpeningHours>(DEFAULT_OPENING_HOURS);

  const [pwd, setPwd] = useState({ current: "", next: "" });
  const [pwdMsg, setPwdMsg] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNextPassword, setShowNextPassword] = useState(false);

  if (data && !initialized) {
    setValues(data);
    setHours(parseOpeningHours(data.hours) ?? DEFAULT_OPENING_HOURS);
    setInitialized(true);
  }

  const save = trpc.admin.saveSettings.useMutation({
    onSuccess: () => {
      utils.catalog.settings.invalidate();
      setSettingsError("");
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      toast.success("Paramètres enregistrés.");
    },
    onError: (error) => {
      setSaved(false);
      setSettingsError(error.message);
      toast.error(error.message);
    },
  });
  const changePassword = trpc.admin.changePassword.useMutation({
    onSuccess: () => {
      setPwd({ current: "", next: "" });
      setPwdMsg("Mot de passe modifié.");
      toast.success("Mot de passe modifié avec succès.");
    },
    onError: (e) => {
      setPwdMsg(e.message);
      toast.error(e.message);
    },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-[22px] font-bold">Paramètres</h1>
        {saved && <span className="text-[13px] font-medium text-emerald-600">Enregistré</span>}
      </div>
      <p className="mt-2 text-[14px] text-muted-foreground">
        Ces informations s'affichent sur tout le site (contact, footer, boutons WhatsApp).
      </p>

      <div className="mt-6 rounded-2xl border bg-white p-5">
        <div className="space-y-4">
          {FIELDS.map((f) => (
            <label key={f.key} className="block text-[13px] font-medium">
              {f.label}
              <input
                value={values[f.key] ?? ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                placeholder={f.hint}
                className="mt-1.5 h-12 w-full rounded-xl border px-4 text-[15px] outline-none focus:border-brand-blue-700/40"
              />
            </label>
          ))}
          <fieldset className="rounded-xl border p-4">
            <legend className="px-1 text-[13px] font-medium">Horaires d'ouverture</legend>
            <p className="text-[12px] font-normal text-muted-foreground">
              Sélectionnez les jours d’ouverture, puis définissez les mêmes heures pour ces jours.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {WEEK_DAYS.map((day) => (
                <label key={day.id} className="flex items-center gap-2 text-[13px] font-medium">
                  <input
                    type="checkbox"
                    checked={hours.days.includes(day.id)}
                    onChange={(event) => {
                      setHours((current) => ({
                        ...current,
                        days: event.target.checked
                          ? [...current.days, day.id]
                          : current.days.filter((selectedDay) => selectedDay !== day.id),
                      }));
                    }}
                    className="h-4 w-4 accent-[#06162d]"
                  />
                  {day.label}
                </label>
              ))}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-[13px] font-medium">
                Heure d'ouverture
                <input
                  type="time"
                  value={hours.opensAt}
                  onChange={(event) => setHours({ ...hours, opensAt: event.target.value })}
                  className="mt-1.5 h-12 w-full rounded-xl border bg-white px-4 text-[15px] outline-none focus:border-brand-blue-700/40"
                />
              </label>
              <label className="block text-[13px] font-medium">
                Heure de fermeture
                <input
                  type="time"
                  value={hours.closesAt}
                  onChange={(event) => setHours({ ...hours, closesAt: event.target.value })}
                  className="mt-1.5 h-12 w-full rounded-xl border bg-white px-4 text-[15px] outline-none focus:border-brand-blue-700/40"
                />
              </label>
            </div>
          </fieldset>
        </div>
        <button
          onClick={() => {
            setSettingsError("");
            save.mutate({
              ...values,
              hours: serializeOpeningHours(hours),
            });
          }}
          disabled={save.isPending}
          className="mt-6 h-[52px] w-full rounded-full bg-brand-blue-700 text-[15px] font-semibold text-white disabled:opacity-60 md:w-auto md:px-10"
        >
          Enregistrer
        </button>
        {settingsError && <p role="alert" className="mt-3 text-[13px] text-red-600">{settingsError}</p>}
      </div>

      <div className="mt-6 rounded-2xl border bg-white p-5">
        <h2 className="font-display text-[16px] font-semibold text-red-700">Sécurité</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Le changement de mot de passe est une action sensible.
        </p>
        <div className="mt-4 space-y-4">
          <label className="block text-[13px] font-medium">
            Mot de passe actuel
            <span className="relative mt-1.5 block">
              <input
                type={showCurrentPassword ? "text" : "password"}
                value={pwd.current}
                onChange={(e) => setPwd({ ...pwd, current: e.target.value })}
                autoComplete="current-password"
                className="h-12 w-full rounded-xl border px-4 pr-12 text-[15px] outline-none focus:border-brand-blue-700/40"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword((visible) => !visible)}
                aria-label={showCurrentPassword ? "Masquer le mot de passe actuel" : "Afficher le mot de passe actuel"}
                className="absolute inset-y-0 right-2 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>
          <label className="block text-[13px] font-medium">
            Nouveau mot de passe (8 caractères min.)
            <span className="relative mt-1.5 block">
              <input
                type={showNextPassword ? "text" : "password"}
                value={pwd.next}
                onChange={(e) => setPwd({ ...pwd, next: e.target.value })}
                autoComplete="new-password"
                className="h-12 w-full rounded-xl border px-4 pr-12 text-[15px] outline-none focus:border-brand-blue-700/40"
              />
              <button
                type="button"
                onClick={() => setShowNextPassword((visible) => !visible)}
                aria-label={showNextPassword ? "Masquer le nouveau mot de passe" : "Afficher le nouveau mot de passe"}
                className="absolute inset-y-0 right-2 flex w-9 items-center justify-center text-muted-foreground hover:text-foreground"
              >
                {showNextPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </span>
          </label>
          {pwdMsg && <p role="status" className="text-[13px] text-muted-foreground">{pwdMsg}</p>}
          <button
            onClick={() => changePassword.mutate(pwd)}
            disabled={changePassword.isPending || pwd.next.length < 8}
            className="h-12 rounded-full bg-red-600 px-6 text-[14px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            Changer le mot de passe
          </button>
        </div>
      </div>
    </div>
  );
}
