import { Shell, ShellHeader } from "@/components/ui/Shell";
import { LinkButton } from "@/components/ui/Button";

const HIGHLIGHTS = [
  { top: "계약 한 건부터", bottom: "분석 가능" },
  { top: "예상 소요시간", bottom: "약 3분" },
  { top: "상담용", bottom: "PDF 리포트 제공" },
];

export default function ServiceStartPage() {
  return (
    <Shell>
      <ShellHeader right={<></>} />
      <div className="px-14 py-16 text-center">
        <h1 className="mb-3 text-[26px] font-extrabold text-ink">
          체결한 계약의 환율 위험을 확인해보세요
        </h1>
        <p className="mx-auto mb-7 max-w-[520px] text-sm leading-relaxed text-ink-soft">
          계약금액과 결제일을 입력하면 결제일까지 발생할 수 있는 예상 환손실을 분석하고,
          <br />
          기업 상황에 맞는 대응 전략과 금융상품을 추천해드립니다.
        </p>
        <div className="mb-8 flex justify-center gap-4 text-[12.5px] text-ink-soft">
          {HIGHLIGHTS.map((h) => (
            <div key={h.top} className="w-[170px] rounded-[10px] border border-border-soft px-4 py-3.5">
              {h.top}
              <br />
              <b className="text-ink">{h.bottom}</b>
            </div>
          ))}
        </div>
        <LinkButton href="/diagnosis/company">환율 리스크 진단 시작</LinkButton>
      </div>
    </Shell>
  );
}
