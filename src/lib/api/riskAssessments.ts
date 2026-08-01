import { apiFetch } from "./client";
import type { RiskAssessmentResponse } from "./types";

/** 환율 리스크 진단 실행 — 요청 바디 없음. settlement_id로 해당 정산건 정보를 조회해 AI 서비스를 호출합니다. */
export function createRiskAssessment(settlementId: number): Promise<RiskAssessmentResponse> {
  return apiFetch<RiskAssessmentResponse>("/api/v1/settlement-items/{settlement_id}/risk-assessment", {
    method: "POST",
    pathParams: { settlement_id: settlementId },
  });
}

/** 스펙상 `Authorization: Bearer ...` 헤더가 명시된 유일한 엔드포인트입니다. */
export function getRiskAssessment(assessmentId: number): Promise<RiskAssessmentResponse> {
  return apiFetch<RiskAssessmentResponse>("/api/v1/risk-assessments/{assessmentId}", {
    pathParams: { assessmentId },
  });
}

/** 해당 정산건의 가장 최근 진단 결과 1건. */
export function getLatestRiskAssessmentForSettlement(settlementId: number): Promise<RiskAssessmentResponse> {
  return apiFetch<RiskAssessmentResponse>("/api/v1/settlement-items/{settlement_id}/risk-assessment", {
    pathParams: { settlement_id: settlementId },
  });
}
