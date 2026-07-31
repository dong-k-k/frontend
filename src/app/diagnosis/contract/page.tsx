"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Shell, ShellHeader, ShellFooter } from "@/components/ui/Shell";
import { LinkButton, Button } from "@/components/ui/Button";
import { FieldLabel, RequiredTag, SectionLabel } from "@/components/ui/Field";
import { OptionCards, PillOptions } from "@/components/ui/OptionCards";
import { NumberInput, DateInput, Select } from "@/components/ui/Input";
import { useWizard } from "@/context/wizard-context";
import { COUNTRIES } from "@/lib/countries";
import type {
  ContractType,
  PaymentSchedule,
  SettlementMethod,
} from "@/lib/types";

const CONTRACT_TYPES: { value: ContractType; label: string }[] = [
  { value: "export", label: "수출계약 (외화채권)" },
  { value: "import", label: "수입계약 (외화채무)" },
];

const SETTLEMENT_METHODS: { value: SettlementMethod; label: string }[] = [
  { value: "TT", label: "T/T 송금" },
  { value: "LC", label: "L/C 신용장" },
  { value: "DP", label: "D/P" },
  { value: "DA", label: "D/A" },
];

function PaymentScheduleCard({
  schedule,
  index,
  onChange,
  onRemove,
}: {
  schedule: PaymentSchedule;
  index: number;
  onChange: (patch: Partial<PaymentSchedule>) => void;
  onRemove?: () => void;
}) {
  return (
    <div className="rounded-xl border border-border-soft px-5 py-4.5">
      <div className="mb-2.5 flex items-center justify-between">
        <div className="text-[12.5px] font-bold text-warning-text">
          결제 정보 카드 {index + 1}
        </div>
        {onRemove && (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`결제 정보 카드 ${index + 1} 삭제`}
            title="이 결제 정보 카드 삭제"
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted hover:bg-page hover:text-danger"
          >
            ✕
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
        <div>
          <FieldLabel required>결제 예정 금액</FieldLabel>
          <NumberInput
            value={schedule.amount}
            onChange={(amount) => onChange({ amount })}
          />
        </div>
        <div>
          <FieldLabel required>결제통화</FieldLabel>
          <Select
            value={schedule.currency}
            onChange={(currency) => onChange({ currency })}
          >
            {["USD", "EUR", "JPY", "CNY", "GBP"].map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <FieldLabel required>계약·가격 확정일</FieldLabel>
          <DateInput
            value={schedule.priceFixDate}
            onChange={(priceFixDate) => onChange({ priceFixDate })}
          />
        </div>
        <div>
          <FieldLabel required>약정 결제일</FieldLabel>
          <DateInput
            value={schedule.dueDate}
            onChange={(dueDate) => onChange({ dueDate })}
          />
        </div>
        <div>
          <FieldLabel optional>손익분기 환율 BEP</FieldLabel>
          <NumberInput
            value={schedule.bep}
            onChange={(bep) => onChange({ bep })}
            suffix="원"
          />
        </div>
        <div>
          <FieldLabel>결제일 조정 가능 여부</FieldLabel>
          <div className="mt-1">
            <PillOptions
              options={[
                { value: "yes", label: "가능" },
                { value: "no", label: "불가능" },
              ]}
              value={schedule.dueDateAdjustable ? "yes" : "no"}
              onChange={(v) => onChange({ dueDateAdjustable: v === "yes" })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContractInfoPage() {
  const router = useRouter();
  const {
    contract,
    setContract,
    addPaymentSchedule,
    removePaymentSchedule,
    updatePaymentSchedule,
  } = useWizard();

  const canProceed = useMemo(
    () =>
      Boolean(
        contract.countryCode &&
        contract.paymentSchedules.length > 0 &&
        contract.paymentSchedules.every(
          (s) => s.amount && s.currency && s.priceFixDate && s.dueDate,
        ),
      ),
    [contract],
  );

  return (
    <Shell>
      <ShellHeader step={1} right={<span>✓ 임시저장됨</span>} />
      <div className="px-10 py-9">
        <h2 className="mb-1.5 text-xl font-bold text-ink">
          체결된 계약 정보를 알려주세요
        </h2>
        <p className="mb-6 text-[13px] text-muted">
          외화 가격 확정일부터 결제일까지의 환율 위험을 분석합니다.
        </p>

        <div className="mb-5 grid grid-cols-2 gap-6">
          <div>
            <SectionLabel>
              계약 구분 <RequiredTag />
            </SectionLabel>
            <OptionCards
              options={CONTRACT_TYPES}
              value={contract.contractType}
              onChange={(contractType) => setContract({ contractType })}
            />
          </div>
          <div>
            <FieldLabel required>
              거래 국가{" "}
              <span className="ml-1 font-normal text-muted">
                (국가코드 기준, 단일선택)
              </span>
            </FieldLabel>
            <Select
              value={contract.countryCode}
              onChange={(countryCode) => setContract({ countryCode })}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <SectionLabel>
          약정 결제 방식 <RequiredTag />
        </SectionLabel>
        <div className="mb-5">
          <PillOptions
            options={SETTLEMENT_METHODS}
            value={contract.settlementMethod}
            onChange={(settlementMethod) => setContract({ settlementMethod })}
          />
        </div>

        <div className="space-y-4">
          {contract.paymentSchedules.map((schedule, index) => (
            <PaymentScheduleCard
              key={schedule.id}
              schedule={schedule}
              index={index}
              onChange={(patch) => updatePaymentSchedule(schedule.id, patch)}
              onRemove={
                index > 0 ? () => removePaymentSchedule(schedule.id) : undefined
              }
            />
          ))}
        </div>

        <div className="mt-3 rounded-lg bg-warning-bg px-3.5 py-2.5 text-[11.5px] text-warning-text">
          계약 금액을 나누어 여러 차례 결제하기로 한 경우(분할 결제)에는 아래
          &quot;결제 일정 추가&quot; 버튼으로 결제 정보 카드를 늘려, 각 회차의
          결제 예정 금액과 결제일을 나누어 입력해주세요.
        </div>
        <button
          type="button"
          onClick={addPaymentSchedule}
          className="mt-2.5 rounded-lg border border-dashed border-disabled px-4 py-2.5 text-[12.5px] font-semibold text-ink-soft hover:border-ink-soft/40 hover:text-ink"
        >
          + 결제 일정 추가
        </button>
      </div>
      <ShellFooter
        left={
          <LinkButton href="/diagnosis/company" variant="secondary" size="sm">
            ← 이전: 기업정보
          </LinkButton>
        }
        right={
          <>
            <Button variant="secondary" size="sm" type="button">
              임시저장
            </Button>
            <Button
              disabled={!canProceed}
              onClick={() => router.push("/diagnosis/analyzing")}
            >
              분석 시작
            </Button>
          </>
        }
      />
    </Shell>
  );
}
