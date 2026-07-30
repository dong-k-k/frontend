"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Shell, ShellHeader, ShellFooter } from "@/components/ui/Shell";
import { LinkButton, Button } from "@/components/ui/Button";
import { FieldLabel } from "@/components/ui/Field";
import { PillOptions } from "@/components/ui/OptionCards";
import { TextInput, Select } from "@/components/ui/Input";
import { useWizard } from "@/context/wizard-context";
import { computeAnalysis, formatDateDots, formatNumber, RISK_GRADE_LABEL } from "@/lib/risk";
import type { ContactMethod, SettlementMethod } from "@/lib/types";

const CONTACT_METHODS: { value: ContactMethod; label: string }[] = [
  { value: "PHONE", label: "전화" },
  { value: "EMAIL", label: "이메일" },
  { value: "BRANCH", label: "지점 방문" },
];

const SETTLEMENT_LABEL: Record<SettlementMethod, string> = {
  TT: "T/T 송금",
  LC: "L/C 신용장",
  DP: "D/P",
  DA: "D/A",
};

const BRANCHES = ["강남기업금융센터", "여의도기업금융센터", "부산기업금융센터", "판교기업금융센터"];

function SummaryRow({ label, value, tone }: { label: string; value: string; tone?: "danger" | "success" }) {
  return (
    <div className="flex justify-between text-xs leading-[2] text-ink-soft">
      <span>{label}</span>
      <b className={tone === "danger" ? "text-danger" : tone === "success" ? "text-success-text" : "text-ink"}>
        {value}
      </b>
    </div>
  );
}

export default function ConsultationPage() {
  const router = useRouter();
  const { company, contract, consultation, setConsultation, submitConsultation } = useWizard();
  const analysis = useMemo(() => computeAnalysis(contract), [contract]);

  const recentPerformanceUsd =
    contract.contractType === "export" ? company.exportRevenueUsd : company.importRevenueUsd;

  const canSubmit = useMemo(
    () =>
      Boolean(
        consultation.companyName.trim() &&
          consultation.contactName.trim() &&
          consultation.phone.trim() &&
          consultation.email.trim() &&
          consultation.agree,
      ),
    [consultation],
  );

  const handleSubmit = () => {
    submitConsultation();
    router.push("/consultation/complete");
  };

  return (
    <Shell>
      <ShellHeader step={5} />
      <div className="flex gap-7 px-10 py-8">
        <div className="flex-1">
          <h2 className="mb-1.5 text-xl font-bold text-ink">KB 기업금융 상담을 신청해주세요</h2>
          <p className="mb-5 text-[13px] text-muted">
            입력한 계약 정보와 AI 분석 결과가 담당 RM에게 함께 전달됩니다.
          </p>
          <div className="grid grid-cols-2 gap-x-5 gap-y-4">
            <div>
              <FieldLabel>기업명</FieldLabel>
              <TextInput value={consultation.companyName} onChange={(companyName) => setConsultation({ companyName })} />
            </div>
            <div>
              <FieldLabel>담당자명</FieldLabel>
              <TextInput value={consultation.contactName} onChange={(contactName) => setConsultation({ contactName })} />
            </div>
            <div>
              <FieldLabel>연락처</FieldLabel>
              <TextInput
                type="tel"
                value={consultation.phone}
                onChange={(phone) => setConsultation({ phone })}
                placeholder="010-1234-5678"
              />
            </div>
            <div>
              <FieldLabel>이메일</FieldLabel>
              <TextInput type="email" value={consultation.email} onChange={(email) => setConsultation({ email })} />
            </div>
            <div>
              <FieldLabel>희망 상담 방식</FieldLabel>
              <PillOptions
                options={CONTACT_METHODS}
                value={consultation.contactMethod}
                onChange={(contactMethod) => setConsultation({ contactMethod })}
              />
            </div>
            <div>
              <FieldLabel>희망 상담시간</FieldLabel>
              <TextInput
                value={consultation.preferredTime}
                onChange={(preferredTime) => setConsultation({ preferredTime })}
                placeholder="평일 오후 2~4시"
              />
            </div>
            <div>
              <FieldLabel>희망 지점</FieldLabel>
              <Select value={consultation.branch} onChange={(branch) => setConsultation({ branch })}>
                {BRANCHES.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </Select>
            </div>
            <div className="col-span-2">
              <FieldLabel optional>추가 전달 메모</FieldLabel>
              <textarea
                className="mt-1 w-full rounded-lg border border-border px-3 py-2.5 text-[13px] text-ink placeholder:text-faint focus:border-accent focus:outline-none"
                rows={2}
                placeholder="전달하실 내용을 입력해주세요"
                value={consultation.memo}
                onChange={(e) => setConsultation({ memo: e.target.value })}
              />
            </div>
          </div>
          <label className="mt-4 flex items-center gap-2 text-xs text-ink-soft">
            <input
              type="checkbox"
              checked={consultation.agree}
              onChange={(e) => setConsultation({ agree: e.target.checked })}
              className="h-4 w-4 rounded border-disabled"
            />
            개인정보 수집 및 이용에 동의합니다
          </label>
        </div>
        <div className="w-[280px] flex-none rounded-xl border border-border-soft p-4.5">
          <div className="mb-2.5 text-[12.5px] font-bold text-ink-soft">전달 정보 요약</div>
          <SummaryRow
            label="최근 1년 실적"
            value={recentPerformanceUsd ? `USD ${formatNumber(recentPerformanceUsd)}` : "미입력"}
          />
          <SummaryRow label="계약 유형" value={contract.contractType === "export" ? "수출계약" : "수입계약"} />
          <SummaryRow label="계약 통화·금액" value={`${contract.currency} ${formatNumber(contract.amount ?? 0)}`} />
          <SummaryRow label="결제일" value={formatDateDots(contract.dueDate)} />
          <SummaryRow label="결제 방식" value={SETTLEMENT_LABEL[contract.settlementMethod]} />
          <SummaryRow label="위험 등급" value={RISK_GRADE_LABEL[analysis.riskGrade]} tone="danger" />
          <SummaryRow label="Expected Shortfall" value={`${formatNumber(Math.abs(analysis.esPct), 1)}%`} />
          <SummaryRow label="BEP" value={`${formatNumber(analysis.bep, 2)}원`} />
          <SummaryRow label="추천 전략" value="3건" />
          <SummaryRow label="추천 금융상품" value="3건" />
          <SummaryRow label="PDF 리포트" value="첨부됨 ✓" tone="success" />
        </div>
      </div>
      <ShellFooter
        left={
          <LinkButton href="/diagnosis/recommendations" variant="secondary" size="sm">
            이전
          </LinkButton>
        }
        right={
          <Button disabled={!canSubmit} onClick={handleSubmit}>
            상담 신청
          </Button>
        }
      />
    </Shell>
  );
}
