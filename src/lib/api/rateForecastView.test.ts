import { describe, expect, it } from "vitest";
import { buildForecastView, type ForecastViewContext } from "./rateForecastView";
import type { RateForecastResponse } from "./types";

// Fixed "today" for deterministic tests — KST-midnight-pinned, matching how
// todayKst()/addDays() represent calendar days elsewhere in the project.
const TODAY = new Date("2026-08-03T00:00:00Z");

function iso(offsetDays: number): string {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() + offsetDays);
  return d.toISOString().slice(0, 10);
}

function point(offsetDays: number, overrides: Partial<RateForecastResponse["forecast"][number]> = {}) {
  return {
    date: iso(offsetDays),
    point: 1400,
    lower: 1380,
    median: 1400,
    upper: 1420,
    ...overrides,
  };
}

const baseResponse: RateForecastResponse = {
  settlement_id: 1,
  currency_pair: "USD/KRW",
  forecast_origin: iso(0),
  horizon: 90,
  unit: "KRW per USD",
  model_name: "shrunk_ensemble",
  generated_at: "2026-08-03T03:00:00+09:00",
  forecast: [],
  warnings: [],
};

const noContext: ForecastViewContext = { referenceRate: null, bepRate: null };

describe("buildForecastView — D+1~D+90 filtering", () => {
  it("includes D+1", () => {
    const view = buildForecastView({ ...baseResponse, forecast: [point(1)] }, noContext, TODAY);
    expect(view.points).toHaveLength(1);
    expect(view.points[0].dDay).toBe(1);
    expect(view.points[0].dDayLabel).toBe("D+1");
  });

  it("excludes D+0 (today)", () => {
    const view = buildForecastView({ ...baseResponse, forecast: [point(0)] }, noContext, TODAY);
    expect(view.points).toHaveLength(0);
  });

  it("includes D+90", () => {
    const view = buildForecastView({ ...baseResponse, forecast: [point(90)] }, noContext, TODAY);
    expect(view.points).toHaveLength(1);
    expect(view.points[0].dDay).toBe(90);
  });

  it("excludes D+91 and beyond", () => {
    const view = buildForecastView({ ...baseResponse, forecast: [point(91), point(120)] }, noContext, TODAY);
    expect(view.points).toHaveLength(0);
  });

  it("excludes past dates (D-1 etc.) — historical rates never leak into the forecast view", () => {
    const view = buildForecastView({ ...baseResponse, forecast: [point(-1), point(-30)] }, noContext, TODAY);
    expect(view.points).toHaveLength(0);
  });

  it("sorts the surviving points by date ascending regardless of input order", () => {
    const view = buildForecastView({ ...baseResponse, forecast: [point(5), point(1), point(90)] }, noContext, TODAY);
    expect(view.points.map((p) => p.dDay)).toEqual([1, 5, 90]);
  });

  it("keeps the first occurrence when the same date repeats, ignoring the rest", () => {
    const view = buildForecastView(
      { ...baseResponse, forecast: [point(1, { point: 1400 }), point(1, { point: 9999 })] },
      noContext,
      TODAY,
    );
    expect(view.points).toHaveLength(1);
    expect(view.points[0].pointRate).toBe(1400);
  });

  it("safely skips a point with an unparseable date instead of throwing", () => {
    const view = buildForecastView(
      { ...baseResponse, forecast: [{ date: "not-a-date", point: 1400, lower: 1380, median: 1400, upper: 1420 }, point(1)] },
      noContext,
      TODAY,
    );
    expect(view.points).toHaveLength(1);
    expect(view.points[0].dDay).toBe(1);
  });
});

describe("buildForecastView — bounds and reference values", () => {
  it("always has a band — the real API guarantees lower/median/upper alongside point", () => {
    const view = buildForecastView({ ...baseResponse, forecast: [point(1, { lower: 1380, upper: 1420 })] }, noContext, TODAY);
    expect(view.points[0].hasBand).toBe(true);
    expect(view.points[0].lowerRate).toBe(1380);
    expect(view.points[0].upperRate).toBe(1420);
  });

  it("computes referenceDiff from the caller-supplied referenceRate without inventing one", () => {
    const view = buildForecastView(
      { ...baseResponse, forecast: [point(1, { point: 1420 })] },
      { referenceRate: 1400, bepRate: null },
      TODAY,
    );
    expect(view.points[0].referenceDiff).toBe(20);
  });

  it("leaves referenceDiff null when the caller has no referenceRate (not the response's job to supply one)", () => {
    const view = buildForecastView({ ...baseResponse, forecast: [point(1)] }, noContext, TODAY);
    expect(view.points[0].referenceDiff).toBeNull();
  });

  it("passes through top-level fields (forecastOrigin/modelName/warnings) unchanged", () => {
    const view = buildForecastView(
      { ...baseResponse, warnings: ["Chronos 분위수는 참고용 시나리오입니다."] },
      noContext,
      TODAY,
    );
    expect(view.forecastOrigin).toBe(baseResponse.forecast_origin);
    expect(view.modelName).toBe("shrunk_ensemble");
    expect(view.warnings).toEqual(["Chronos 분위수는 참고용 시나리오입니다."]);
  });

  it("passes referenceRate/bepRate through from the caller-supplied context, not the response", () => {
    const view = buildForecastView({ ...baseResponse, forecast: [point(1)] }, { referenceRate: 1441.1, bepRate: 1320 }, TODAY);
    expect(view.referenceRate).toBe(1441.1);
    expect(view.bepRate).toBe(1320);
  });

  it("returns an empty points array (not fabricated data) when forecast is empty", () => {
    const view = buildForecastView({ ...baseResponse, forecast: [] }, noContext, TODAY);
    expect(view.points).toEqual([]);
  });
});
