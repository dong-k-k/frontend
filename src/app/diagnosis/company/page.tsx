"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Shell, ShellHeader, ShellFooter } from "@/components/ui/Shell";
import { LinkButton, Button } from "@/components/ui/Button";
import { FieldLabel, RequiredTag, SectionLabel } from "@/components/ui/Field";
import { OptionCards, PillOptions } from "@/components/ui/OptionCards";
import { NumberInput } from "@/components/ui/Input";
import { useWizard } from "@/context/wizard-context";
import type { CompanyType, CreditRating } from "@/lib/types";

const COMPANY_TYPES: { value: CompanyType; label: string }[] = [
  { value: "export", label: "수출기업" },
  { value: "import", label: "수입기업" },
  { value: "both", label: "수출입 겸업기업" },
];

const CREDIT_RATINGS: { value: CreditRating; label: string }[] = [
  { value: "A_PLUS", label: "A 이상" },
  { value: "BBB", label: "BBB" },
  { value: "BB_MINUS", label: "BB 이하" },
  { value: "UNKNOWN", label: "잘 모르겠음" },
];

export default function CompanyInfoPage() {
  const router = useRouter();
  const { company, setCompany } = useWizard();

  const needsExport = company.companyType === "export" || company.companyType === "both";
  const needsImport = company.companyType === "import" || company.companyType === "both";

  const canProceed = useMemo(() => {
    if (needsExport && !company.exportRevenueUsd) return false;
    if (needsImport && !company.importRevenueUsd) return false;
    return Boolean(company.annualRevenueKrw && company.operatingProfitKrw);
  }, [company, needsExport, needsImport]);

  return (
    <Shell>
      <ShellHeader step={1} right={<span>✓ 임시저장됨</span>} />
      <div className="px-10 py-9">
        <h2 className="mb-1.5 text-xl font-bold text-ink">기업 기본정보를 알려주세요</h2>
        <p className="mb-6 text-[13px] text-muted">
          입력한 정보는 환율 위험 분석과 금융상품 조건 확인에 활용됩니다.
        </p>

        <SectionLabel>
          기업 구분 <RequiredTag />
        </SectionLabel>
        <div className="mb-5">
          <OptionCards
            options={COMPANY_TYPES}
            value={company.companyType}
            onChange={(companyType) => setCompany({ companyType })}
          />
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <div>
            <FieldLabel required={needsExport}>최근 1년 수출실적(USD)</FieldLabel>
            <NumberInput
              value={company.exportRevenueUsd}
              onChange={(exportRevenueUsd) => setCompany({ exportRevenueUsd })}
              placeholder={needsExport ? undefined : "해당 없음"}
            />
          </div>
          <div>
            <FieldLabel>최근 1년 수입실적(USD)</FieldLabel>
            <NumberInput
              value={company.importRevenueUsd}
              onChange={(importRevenueUsd) => setCompany({ importRevenueUsd })}
              placeholder={needsImport ? undefined : "해당 없음"}
            />
          </div>
          <div>
            <FieldLabel required>연 매출액(KRW)</FieldLabel>
            <NumberInput
              value={company.annualRevenueKrw}
              onChange={(annualRevenueKrw) => setCompany({ annualRevenueKrw })}
            />
          </div>
          <div>
            <FieldLabel required>영업순이익(KRW)</FieldLabel>
            <NumberInput
              value={company.operatingProfitKrw}
              onChange={(operatingProfitKrw) => setCompany({ operatingProfitKrw })}
            />
          </div>
          <div>
            <FieldLabel optional>기업 신용등급</FieldLabel>
            <PillOptions
              options={CREDIT_RATINGS}
              value={company.creditRating ?? "UNKNOWN"}
              onChange={(creditRating) => setCompany({ creditRating })}
            />
          </div>
        </div>

        <div className="mt-3.5 rounded-lg bg-warning-bg px-3.5 py-2.5 text-[11.5px] text-warning-text">
          신용등급 미입력 시 상품 추천 결과에 &quot;조건부 충족&quot; 또는 &quot;추정 결과&quot; 배지가 표시됩니다.
        </div>
      </div>
      <ShellFooter
        left={
          <LinkButton href="/" variant="secondary" size="sm">
            이전
          </LinkButton>
        }
        right={
          <>
            <Button variant="secondary" size="sm" type="button">
              임시저장
            </Button>
            <Button
              disabled={!canProceed}
              onClick={() => router.push("/diagnosis/contract")}
            >
              다음: 계약정보 입력
            </Button>
          </>
        }
      />
    </Shell>
  );
}
