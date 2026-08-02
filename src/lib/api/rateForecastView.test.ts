import { describe, expect, it } from "vitest";
import { buildForecastView } from "./rateForecastView";
import type { RateForecastResponse } from "./types";

// Fixed "today" for deterministic tests — KST-midnight-pinned, matching how
// todayKst()/addDays() represent calendar days elsewhere in the project.
const TODAY = new Date("2026-08-03T00:00:00Z");

function iso(offsetDays: number): string {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function point(offsetDays: number, overrides: Partial<RateForecastResponse["series"][number]> = {}) {
  return {
    date: iso(offsetDays),
    point_rate: 1400,
    lower_rate: null,
    median_rate: null,
    upper_rate: null,
    ...overrides,
  };
}

const baseResponse: RateForecastResponse = {
  settlement_id: 1,
  currency: "USD",
  forecast_origin: iso(0),
  reference_rate: 1400,
  bep_rate: 1330,
  model_name: "shrunk_ensemble",
  series: [],
};

describe("buildForecastView — D+1~D+90 filtering", () => {
  it("includes D+1", () => {
    const view = buildForecastView({ ...baseResponse, series: [point(1)] }, TODAY);
    expect(view.points).toHaveLength(1);
    expect(view.points[0].dDay).toBe(1);
    expect(view.points[0].dDayLabel).toBe("D+1");
  });

  it("excludes D+0 (today)", () => {
    const view = buildForecastView({ ...baseResponse, series: [point(0)] }, TODAY);
    expect(view.points).toHaveLength(0);
  });

  it("includes D+90", () => {
    const view = buildForecastView({ ...baseResponse, series: [point(90)] }, TODAY);
    expect(view.points).toHaveLength(1);
    expect(view.points[0].dDay).toBe(90);
  });

  it("excludes D+91 and beyond", () => {
    const view = buildForecastView({ ...baseResponse, series: [point(91), point(120)] }, TODAY);
    expect(view.points).toHaveLength(0);
  });

  it("excludes past dates (D-1 etc.) — historical rates never leak into the forecast view", () => {
    const view = buildForecastView({ ...baseResponse, series: [point(-1), point(-30)] }, TODAY);
    expect(view.points).toHaveLength(0);
  });

  it("sorts the surviving points by date ascending regardless of input order", () => {
    const view = buildForecastView({ ...baseResponse, series: [point(5), point(1), point(90)] }, TODAY);
    expect(view.points.map((p) => p.dDay)).toEqual([1, 5, 90]);
  });

  it("keeps the first occurrence when the same date repeats, ignoring the rest", () => {
    const view = buildForecastView(
      { ...baseResponse, series: [point(1, { point_rate: 1400 }), point(1, { point_rate: 9999 })] },
      TODAY,
    );
    expect(view.points).toHaveLength(1);
    expect(view.points[0].pointRate).toBe(1400);
  });

  it("safely skips a point with an unparseable date instead of throwing", () => {
    const view = buildForecastView(
      { ...baseResponse, series: [{ date: "not-a-date", point_rate: 1400, lower_rate: null, median_rate: null, upper_rate: null }, point(1)] },
      TODAY,
    );
    expect(view.points).toHaveLength(1);
    expect(view.points[0].dDay).toBe(1);
  });
});

describe("buildForecastView — bounds and reference values", () => {
  it("renders points that have no lower/upper at all (point-only forecast)", () => {
    const view = buildForecastView({ ...baseResponse, series: [point(1)] }, TODAY);
    expect(view.points[0].hasBand).toBe(false);
    expect(view.points[0].lowerRate).toBeNull();
    expect(view.points[0].upperRate).toBeNull();
  });

  it("marks hasBand true only when both lower and upper are present", () => {
    const view = buildForecastView(
      { ...baseResponse, series: [point(1, { lower_rate: 1380, upper_rate: 1420 })] },
      TODAY,
    );
    expect(view.points[0].hasBand).toBe(true);
  });

  it("computes referenceDiff from the real reference_rate without inventing one", () => {
    const view = buildForecastView({ ...baseResponse, reference_rate: 1400, series: [point(1, { point_rate: 1420 })] }, TODAY);
    expect(view.points[0].referenceDiff).toBe(20);
  });

  it("leaves referenceDiff null when reference_rate is null", () => {
    const view = buildForecastView({ ...baseResponse, reference_rate: null, series: [point(1)] }, TODAY);
    expect(view.points[0].referenceDiff).toBeNull();
  });

  it("passes through top-level fields (forecastOrigin/bepRate/modelName) unchanged", () => {
    const view = buildForecastView(baseResponse, TODAY);
    expect(view.forecastOrigin).toBe(baseResponse.forecast_origin);
    expect(view.bepRate).toBe(1330);
    expect(view.modelName).toBe("shrunk_ensemble");
  });

  it("returns an empty points array (not fabricated data) when the series is empty", () => {
    const view = buildForecastView({ ...baseResponse, series: [] }, TODAY);
    expect(view.points).toEqual([]);
  });
});
