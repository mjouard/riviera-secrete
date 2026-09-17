import { parseDureeTexte, formatDuree, formatTime, parseHeureMinutes } from "../itineraire-format";

describe("parseDureeTexte", () => {
  it('parses "1h30" → 90', () => {
    expect(parseDureeTexte("1h30")).toBe(90);
  });

  it('parses "2h à 4h" → 180 (average of 120 and 240)', () => {
    expect(parseDureeTexte("2h à 4h")).toBe(180);
  });

  it('parses "45 min" → 45', () => {
    expect(parseDureeTexte("45 min")).toBe(45);
  });

  it('parses "20-30 min" → 25 (average of 20 and 30)', () => {
    expect(parseDureeTexte("20-30 min")).toBe(25);
  });

  it('parses "Demi-journée" → 240', () => {
    expect(parseDureeTexte("Demi-journée")).toBe(240);
  });

  it('parses "Journée complète" → 480', () => {
    expect(parseDureeTexte("Journée complète")).toBe(480);
  });

  it('returns null for unrecognisable "bla bla"', () => {
    expect(parseDureeTexte("bla bla")).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseDureeTexte("")).toBeNull();
  });

  it('parses "1 h 30 à 2 h" → 105 (average of 90 and 120)', () => {
    expect(parseDureeTexte("1 h 30 à 2 h")).toBe(105);
  });
});

describe("formatDuree", () => {
  it("45 → '45 min'", () => {
    expect(formatDuree(45)).toBe("45 min");
  });

  it("20 → '20 min'", () => {
    expect(formatDuree(20)).toBe("20 min");
  });

  it("60 → '1 h'", () => {
    expect(formatDuree(60)).toBe("1 h");
  });

  it("90 → '1 h 30'", () => {
    expect(formatDuree(90)).toBe("1 h 30");
  });

  it("120 → '2 h'", () => {
    expect(formatDuree(120)).toBe("2 h");
  });

  it("7 → '5 min' (rounds up to minimum 5)", () => {
    expect(formatDuree(7)).toBe("5 min");
  });

  it("58 → '1 h' (58 min rounds to 60 = 1h)", () => {
    expect(formatDuree(58)).toBe("1 h");
  });
});

describe("formatTime", () => {
  it("540 (9*60) → '09:00'", () => {
    expect(formatTime(540)).toBe("09:00");
  });

  it("570 (9*60+30) → '09:30'", () => {
    expect(formatTime(570)).toBe("09:30");
  });

  it("795 (13*60+15) → '13:15'", () => {
    expect(formatTime(795)).toBe("13:15");
  });

  // 1439 = 23h59 — rounds up to 1440 (midnight) because Math.round(1439/5)=288 → 288*5=1440
  it("1439 (23h59) rounds up to 1440 → '00:00'", () => {
    expect(formatTime(1439)).toBe("00:00");
  });

  // 1437 = 23h57 — rounds down to 1435 (23h55) because Math.round(1437/5)=287 → 287*5=1435
  it("1437 (23h57) → '23:55' (rounds down to nearest 5)", () => {
    expect(formatTime(1437)).toBe("23:55");
  });
});

describe("parseHeureMinutes", () => {
  it('"08:30" → 510', () => {
    expect(parseHeureMinutes("08:30")).toBe(510);
  });

  it('"9:00" → 540', () => {
    expect(parseHeureMinutes("9:00")).toBe(540);
  });

  it('"23:59" → 1439', () => {
    expect(parseHeureMinutes("23:59")).toBe(1439);
  });

  it('"24:00" → null (h > 23)', () => {
    expect(parseHeureMinutes("24:00")).toBeNull();
  });

  it('"" → null', () => {
    expect(parseHeureMinutes("")).toBeNull();
  });

  it('"abc" → null', () => {
    expect(parseHeureMinutes("abc")).toBeNull();
  });

  it('"9:0" → null (single digit minutes does not match \\d{2})', () => {
    expect(parseHeureMinutes("9:0")).toBeNull();
  });
});
