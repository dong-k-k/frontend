import { apiFetch } from "./client";
import type { ProductSummary } from "./types";

/** 상품 마스터 목록 조회. `strategyGroup`으로 필터링 가능 (예: FX_HEDGING/EXPORT_LEAD/IMPORT_LEAD/FX_MATCHING). */
export function listProducts(strategyGroup?: string): Promise<ProductSummary[]> {
  return apiFetch<ProductSummary[]>("/api/v1/products", { query: { strategy_group: strategyGroup } });
}
