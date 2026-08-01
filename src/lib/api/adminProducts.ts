import { apiFetch } from "./client";
import type { AdminProductRequest, AdminProductResponse } from "./types";

/** 관리자용 — 상품 마스터 등록. */
export function createAdminProduct(body: AdminProductRequest): Promise<AdminProductResponse> {
  return apiFetch<AdminProductResponse>("/api/v1/admin/products", { method: "POST", body });
}

/** 관리자용 — 상품 마스터 단건 조회 (스펙 라벨은 "목록 조회"이지만 경로는 {id} 단건입니다). */
export function getAdminProduct(id: string): Promise<AdminProductResponse> {
  return apiFetch<AdminProductResponse>("/api/v1/admin/products/{id}", { pathParams: { id } });
}
