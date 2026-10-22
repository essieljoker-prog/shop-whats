export const WEEK_DAYS = [
  { id: "monday", label: "Lundi", short: "Lun" },
  { id: "tuesday", label: "Mardi", short: "Mar" },
  { id: "wednesday", label: "Mercredi", short: "Mer" },
  { id: "thursday", label: "Jeudi", short: "Jeu" },
  { id: "friday", label: "Vendredi", short: "Ven" },
  { id: "saturday", label: "Samedi", short: "Sam" },
  { id: "sunday", label: "Dimanche", short: "Dim" },
] as const;

export type WeekDayId = (typeof WEEK_DAYS)[number]["id"];

export type OpeningHours = {
  days: WeekDayId[];
  opensAt: string;
  closesAt: string;
};

export const DEFAULT_OPENING_HOURS: OpeningHours = {
  days: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"],
  opensAt: "09:00",
  closesAt: "19:00",
};

export function parseOpeningHours(value: string | undefined): OpeningHours | null {
  if (!value) return null;

  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return null;

    const schedule = parsed as Partial<OpeningHours>;
    const validDays = Array.isArray(schedule.days)
      ? schedule.days.filter((day): day is WeekDayId =>
          WEEK_DAYS.some((weekDay) => weekDay.id === day),
        )
      : [];
    const validTime = (time: unknown): time is string =>
      typeof time === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

    if (!validTime(schedule.opensAt) || !validTime(schedule.closesAt)) {
      return null;
    }

    return {
      days: [...new Set(validDays)],
      opensAt: schedule.opensAt,
      closesAt: schedule.closesAt,
    };
  } catch {
    return null;
  }
}

export function serializeOpeningHours(schedule: OpeningHours): string {
  return JSON.stringify({
    days: WEEK_DAYS.filter((day) => schedule.days.includes(day.id)).map((day) => day.id),
    opensAt: schedule.opensAt,
    closesAt: schedule.closesAt,
  });
}

export function formatOpeningHours(value: string | undefined): string {
  const schedule = parseOpeningHours(value);
  if (!schedule) return value ?? "";

  const days = WEEK_DAYS.filter((day) => schedule.days.includes(day.id)).map(
    (day) => day.short,
  );
  if (days.length === 0) return "Fermé toute la semaine";
  return `${days.join(", ")} : ${schedule.opensAt} – ${schedule.closesAt}`;
}
