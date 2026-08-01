import { apiFetch } from "./client";
import type { ConsultationRequestRequest, ConsultationRequestResponse, ApiConsultationStatus } from "./types";

export function createConsultationRequest(
  body: ConsultationRequestRequest,
): Promise<ConsultationRequestResponse> {
  return apiFetch<ConsultationRequestResponse>("/api/v1/consultation-requests", {
    method: "POST",
    body,
  });
}

export function getConsultationRequest(id: number): Promise<ConsultationRequestResponse> {
  return apiFetch<ConsultationRequestResponse>("/api/v1/consultation-requests/{id}", {
    pathParams: { id },
  });
}

/** 허용값: REQUESTED / MATCHING / ASSIGNED / COMPLETED / CANCELLED */
export function updateConsultationStatus(
  id: number,
  status: ApiConsultationStatus,
): Promise<ConsultationRequestResponse> {
  return apiFetch<ConsultationRequestResponse>("/api/v1/consultation-requests/{id}/status", {
    method: "PATCH",
    pathParams: { id },
    body: { status },
  });
}
