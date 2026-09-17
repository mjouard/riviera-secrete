import type { Lieu } from "../types";
import {
  dureeKeyDepuisBadge,
  generateItineraire,
  construirePlanning,
} from "../itineraire-logic";

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function makeLieu(slug: string, lat: number, lng: number, dureeMin = 60): Lieu {
  return {
    id: Math.random(),
    slug,
    nom: slug,
    nomEn: null,
    description: "",
    descriptionEn: null,
    description2En: null,
    commune: "Test",
    regionSlug: "nice",
    regionLabel: "Nice",
    villeSlug: "nice",
    lat,
    lng,
    heroImage: "",
    heroAlt: "",
    thumbImage: "",
    badges: [],
    tags: [],
    metaPills: [{ label: "Durée", valeur: `${dureeMin} min`, labelEn: null, valeurEn: null }],
    tips: [],
    related: [],
    activites: [],
  };
}

// ---------------------------------------------------------------------------
// dureeKeyDepuisBadge
// ---------------------------------------------------------------------------

describe("dureeKeyDepuisBadge", () => {
  it('"6 étapes · 2 jours" → "2-jours"', () => {
    expect(dureeKeyDepuisBadge("6 étapes · 2 jours")).toBe("2-jours");
  });

  it('"3 étapes · 3 jours" → "3-jours"', () => {
    expect(dureeKeyDepuisBadge("3 étapes · 3 jours")).toBe("3-jours");
  });

  it('"Demi-journée · 4 étapes" → "demi-journee"', () => {
    expect(dureeKeyDepuisBadge("Demi-journée · 4 étapes")).toBe("demi-journee");
  });

  it('"Journée complète" → "journee"', () => {
    expect(dureeKeyDepuisBadge("Journée complète")).toBe("journee");
  });

  it('"random text" → "journee" (fallback)', () => {
    expect(dureeKeyDepuisBadge("random text")).toBe("journee");
  });
});

// ---------------------------------------------------------------------------
// generateItineraire
// ---------------------------------------------------------------------------

describe("generateItineraire", () => {
  it("empty candidates → { days: [], excluded: [] }", () => {
    const result = generateItineraire([], "journee");
    expect(result).toEqual({ days: [], excluded: [] });
  });

  it("3 close lieux with journee → all 3 in days, excluded is empty", () => {
    // Very close together so transit (~13 min each) + visit (60 min each) = ~206 min total
    // Fits in journee budget (480 - 75 lunch = 405 min)
    const lieux = [
      makeLieu("a", 43.70, 7.25, 60),
      makeLieu("b", 43.71, 7.26, 60),
      makeLieu("c", 43.72, 7.27, 60),
    ];
    const result = generateItineraire(lieux, "journee");
    const all = result.days.flat();
    expect(all.length).toBe(3);
    expect(result.excluded.length).toBe(0);
  });

  it("garderTous: true forces all lieux into days even when they overflow the budget", () => {
    // 4 lieux × 200 min each — way over the 405-min journee budget
    const lieux = [
      makeLieu("a", 43.70, 7.25, 200),
      makeLieu("b", 43.71, 7.26, 200),
      makeLieu("c", 43.72, 7.27, 200),
      makeLieu("d", 43.73, 7.28, 200),
    ];
    const result = generateItineraire(lieux, "journee", { garderTous: true });
    const all = result.days.flat();
    expect(all.length).toBe(4);
    expect(result.excluded.length).toBe(0);
  });

  it("2-day trip with 6 lieux (60 min each) → days.length === 2 and excluded is empty", () => {
    // 3 lieux per day; budget per day = 480 - 75 = 405 min; 3×60 + 2×~13 ≈ 206 min → fits
    const lieux = [
      makeLieu("a", 43.70, 7.25, 60),
      makeLieu("b", 43.71, 7.26, 60),
      makeLieu("c", 43.72, 7.27, 60),
      makeLieu("d", 43.73, 7.28, 60),
      makeLieu("e", 43.74, 7.29, 60),
      makeLieu("f", 43.75, 7.30, 60),
    ];
    const result = generateItineraire(lieux, "2-jours");
    expect(result.days.length).toBe(2);
    expect(result.excluded.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// construirePlanning
// ---------------------------------------------------------------------------

describe("construirePlanning", () => {
  it("empty days → { elements: [], journees: [] }", () => {
    const result = construirePlanning([], "journee");
    expect(result).toEqual({ elements: [], journees: [] });
  });

  it("1 day, 1 lieu → exactly one stop element and one journee entry", () => {
    const lieu = makeLieu("a", 43.70, 7.25, 60);
    const result = construirePlanning([[lieu]], "journee");
    const stops = result.elements.filter((e) => e.type === "stop");
    expect(stops.length).toBe(1);
    expect(result.journees.length).toBe(1);
  });

  it("1 day, 2 lieux → 2 stops, 1 transit between them (transit precedes second stop)", () => {
    const a = makeLieu("a", 43.70, 7.25, 60);
    const b = makeLieu("b", 43.71, 7.26, 60);
    // demi-journee has no lunch break, keeping elements simpler
    const result = construirePlanning([[a, b]], "demi-journee");
    const types = result.elements.map((e) => e.type);
    // Expected sequence: stop, transit, stop
    expect(types.filter((t) => t === "stop").length).toBe(2);
    expect(types.filter((t) => t === "transit").length).toBe(1);
    // The transit must appear before the second stop
    const firstTransitIdx = types.indexOf("transit");
    const lastStopIdx = types.lastIndexOf("stop");
    expect(firstTransitIdx).toBeLessThan(lastStopIdx);
  });
});
