import { apiFetch } from "./client";
import type { StrategyRecommendationRequest, StrategyRecommendationResponse } from "./types";

export function createStrategyRecommendation(
  body: StrategyRecommendationRequest,
): Promise<StrategyRecommendationResponse> {
  return apiFetch<StrategyRecommendationResponse>("/api/v1/strategy-recommendations", {
    method: "POST",
    body,
  });
}

/**
 * API 명세서 CSV에는 이 엔드포인트만 `/api/v1/stragey-recommendations/...`(t 누락)로
 * 적혀 있었지만, 백엔드 저장소 README와 실제 서버 응답(오탈자 경로는 404, 정상 철자는
 * 라우트가 존재함을 나타내는 404 "Recommendation not found")으로 정확한 철자가 맞음을 확인했습니다.
 */
export function getStrategyRecommendation(
  recommendationId: number,
): Promise<StrategyRecommendationResponse> {
  return apiFetch<StrategyRecommendationResponse>("/api/v1/strategy-recommendations/{recommendationId}", {
    pathParams: { recommendationId },
  });
}

/** 리포트 PDF 다운로드 — 바이너리(Blob) 응답. */
export function downloadStrategyReport(recommendationId: number): Promise<Blob> {
  return apiFetch<Blob>("/api/v1/strategy-recommendations/{recommendationId}/report", {
    pathParams: { recommendationId },
    responseType: "blob",
  });
}
