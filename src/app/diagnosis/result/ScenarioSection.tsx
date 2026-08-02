"use client";

import type { ContractType } from "@/lib/types";
import type { AggregatedScenario } from "@/lib/api/riskAggregate";
import { formatKrw, formatNumber, formatSignedKrw, scenarioLabel } from "@/lib/risk";

/** 환율 시나리오는 표만 표시한다(차트 없음). 시나리오는 날짜가 아니라 환율
 * 변동률(scenario_pct)로 구분되는 값이라 그래프/표 전환 기능도 두지 않는다. */
export function ScenarioSection({
  scenarios,
  netExposureTotal,
  contractType,
}: {
  scenarios: AggregatedScenario[];
  netExposureTotal: number;
  contractType: ContractType;
}) {
  if (scenarios.length === 0) {
    return <div className="py-6 text-center text-[12px] text-muted">표시할 시나리오 데이터가 없습니다.</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] border-collapse text-[11.5px]">
        <thead>
          <tr className="text-muted">
            <th className="px-2 py-1.5 text-left">환율 변동</th>
            <th className="px-2 py-1.5 text-left">예상 환율</th>
            <th className="px-2 py-1.5 text-left">수출 예상 손익</th>
            <th className="px-2 py-1.5 text-left">수입 예상 손익</th>
            <th className="px-2 py-1.5 text-left">예상 원화 환산액</th>
          </tr>
        </thead>
        <tbody>
          {scenarios.map((row) => {
            // "예상 원화 환산액"은 이 계약의 실제 방향(export/import)에 해당하는
            // 손익만 반영한다 — server가 준 부호를 그대로 쓰고 임의로 반전하지 않는다.
            const directionalPl = contractType === "export" ? row.export_pl_krw : row.import_pl_krw;
            return (
              <tr key={row.scenario_pct} className={row.scenario_pct === 0 ? "bg-accent-softer" : undefined}>
                <td className={"border-t border-border-soft px-2 py-1.5" + (row.scenario_pct === 0 ? " font-bold" : "")}>
                  {scenarioLabel(row.scenario_pct)}
                </td>
                <td className="border-t border-border-soft px-2 py-1.5">{formatNumber(row.projected_rate, 1)}원</td>
                <td
                  className={
                    "border-t border-border-soft px-2 py-1.5" +
                    (row.export_pl_krw > 0 ? " text-success" : row.export_pl_krw < 0 ? " text-danger" : "")
                  }
                >
                  {row.export_pl_krw === 0 ? "0원" : `${formatSignedKrw(row.export_pl_krw)}원`}
                </td>
                <td
                  className={
                    "border-t border-border-soft px-2 py-1.5" +
                    (row.import_pl_krw > 0 ? " text-success" : row.import_pl_krw < 0 ? " text-danger" : "")
                  }
                >
                  {row.import_pl_krw === 0 ? "0원" : `${formatSignedKrw(row.import_pl_krw)}원`}
                </td>
                <td className="border-t border-border-soft px-2 py-1.5">{formatKrw(netExposureTotal + directionalPl)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
