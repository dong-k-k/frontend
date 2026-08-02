import { describe, expect, it } from "vitest";
import { formatOrDash, formatSignedKrw, scenarioLabel } from "./risk";

describe("formatOrDash", () => {
  it("formats a present value", () => {
    expect(formatOrDash(1.5, (v) => `${v}%`)).toBe("1.5%");
  });

  it("shows '-' for null or undefined without calling the formatter", () => {
    expect(formatOrDash(null, (v: number) => `${v}%`)).toBe("-");
    expect(formatOrDash(undefined, (v: number) => `${v}%`)).toBe("-");
  });

  it("still formats a real zero (not treated as missing)", () => {
    expect(formatOrDash(0, (v) => `${v}%`)).toBe("0%");
  });
});

describe("scenarioLabel", () => {
  it("labels the zero scenario as 변동없음", () => {
    expect(scenarioLabel(0)).toBe("변동없음");
  });

  it("prefixes positive scenarios with +", () => {
    expect(scenarioLabel(5)).toBe("+5%");
  });

  it("keeps the negative sign for negative scenarios", () => {
    expect(scenarioLabel(-10)).toBe("-10%");
  });
});

describe("formatSignedKrw", () => {
  it("prefixes positive amounts with +", () => {
    expect(formatSignedKrw(81000000)).toBe("+81,000,000");
  });

  it("keeps the sign for negative amounts", () => {
    expect(formatSignedKrw(-54000000)).toBe("-54,000,000");
  });

  it("shows no sign for zero", () => {
    expect(formatSignedKrw(0)).toBe("0");
  });
});
