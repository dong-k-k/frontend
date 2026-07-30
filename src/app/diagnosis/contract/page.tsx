"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Shell, ShellHeader, ShellFooter } from "@/components/ui/Shell";
import { LinkButton, Button } from "@/components/ui/Button";
import { FieldLabel, RequiredTag, SectionLabel } from "@/components/ui/Field";
import { OptionCards, PillOptions } from "@/components/ui/OptionCards";
import { NumberInput, DateInput, Select } from "@/components/ui/Input";
import { useWizard } from "@/context/wizard-context";
import { COUNTRIES, findCountry } from "@/lib/countries";
import type { ContractType, SettlementMethod } from "@/lib/types";

const CONTRACT_TYPES: { value: ContractType; label: string }[] = [
  { value: "export", label: "수출계약 (외화채권)" },
  { value: "import", label: "수입계약 (외화채무)" },
];

const SETTLEMENT_METHODS: { value: SettlementMethod; label: string }[] = [
  { value: "TT", label: "T/T 송금" },
  { value: "LC", label: "L/C 신용장 ⓘ" },
  { value: "DP", label: "D/P ⓘ" },
  { value: "DA", label: "D/A ⓘ" },
];

export default function ContractInfoPage() {
  const router = useRouter();
  const { contract, setContract } = useWizard();

  const canProceed = useMemo(
    () =>
      Boolean(
        contract.countryCode &&
          contract.amount &&
          contract.currency &&
          contract.priceFixDate &&
          contract.dueDate,
      ),
    [contract],
  );

  return (
    <Shell>
      <ShellHeader step={1} right={<span>✓ 임시저장됨</span>} />
      <div className="px-10 py-9">
        <h2 className="mb-1.5 text-xl font-bold text-ink">체결된 계약 정보를 알려주세요</h2>
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
              거래 국가 <span className="ml-1 font-normal text-muted">(국가코드 기준, 단일선택)</span>
            </FieldLabel>
            <Select
              value={contract.countryCode}
              onChange={(countryCode) => {
                const country = findCountry(countryCode);
                setContract({ countryCode, currency: country.currency });
              }}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.flag} {c.code} — {c.name}
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

        <div className="rounded-xl border border-border-soft px-5 py-4.5">
          <div className="mb-2.5 text-[12.5px] font-bold text-warning-text">결제 정보 카드 1</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3.5">
            <div>
              <FieldLabel required>결제 예정 금액</FieldLabel>
              <NumberInput value={contract.amount} onChange={(amount) => setContract({ amount })} />
            </div>
            <div>
              <FieldLabel required>결제통화</FieldLabel>
              <Select value={contract.currency} onChange={(currency) => setContract({ currency })}>
                {["USD", "EUR", "JPY", "CNY", "GBP"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <FieldLabel required>계약·가격 확정일</FieldLabel>
              <DateInput value={contract.priceFixDate} onChange={(priceFixDate) => setContract({ priceFixDate })} />
            </div>
            <div>
              <FieldLabel required>약정 결제일</FieldLabel>
              <DateInput value={contract.dueDate} onChange={(dueDate) => setContract({ dueDate })} />
            </div>
            <div>
              <FieldLabel optional>손익분기 환율 BEP</FieldLabel>
              <NumberInput value={contract.bep} onChange={(bep) => setContract({ bep })} suffix="원" />
            </div>
            <div>
              <FieldLabel>결제일 조정 가능 여부</FieldLabel>
              <div className="mt-1">
                <PillOptions
                  options={[
                    { value: "yes", label: "가능" },
                    { value: "no", label: "불가능" },
                  ]}
                  value={contract.dueDateAdjustable ? "yes" : "no"}
                  onChange={(v) => setContract({ dueDateAdjustable: v === "yes" })}
                />
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          title="이 데모에서는 결제 일정 1건만 지원합니다"
          className="mt-2.5 rounded-lg border border-dashed border-disabled px-4 py-2.5 text-[12.5px] font-semibold text-ink-soft"
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
            <Button disabled={!canProceed} onClick={() => router.push("/diagnosis/analyzing")}>
              분석 시작
            </Button>
          </>
        }
      />
    </Shell>
  );
}
