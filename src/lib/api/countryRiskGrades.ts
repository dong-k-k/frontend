import { apiFetch } from "./client";
import type { CountryRiskGrade } from "./types";

/** K-SURE 국가위험등급 기반 참조 데이터. 실시간이 아닙니다. */
export function listCountryRiskGrades(): Promise<CountryRiskGrade[]> {
  return apiFetch<CountryRiskGrade[]>("/api/v1/countries");
}
