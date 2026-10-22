import { describe, expect, it } from "vitest";
import {
  DEFAULT_OPENING_HOURS,
  formatOpeningHours,
  parseOpeningHours,
  serializeOpeningHours,
} from "../src/lib/opening-hours";

describe("opening hours", () => {
  it("serializes a weekly schedule and displays it on the site", () => {
    const encoded = serializeOpeningHours(DEFAULT_OPENING_HOURS);

    expect(parseOpeningHours(encoded)).toEqual(DEFAULT_OPENING_HOURS);
    expect(formatOpeningHours(encoded)).toBe("Lun, Mar, Mer, Jeu, Ven, Sam : 09:00 – 19:00");
  });

  it("keeps legacy text readable until an admin saves a structured schedule", () => {
    expect(formatOpeningHours("[À CONFIRMER] Lun – Sam : 9h – 19h")).toBe(
      "[À CONFIRMER] Lun – Sam : 9h – 19h",
    );
  });

  it("represents a shop closed for the whole week", () => {
    const encoded = serializeOpeningHours({
      days: [],
      opensAt: "09:00",
      closesAt: "19:00",
    });

    expect(parseOpeningHours(encoded)?.days).toEqual([]);
    expect(formatOpeningHours(encoded)).toBe("Fermé toute la semaine");
  });
});
