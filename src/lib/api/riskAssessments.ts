import { apiFetch } from "./client";
import { normalizeRateForecast, normalizeRateHistory, normalizeRiskAssessment } from "./normalize";
import type { RateForecastResponse, RateHistoryResponse, RiskAssessmentResponse } from "./types";

/** 환율 리스크 진단 실행 — 요청 바디 없음. settlement_id로 해당 정산건 정보를 조회해 AI 서비스를 호출합니다. */
export async function createRiskAssessment(settlementId: number): Promise<RiskAssessmentResponse> {
  const raw = await apiFetch<RiskAssessmentResponse>("/api/v1/settlement-items/{settlement_id}/risk-assessment", {
    method: "POST",
    pathParams: { settlement_id: settlementId },
  });
  return normalizeRiskAssessment(raw);
}

/** 스펙상 `Authorization: Bearer ...` 헤더가 명시된 유일한 엔드포인트입니다. */
export async function getRiskAssessment(assessmentId: number): Promise<RiskAssessmentResponse> {
  const raw = await apiFetch<RiskAssessmentResponse>("/api/v1/risk-assessments/{assessmentId}", {
    pathParams: { assessmentId },
  });
  return normalizeRiskAssessment(raw);
}

/** 해당 정산건의 가장 최근 진단 결과 1건. */
export async function getLatestRiskAssessmentForSettlement(settlementId: number): Promise<RiskAssessmentResponse> {
  const raw = await apiFetch<RiskAssessmentResponse>("/api/v1/settlement-items/{settlement_id}/risk-assessment", {
    pathParams: { settlement_id: settlementId },
  });
  return normalizeRiskAssessment(raw);
}

/** 최근 환율 추이(기본 180일 = 약 6개월). server 기본값을 그대로 사용한다.
 * 과거 시계열이라 미래 예측 화면(결과 페이지)에서는 더 이상 호출하지 않는다 —
 * 다른 화면에서 쓸 수 있어 함수 자체는 남겨둔다. */
export async function getRateHistory(settlementId: number, days?: number): Promise<RateHistoryResponse> {
  const raw = await apiFetch<RateHistoryResponse>("/api/v1/settlement-items/{settlement_id}/rate-history", {
    pathParams: { settlement_id: settlementId },
    query: days !== undefined ? { days } : undefined,
  });
  return normalizeRateHistory(raw);
}

/** 미래 환율 예측(D+1~D+90, USD/KRW 고정) — `types.ts`의 RateForecastResponse 참고.
 * 정산건 통화가 USD가 아니거나 해당 정산건이 없으면 404, fx-chronos가 응답하지
 * 않으면 502가 난다. 호출부(result 페이지)가 상태 코드별로 안내 문구를 구분한다. */
export async function getExchangeRateForecast(settlementId: number): Promise<RateForecastResponse> {
  const raw = await apiFetch<RateForecastResponse>("/api/v1/settlement-items/{settlement_id}/rate-forecast", {
    pathParams: { settlement_id: settlementId },
  });
  return normalizeRateForecast(raw);
}
