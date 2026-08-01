import { apiFetch } from "./client";
import type { RiskProfileRequest, RiskProfileResponse } from "./types";

/** PUT, per the backend's own README (the API 명세서 CSV incorrectly listed this as POST — confirmed live: POST returns 405). */
export function createRiskProfile(
  settlementId: number,
  body: RiskProfileRequest,
): Promise<RiskProfileResponse> {
  return apiFetch<RiskProfileResponse>("/api/v1/settlement-items/{settlement_id}/risk-profile", {
    method: "PUT",
    pathParams: { settlement_id: settlementId },
    body,
  });
}

export function getRiskProfileForSettlement(settlementId: number): Promise<RiskProfileResponse> {
  return apiFetch<RiskProfileResponse>("/api/v1/settlement-items/{settlement_id}/risk-profile", {
    pathParams: { settlement_id: settlementId },
  });
}

export function getRiskProfile(riskProfileId: number): Promise<RiskProfileResponse> {
  return apiFetch<RiskProfileResponse>("/api/v1/risk-profiles/{risk_profile_id}", {
    pathParams: { risk_profile_id: riskProfileId },
  });
}
