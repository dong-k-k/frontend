import { apiFetch } from "./client";
import type { ProductMatchRequest, ProductMatchResponse } from "./types";

export function createProductMatch(body: ProductMatchRequest): Promise<ProductMatchResponse> {
  return apiFetch<ProductMatchResponse>("/api/v1/product-matches", { method: "POST", body });
}

export function getProductMatch(matchId: number): Promise<ProductMatchResponse> {
  return apiFetch<ProductMatchResponse>("/api/v1/product-matches/{matchId}", {
    pathParams: { matchId },
  });
}
