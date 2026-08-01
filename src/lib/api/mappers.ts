import type { CompanyInfo, ContractInfo, CreditRating, PaymentSchedule } from "@/lib/types";
import type {
  ApiBusinessType,
  ApiContractType,
  ContractRequest,
  ProfileRequest,
  SettlementItemRequest,
} from "./types";

const CREDIT_GRADE_MAP: Record<CreditRating, string | null> = {
  A_PLUS: "A",
  BBB: "BBB",
  BB_MINUS: "BB",
  UNKNOWN: null,
};

/** Builds the profile creation/update request from the company + (single) transaction country. */
export function toProfileRequest(company: CompanyInfo, counterpartCountries: string[]): ProfileRequest {
  return {
    business_name: company.businessName,
    email: company.email,
    phone: company.phone,
    business_type: company.companyType.toUpperCase() as ApiBusinessType,
    annual_export_amount: company.exportRevenueUsd,
    annual_import_amount: company.importRevenueUsd,
    annual_revenue: company.annualRevenueKrw ?? 0,
    operating_profit: company.operatingProfitKrw ?? 0,
    credit_grade: company.creditRating ? CREDIT_GRADE_MAP[company.creditRating] : null,
    counterpart_countries: counterpartCountries,
  };
}

function toSettlementItemRequest(schedule: PaymentSchedule): SettlementItemRequest {
  return {
    amount: schedule.amount ?? 0,
    currency: schedule.currency,
    price_fix_date: schedule.priceFixDate,
    settlement_date: schedule.dueDate,
    is_payment_adjustable: schedule.dueDateAdjustable,
    bep_rate: schedule.bep,
  };
}

/** Builds the contract creation/update request, including all payment schedules as settlement_items. */
export function toContractRequest(profileId: number, contract: ContractInfo): ContractRequest {
  return {
    profile_id: profileId,
    contract_type: contract.contractType.toUpperCase() as ApiContractType,
    payment_term: contract.settlementMethod,
    counterparty_country: contract.countryCode,
    advance_settled_amount: null,
    netting_offset_amount: null,
    settlement_items: contract.paymentSchedules.map(toSettlementItemRequest),
  };
}
