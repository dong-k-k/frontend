"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { PillOptions } from "@/components/ui/OptionCards";
import type { ForecastChartPoint, ForecastView } from "@/lib/api/rateForecastView";
import { formatOrDash, formatNumber } from "@/lib/risk";

type ViewMode = "chart" | "table";
/**
 * 서버가 실제로 구분해 내려주는 상황별로 문구를 다르게 보여준다 — 과거 환율로
 * 대체하지 않는다(app/risk/router.py 기준):
 * - not_generated: 404 — 이 정산건은 예측 대상이 아님(통화가 USD가 아니거나 정산건 없음)
 * - upstream_unavailable: 502 — dongkk-server는 정상이지만 fx-chronos가 응답하지 않음
 * - temporarily_unavailable: 503/504 — 인프라 단의 일시적 장애/타임아웃
 * - unavailable: 그 외(네트워크 실패, 500 등)
 */
type ForecastStatus =
  | "loading"
  | "not_generated"
  | "upstream_unavailable"
  | "temporarily_unavailable"
  | "unavailable"
  | "ready";

const VIEW_MODE_OPTIONS: { value: ViewMode; label: string }[] = [
  { value: "chart", label: "그래프로 보기" },
  { value: "table", label: "표로 보기" },
];

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: ForecastChartPoint }[] }) {
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-border-soft bg-surface px-3 py-2 text-[11.5px] shadow-sm">
      <div className="font-bold text-ink">
        {p.dateLabel} ({p.dDayLabel})
      </div>
      <div className="text-ink-soft">중앙 예측 {formatNumber(p.pointRate, 2)}원</div>
      {p.hasBand && (
        <div className="text-muted">
          예측구간 {formatNumber(p.lowerRate ?? 0, 2)} ~ {formatNumber(p.upperRate ?? 0, 2)}원
        </div>
      )}
    </div>
  );
}

export function ExchangeRateForecastCard({
  view,
  status,
  errorDetail,
}: {
  view: ForecastView | null;
  status: ForecastStatus;
  /** 서버가 실제로 응답한 오류 사유(예: "현재 환율 예측은 USD만 지원합니다: EUR",
   * "환율 예측 서비스(fx-chronos)에서 응답을 받지 못했습니다") — 있으면 그대로 덧붙인다. */
  errorDetail?: string | null;
}) {
  const [mode, setMode] = useState<ViewMode>("chart");
  const hasData = Boolean(view && view.points.length > 0);

  // Recharts로 "구간(band)"을 그리는 표준 방법 — 보이지 않는 Area(lower)를 깔고
  // 그 위에 (upper-lower) 높이만큼 stack된 Area를 그린다. hasBand가 없는 포인트는
  // undefined를 넣어 그 구간만 자연스럽게 끊기게 한다(값을 지어내지 않음).
  const chartData = useMemo(() => {
    if (!view) return [];
    return view.points.map((p) => ({
      ...p,
      bandBase: p.hasBand ? p.lowerRate! : undefined,
      bandRange: p.hasBand ? p.upperRate! - p.lowerRate! : undefined,
    }));
  }, [view]);

  // Recharts의 stacked Area는 기본적으로 0을 포함하는 축 범위를 강제해, 실제
  // 환율대(예: 1,400원대)가 차트 위쪽에 눌려 보이는 문제가 생긴다. 실제 데이터
  // (중앙 예측·하한·상한·기준환율·BEP)의 최솟값~최댓값을 직접 계산해 여백만
  // 적절히 두는 축 범위를 명시한다 — 값 자체를 지어내지 않고 실제 값들의
  // min/max만 사용한다.
  const yDomain = useMemo((): [number, number] | undefined => {
    if (!view || view.points.length === 0) return undefined;
    const values: number[] = [];
    for (const p of view.points) {
      values.push(p.pointRate);
      if (p.lowerRate !== null) values.push(p.lowerRate);
      if (p.upperRate !== null) values.push(p.upperRate);
    }
    if (view.referenceRate !== null) values.push(view.referenceRate);
    if (view.bepRate !== null) values.push(view.bepRate);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = Math.max((max - min) * 0.1, 1);
    return [Math.floor(min - padding), Math.ceil(max + padding)];
  }, [view]);

  return (
    <div className="rounded-xl border border-border-soft p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[12.5px] font-bold text-ink-soft">미래 환율 예측 (D+1~D+90)</div>
        {hasData && <PillOptions options={VIEW_MODE_OPTIONS} value={mode} onChange={setMode} />}
      </div>

      {status === "loading" && (
        <div className="py-10 text-center text-[12px] text-muted">미래 환율 예측을 불러오는 중입니다...</div>
      )}

      {status === "not_generated" && (
        <div className="py-10 text-center text-[12px] text-muted">
          이 결제 건은 미래 환율 예측 대상이 아닙니다.
          {errorDetail && <div className="mt-1 text-muted">({errorDetail})</div>}
        </div>
      )}

      {status === "upstream_unavailable" && (
        <div className="py-10 text-center text-[12px] text-danger">
          환율 예측 서비스가 일시적으로 응답하지 않습니다.
          {errorDetail && <div className="mt-1 text-muted">({errorDetail})</div>}
        </div>
      )}

      {status === "temporarily_unavailable" && (
        <div className="py-10 text-center text-[12px] text-danger">
          환율 예측 서비스에 일시적으로 연결할 수 없습니다. 잠시 후 다시 시도해주세요.
        </div>
      )}

      {status === "unavailable" && (
        <div className="py-10 text-center text-[12px] text-danger">미래 환율 예측 데이터를 불러올 수 없습니다.</div>
      )}

      {status === "ready" && view && !hasData && (
        <div className="py-10 text-center text-[12px] text-muted">미래 환율 예측 데이터가 아직 생성되지 않았습니다.</div>
      )}

      {status === "ready" && view && hasData && mode === "chart" && (
        <div>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#e7e2d8" strokeDasharray="4" vertical={false} />
                <XAxis
                  dataKey="shortDateLabel"
                  tick={{ fontSize: 10.5, fill: "#898989" }}
                  interval="preserveStartEnd"
                  minTickGap={28}
                  axisLine={{ stroke: "#e7e2d8" }}
                  tickLine={false}
                />
                <YAxis
                  type="number"
                  domain={yDomain ?? ["auto", "auto"]}
                  allowDataOverflow
                  tick={{ fontSize: 10.5, fill: "#898989" }}
                  tickFormatter={(v: number) => formatNumber(v, 0)}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip content={<ChartTooltip />} />
                {view.referenceRate !== null && (
                  <ReferenceLine
                    y={view.referenceRate}
                    stroke="#898989"
                    strokeDasharray="4"
                    strokeWidth={1.2}
                    label={{ value: "기준환율", position: "insideTopLeft", fill: "#898989", fontSize: 10.5 }}
                  />
                )}
                {view.bepRate !== null && (
                  <ReferenceLine
                    y={view.bepRate}
                    stroke="#b23b2e"
                    strokeDasharray="4"
                    strokeWidth={1.5}
                    label={{ value: "BEP", position: "insideBottomLeft", fill: "#b23b2e", fontSize: 10.5 }}
                  />
                )}
                <Area dataKey="bandBase" stackId="band" stroke="none" fill="transparent" isAnimationActive={false} />
                <Area
                  dataKey="bandRange"
                  stackId="band"
                  stroke="none"
                  fill="#ffb400"
                  fillOpacity={0.18}
                  isAnimationActive={false}
                />
                <Line type="monotone" dataKey="pointRate" stroke="#545045" strokeWidth={2.2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10.5px] leading-relaxed text-muted">
            실선: 중앙 예측 환율{chartData.some((p) => p.hasBand) ? " · 음영: 예측 하한~상한 구간" : ""}
            {view.referenceRate !== null && " · 회색 점선: 기준환율"}
            {view.bepRate !== null && " · 빨간 점선: 손익분기환율(BEP)"}
            {view.modelName && ` · 예측 모델: ${view.modelName}`}
          </div>
        </div>
      )}

      {status === "ready" && view && hasData && mode === "table" && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-[11.5px]">
            <thead>
              <tr className="text-muted">
                <th className="px-2 py-1.5 text-left">예측일</th>
                <th className="px-2 py-1.5 text-left">D-Day</th>
                <th className="px-2 py-1.5 text-left">예상 환율</th>
                <th className="px-2 py-1.5 text-left">예측 하한</th>
                <th className="px-2 py-1.5 text-left">예측 상한</th>
                <th className="px-2 py-1.5 text-left">기준환율 대비</th>
              </tr>
            </thead>
            <tbody>
              {view.points.map((p) => (
                <tr key={p.date}>
                  <td className="border-t border-border-soft px-2 py-1.5">{p.dateLabel}</td>
                  <td className="border-t border-border-soft px-2 py-1.5">{p.dDayLabel}</td>
                  <td className="border-t border-border-soft px-2 py-1.5">{formatNumber(p.pointRate, 2)}원</td>
                  <td className="border-t border-border-soft px-2 py-1.5">
                    {formatOrDash(p.lowerRate, (v) => `${formatNumber(v, 2)}원`)}
                  </td>
                  <td className="border-t border-border-soft px-2 py-1.5">
                    {formatOrDash(p.upperRate, (v) => `${formatNumber(v, 2)}원`)}
                  </td>
                  <td className="border-t border-border-soft px-2 py-1.5">
                    {formatOrDash(p.referenceDiff, (v) => `${v > 0 ? "+" : ""}${formatNumber(v, 2)}원`)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {status === "ready" && view && hasData && view.warnings.length > 0 && (
        <div className="mt-2 text-[10.5px] leading-relaxed text-muted">{view.warnings.join(" ")}</div>
      )}
    </div>
  );
}
