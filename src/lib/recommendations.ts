import type { AnalysisResult, CreditRating, RiskGrade, RiskProfile } from "./types";

export function deriveProfileLabel(profile: RiskProfile): string {
  const cautious =
    profile.maxLossTolerance === "UNDER_2" || profile.krwCertaintyPreference === "FULL_LOCK";
  const aggressive =
    profile.maxLossTolerance === "OVER_5" || profile.krwCertaintyPreference === "KEEP_UPSIDE";
  if (cautious && !aggressive) return "안정추구";
  if (aggressive && !cautious) return "수익추구";
  return "균형";
}

export function hedgeTargetRangeLabel(grade: RiskGrade): string {
  if (grade === "LOW") return "20~40%";
  if (grade === "HIGH") return "80~100%";
  return "50~80%";
}

export interface StrategyCard {
  rank: 1 | 2 | 3;
  title: string;
  detailLines: string[];
}

export const STRATEGIES: StrategyCard[] = [
  {
    rank: 1,
    title: "환율 고정",
    detailLines: ["K-SURE 환변동보험 · KB 선물환", "예상비용 0.3% · 위험감소 78%"],
  },
  {
    rank: 2,
    title: "수출대금 조기회수",
    detailLines: ["KB 무소구권 수출채권 매입", "처리기간 약 3영업일"],
  },
  {
    rank: 3,
    title: "운전자금 확보",
    detailLines: ["수출기업 국내 운전자금 외화대출", "내국신용장 매입 대출"],
  },
];

export type ProductCategory = "환헤지" | "수출금융" | "보증·보험";

export interface ProductCard {
  rank: 1 | 2 | 3;
  category: ProductCategory;
  name: string;
  issuer: string;
  detail: string;
  eligible: (creditRating: CreditRating | null) => { met: boolean; label: string };
}

export const PRODUCTS: ProductCard[] = [
  {
    rank: 1,
    category: "보증·보험",
    name: "K-SURE 환변동보험",
    issuer: "한국무역보험공사",
    detail: "예상 보험료 약 0.3% · 처리기간 약 5영업일",
    eligible: () => ({ met: true, label: "자격 충족" }),
  },
  {
    rank: 2,
    category: "환헤지",
    name: "KB 선물환",
    issuer: "KB국민은행",
    detail: "환율 확정 · 처리기간 약 1영업일",
    eligible: () => ({ met: true, label: "자격 충족" }),
  },
  {
    rank: 3,
    category: "수출금융",
    name: "KB 무소구권 수출채권 매입",
    issuer: "KB국민은행",
    detail: "",
    eligible: (creditRating) =>
      creditRating && creditRating !== "UNKNOWN"
        ? { met: true, label: "자격 충족" }
        : { met: false, label: "조건부 충족" },
  },
];

export function productThirdCardDetail(creditRating: CreditRating | null): string {
  return creditRating && creditRating !== "UNKNOWN" ? "신용등급 확인됨 · 정식 추천" : "신용등급 미입력 · 조건부 추천";
}

export function scenarioNarrative(analysis: AnalysisResult, breachVerb: string): string {
  const likelihood = analysis.riskGrade === "HIGH" ? "높습니다" : analysis.riskGrade === "MEDIUM" ? "있습니다" : "낮습니다";
  return `현재 계약은 환율 ${breachVerb} 시 손익분기 환율을 이탈할 가능성이 ${likelihood}. 대금의 50%는 KB 무소구권 수출채권 매입으로 조기 현금화하고, 잔여 50%는 K-SURE 환변동보험으로 보호하는 혼합 전략을 권장합니다.`;
}
