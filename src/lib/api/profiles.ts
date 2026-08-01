import { apiFetch } from "./client";
import type { ProfileRequest, ProfileResponse, ProfileSummaryResponse } from "./types";

export function createProfile(body: ProfileRequest): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>("/api/v1/profiles", { method: "POST", body });
}

export function getProfile(profileId: number): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>("/api/v1/profiles/{profileId}", { pathParams: { profileId } });
}

/** PUT — 전체 필드 교체입니다. 부분 수정이 아니므로 항상 전체 바디를 보내야 합니다. */
export function updateProfile(profileId: number, body: ProfileRequest): Promise<ProfileResponse> {
  return apiFetch<ProfileResponse>("/api/v1/profiles/{profileId}", {
    method: "PUT",
    pathParams: { profileId },
    body,
  });
}

/** 세션(진단 흐름) 전체 조회 — 프로필과 각 단계의 최신 결과를 한 번에 반환합니다. */
export function getProfileSummary(profileId: number): Promise<ProfileSummaryResponse> {
  return apiFetch<ProfileSummaryResponse>("/api/v1/profiles/{profileId}/summary", {
    pathParams: { profileId },
  });
}
