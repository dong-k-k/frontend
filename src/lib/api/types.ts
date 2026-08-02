/**
 * Wire types for the FX Mate backend API (API 명세서 기준, 2026-08 개정판).
 * Field names mirror the spec's JSON bodies exactly (snake_case) — this is
 * intentional so a diff against the spec stays easy, even though the rest
 * of the codebase (in `@/lib/types`) uses camelCase for local UI state.
 */

export type ApiBusinessType = "EXPORT" | "IMPORT" | "BOTH";
export type ApiCreditGrade = string;

export interface ProfileRequest {
  business_name: string;
  email: string;
  phone: string;
  business_type: ApiBusinessType;
  annual_export_amount: number | null;
  annual_import_amount: number | null;
  annual_revenue: number;
  operating_profit: number;
  credit_grade: ApiCreditGrade | null;
  counterpart_countries: string[];
}

export interface ProfileResponse extends ProfileRequest {
  profile_id: number;
}

export type ApiContractType = "EXPORT" | "IMPORT";
export type ApiPaymentTerm = "TT" | "LC" | "DA" | "DP";

export interface SettlementItemRequest {
  amount: number;
  currency: string;
  price_fix_date: string;
  settlement_date: string;
  is_payment_adjustable: boolean;
  bep_rate: number | null;
}

export interface SettlementItemResponse extends SettlementItemRequest {
  settlement_id: number;
  contract_id: number;
}

export interface ContractRequest {
  profile_id: number;
  contract_type: ApiContractType;
  payment_term: ApiPaymentTerm;
  /**
   * Required by the live server even though the API 명세서 CSV doesn't list it —
   * confirmed via a 422 validation error ("Field required") when omitted.
   */
  counterparty_country: string;
  advance_settled_amount: number | null;
  netting_offset_amount: number | null;
  settlement_items: SettlementItemRequest[];
}

export interface ContractResponse {
  contract_id: number;
  profile_id: number;
  contract_type: ApiContractType;
  payment_term: ApiPaymentTerm;
  counterparty_country?: string;
  settlement_items?: SettlementItemResponse[];
}

export type ApiRiskGrade = "LOW" | "MEDIUM" | "HIGH";
export type ApiDataConfidence = "LOW" | "MEDIUM" | "HIGH";

export interface RiskScenario {
  scenario_pct: number;
  projected_rate: number;
  export_pl_krw: number;
  import_pl_krw: number;
  remark: string | null;
}

export interface RiskAssessmentResponse {
  assessment_id: number;
  settlement_id: number;
  net_exposure: number;
  holding_days: number;
  current_rate: number;
  contract_rate: number;
  valuation_pl: number;
  es_pct: number;
  expected_max_loss: number;
  /** server schema: `Decimal | None` — null when the settlement item has no bep_rate. */
  bep_gap: number | null;
  /** server schema: `Decimal | None` — null when the settlement item has no bep_rate. */
  bep_safety_margin_pct: number | null;
  risk_grade: ApiRiskGrade;
  recommended_action: string;
  data_confidence: ApiDataConfidence;
  created_at: string;
  scenarios: RiskScenario[];
}

/** `GET /api/v1/settlement-items/{settlement_id}/rate-history` (app/risk/schemas.py::RatePoint). */
export interface RatePoint {
  date: string;
  rate: number;
}

/** `GET /api/v1/settlement-items/{settlement_id}/rate-history` (app/risk/schemas.py::RateHistoryResponse). */
export interface RateHistoryResponse {
  settlement_id: number;
  currency: string;
  bep_rate: number | null;
  confidence_band_pct: number | null;
  source: string;
  as_of: string;
  series: RatePoint[];
}

/**
 * [구현 예정] 미래 환율 예측 — dongkk-server에 아직 이 API가 없다(app/ 전체에
 * "forecast" 문자열 grep 0건, 2026-08-03 재확인). 아래는 dongkk-ai/fx-chronos의
 * 실제 필드를 기준으로 설계한 목표 DTO다:
 *
 *   fx-chronos ForecastScenario(fx-chronos/src/forecast_provider.py:46-61)의
 *   forecast_dates/point_forecast/lower_scenario/median_scenario/upper_scenario
 *   (모두 날짜 개수만큼의 병렬 배열)를, dongkk-server가 이미 쓰는
 *   RateHistoryResponse.series 패턴과 동일하게 "날짜별 객체 배열"로 바꾼 형태.
 *
 * 실제 엔드포인트가 생기기 전까지 이 타입은 목표 계약일 뿐이며, 지어낸 값을
 * 채우는 데 쓰지 않는다(7절 — 빈 상태로 처리).
 */
export interface ForecastPoint {
  date: string;
  /** fx-chronos point_forecast(앙상블 점 예측) — "중앙 예측 환율"로 표시. */
  point_rate: number;
  /** fx-chronos lower_scenario. 분위수 예측이 없는 실행에서는 null. */
  lower_rate: number | null;
  /** fx-chronos median_scenario. 현재 화면에서는 그래프·표에 그리지 않고 타입에만 보존. */
  median_rate: number | null;
  /** fx-chronos upper_scenario. 분위수 예측이 없는 실행에서는 null. */
  upper_rate: number | null;
}

/** [구현 예정] `GET /api/v1/settlement-items/{settlement_id}/rate-forecast` (목표 경로 — 아직 서버에 없음). */
export interface RateForecastResponse {
  settlement_id: number;
  currency: string;
  /** fx-chronos forecast_origin — 이 예측이 만들어진 기준일. */
  forecast_origin: string;
  /** "기준환율" — forecast_origin 시점의 환율. 서버가 못 채우면 null. */
  reference_rate: number | null;
  /** "손익분기환율" — settlement_item.bep_rate. */
  bep_rate: number | null;
  model_name: string | null;
  series: ForecastPoint[];
}

export interface RiskProfileRequest {
  q1: number;
  q2: number;
  q3: number;
}

export type ApiProfileType = "STABLE" | "BALANCED" | "AGGRESSIVE" | string;

export interface RiskProfileResponse {
  id: number;
  settlement_id: number;
  q1_score: number;
  q2_score: number;
  q3_score: number;
  total_score: number;
  profile_type: ApiProfileType;
  target_hedge_ratio_min: number;
  target_hedge_ratio_max: number;
  created_at: string;
}

export interface ProductMatchRequest {
  settlement_id: number;
  assessment_id: number;
  risk_profile_id: number;
}

export type ApiMatchVerdict = "ELIGIBLE" | "CONDITIONAL" | "NOT_ELIGIBLE";

export interface ProductMatchItem {
  id: number;
  product_id: string;
  verdict: ApiMatchVerdict;
  fit_score: number;
  reason_text: string;
}

export interface ProductMatchResponse {
  match_id: number;
  settlement_id: number;
  assessment_id: number;
  risk_profile_id: number;
  items: ProductMatchItem[];
}

export interface AdminProductRule {
  rule_id?: number;
  product_id?: string;
  field: string;
  operator: string;
  value: { value: unknown };
}

export interface AdminProductRequest {
  product_id: string;
  name: string;
  provider: string;
  direction: string;
  strategy_group: string;
  cost_info: string;
  coverage_info: string;
  rules: Array<{ field: string; operator: string; value: { value: unknown } }>;
}

export interface AdminProductResponse {
  product_id: string;
  name: string;
  provider: string;
  direction: string;
  strategy_group: string;
  cost_info: string;
  coverage_info: string;
  rules: AdminProductRule[];
}

export interface ProductSummary {
  product_id: string;
  name: string;
  provider: string;
  direction: string;
  strategy_group: string;
}

export interface StrategyRecommendationRequest {
  settlement_id: number;
  match_id: number;
  risk_profile_id: number;
}

/**
 * 실제 백엔드 응답 구조 (app/clients/ai_service_client.py mock 응답 기준).
 * API 명세서 CSV의 {strategyType, cost, effectivenessGrade, difficultyGrade} 예시는
 * 실제 응답과 다릅니다 — 실제로는 상품 배분 비율(allocationRatio)과 productId를 줍니다.
 */
export interface StrategyMixItem {
  strategyType: string;
  productId: string;
  allocationRatio: number;
}

export interface StrategyRecommendationResponse {
  recommendation_id: number;
  settlement_id: number;
  match_id: number;
  risk_profile_id: number;
  recommendation_mix: StrategyMixItem[];
  recommendation_reason: string | null;
  pdf_url: string | null;
}

export type ApiConsultationMethod = "PHONE" | "EMAIL" | "BRANCH_VISIT";
export type ApiConsultationStatus = "REQUESTED" | "MATCHING" | "ASSIGNED" | "COMPLETED" | "CANCELLED";

export interface ConsultationRequestRequest {
  profile_id: number;
  recommendation_id: number;
  selected_product_ids: string[];
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  consultation_method: ApiConsultationMethod;
  preferred_time: string | null;
  preferred_branch: string | null;
  memo: string | null;
  privacy_consent: boolean;
  policy_version: string;
}

export interface ConsultationRequestResponse {
  request_id: number;
  profile_id: number;
  recommendation_id: number;
  status: ApiConsultationStatus;
  contact_name: string;
  contact_phone?: string;
  contact_email?: string;
  consultation_method: ApiConsultationMethod;
  preferred_time?: string | null;
  preferred_branch?: string | null;
  memo?: string | null;
  consented_at?: string;
  policy_version?: string;
  requested_at: string;
  selected_products?: Array<{ id: number; product_id: string }>;
}

export interface ProfileSummaryResponse {
  profile: { profileId: number; businessType: ApiBusinessType };
  latestAssessment: { assessment_id: number; risk_grade: ApiRiskGrade } | null;
  latestMatch: { match_id: number } | null;
  latestRecommendation: { recommendation_id: number } | null;
}

export interface CountryRiskGrade {
  country_code: string;
  country_name: string;
  risk_grade: ApiRiskGrade;
  score: number;
}
