import { todayKst } from "@/lib/date";
import { formatDateDots } from "@/lib/risk";
import type { RateForecastResponse } from "./types";

const MIN_OFFSET_DAYS = 1;
const MAX_OFFSET_DAYS = 90;

/** 화면 전용 예측 포인트. 과거 환율(`rate-history`)과는 별개의 데이터 계통이며,
 * 여기 들어오는 값은 전부 `RateForecastResponse.series`(미래 예측)에서만 온다. */
export interface ForecastChartPoint {
  date: string;
  dateLabel: string;
  shortDateLabel: string;
  /** 오늘(KST) 기준 며칠 뒤인지. 1~90 범위만 이 배열에 남는다. */
  dDay: number;
  dDayLabel: string;
  pointRate: number;
  lowerRate: number | null;
  medianRate: number | null;
  upperRate: number | null;
  /** pointRate - referenceRate. referenceRate가 없으면 null(임의 계산 금지). */
  referenceDiff: number | null;
  /** true면 이 날짜는 lower/upper가 둘 다 있어 예측구간 Area를 그릴 수 있다. */
  hasBand: boolean;
}

export interface ForecastView {
  settlementId: number;
  currency: string;
  forecastOrigin: string;
  referenceRate: number | null;
  bepRate: number | null;
  modelName: string | null;
  points: ForecastChartPoint[];
}

/** `date`가 `today` 기준 며칠 뒤인지. 날짜가 유효하지 않으면 null(호출부가 제외). */
function dayOffsetFromToday(dateIso: string, today: Date): number | null {
  const parsed = new Date(`${dateIso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  return Math.round((parsed.getTime() - today.getTime()) / 86_400_000);
}

/**
 * `RateForecastResponse` → 그래프·표가 함께 쓰는 화면 전용 데이터.
 * - KST 오늘(`today` 인자로 테스트 시 주입 가능, 기본값은 실제 `todayKst()`) 기준
 *   D+1~D+90만 남긴다. D+0(오늘)과 D+91 이후는 제외한다.
 * - 파싱할 수 없는 날짜는 안전하게 건너뛴다.
 * - 같은 날짜가 여러 번 오면 먼저 나온 값만 쓴다(서버 응답 원래 순서 기준).
 * - 최종 결과는 날짜 오름차순.
 */
export function buildForecastView(response: RateForecastResponse, today: Date = todayKst()): ForecastView {
  const seen = new Set<string>();
  const points: ForecastChartPoint[] = [];

  for (const raw of response.series) {
    if (seen.has(raw.date)) continue;
    seen.add(raw.date);

    const dDay = dayOffsetFromToday(raw.date, today);
    if (dDay === null || dDay < MIN_OFFSET_DAYS || dDay > MAX_OFFSET_DAYS) continue;

    points.push({
      date: raw.date,
      dateLabel: formatDateDots(raw.date),
      shortDateLabel: raw.date.slice(5).replace("-", "."),
      dDay,
      dDayLabel: `D+${dDay}`,
      pointRate: raw.point_rate,
      lowerRate: raw.lower_rate,
      medianRate: raw.median_rate,
      upperRate: raw.upper_rate,
      referenceDiff: response.reference_rate !== null ? raw.point_rate - response.reference_rate : null,
      hasBand: raw.lower_rate !== null && raw.upper_rate !== null,
    });
  }

  points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  return {
    settlementId: response.settlement_id,
    currency: response.currency,
    forecastOrigin: response.forecast_origin,
    referenceRate: response.reference_rate,
    bepRate: response.bep_rate,
    modelName: response.model_name,
    points,
  };
}
