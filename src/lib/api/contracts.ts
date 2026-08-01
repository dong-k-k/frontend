import { apiFetch } from "./client";
import type { ContractRequest, ContractResponse, SettlementItemRequest, SettlementItemResponse } from "./types";

export function createContract(body: ContractRequest): Promise<ContractResponse> {
  return apiFetch<ContractResponse>("/api/v1/contracts", { method: "POST", body });
}

export function listContracts(profileId: number): Promise<ContractResponse[]> {
  return apiFetch<ContractResponse[]>("/api/v1/contracts", { query: { profile_id: profileId } });
}

export function getContract(contractId: number): Promise<ContractResponse> {
  return apiFetch<ContractResponse>("/api/v1/contracts/{contract_id}", {
    pathParams: { contract_id: contractId },
  });
}

/** PUT — 전체 필드 교체입니다. */
export function updateContract(contractId: number, body: ContractRequest): Promise<ContractResponse> {
  return apiFetch<ContractResponse>("/api/v1/contracts/{contract_id}", {
    method: "PUT",
    pathParams: { contract_id: contractId },
    body,
  });
}

export function addSettlementItem(
  contractId: number,
  body: SettlementItemRequest,
): Promise<SettlementItemResponse> {
  return apiFetch<SettlementItemResponse>("/api/v1/contracts/{contract_id}/settlement-items", {
    method: "POST",
    pathParams: { contract_id: contractId },
    body,
  });
}
