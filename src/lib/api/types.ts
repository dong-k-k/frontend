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
 * `GET /api/v1/settlement-items/{settlement_id}/rate-forecast` (app/risk/schemas.py::ForecastPoint,
 * 2026-08 실제 구현 기준 — dongkk-ai/fx-chronos `GET /internal/fx-forecast`를 그대로 통과시킨 값).
 * `point/lower/median/upper`는 서버에서 `Decimal`이라 다른 Decimal 필드처럼 JSON 문자열로
 * 내려온다(`net_exposure` 등과 동일 패턴, 실제 호출로 확인) — `normalizeRateForecast`에서 숫자로 변환한다.
 */
export interface ForecastPoint {
  date: string;
  /** fx-chronos point_forecast(앙상블 점 예측) — "중앙 예측 환율"로 표시. */
  point: number;
  lower: number;
  /** 현재 화면에서는 그래프·표에 그리지 않고 타입에만 보존. */
  median: number;
  upper: number;
}

/**
 * `GET /api/v1/settlement-items/{settlement_id}/rate-forecast` (app/risk/schemas.py::RateForecastResponse).
 * 이 API는 정산건별 예측이 아니라 "매일 03:00 KST에 재생성되는 USD/KRW 고정 H90(90일) 시계열"을
 * 그대로 돌려준다 — settlement_id는 요청 확인용일 뿐, 응답 값 자체는 통화쌍과 결제일에 따라
 * 달라지지 않는다. currency가 USD가 아닌 정산건은 서버가 404로 거부한다(app/risk/router.py).
 * 기준환율/BEP처럼 이 정산건에 특화된 값은 이 응답에 없다 — 화면이 이미 갖고 있는 실제 값
 * (진단 결과의 current_rate, 결제 정보의 bep_rate)을 호출부에서 넘겨받아 쓴다.
 */
export interface RateForecastResponse {
  settlement_id: number;
  currency_pair: string;
  /** 이 예측의 기준일(마지막 실측일). */
  forecast_origin: string;
  /** 예측 일수(현재 항상 90). */
  horizon: number;
  unit: string;
  model_name: string;
  /** 이 예측 스냅샷이 생성된 시각(ISO datetime 문자열). */
  generated_at: string;
  forecast: ForecastPoint[];
  /** fx-chronos가 명시한 신뢰도 한계 등 실제 경고 문구 — 지어내지 않고 그대로 표시한다. */
  warnings: string[];
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

export type ApiEligibilityStatus = "RECOMMENDED" | "CONDITIONAL" | "RM_REVIEW_REQUIRED" | "NOT_RECOMMENDED";

export interface ProductMatchItem {
  id: number;
  product_id: string;
  product_name: string;
  provider: string;
  fit_score: number;
  eligibility_status: ApiEligibilityStatus;
  reason_text: string | null;
  recommended_hedge_amount_krw: number | null;
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
  productId: string;
  productName: string;
  provider: string;
  eligibilityStatus: ApiEligibilityStatus;
  allocationRatio: number;
}

export interface AvoidedLossScenario {
  scenarioName: string;
  avoidedLossKrw: number;
}

export interface AvoidedLossCard {
  productId: string;
  productName: string;
  provider: string;
  recommendedHedgeAmountKrw: number | null;
  avoidedLossScenarios: AvoidedLossScenario[] | null;
}

export interface StrategyRecommendationResponse {
  recommendation_id: number;
  settlement_id: number;
  match_id: number;
  risk_profile_id: number;
  recommendation_mix: StrategyMixItem[];
  recommendation_reason: string | null;
  avoided_loss_by_product: AvoidedLossCard[] | null;
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
