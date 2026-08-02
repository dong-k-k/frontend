"use client";

import { Shell, ShellHeader } from "@/components/ui/Shell";
import { LinkButton, Button } from "@/components/ui/Button";
import { useWizard } from "@/context/wizard-context";
import { useDownloadStrategyReport } from "@/hooks/useDownloadStrategyReport";

const CONTACT_METHOD_LABEL: Record<string, string> = {
  PHONE: "전화",
  EMAIL: "이메일",
  BRANCH_VISIT: "지점 방문",
};

const CONSULTATION_STATUS_LABEL: Record<string, string> = {
  REQUESTED: "접수됨",
  MATCHING: "담당자 매칭 중",
  ASSIGNED: "담당자 배정 완료",
  COMPLETED: "상담 완료",
  CANCELLED: "취소됨",
};

export default function ConsultationCompletePage() {
  const { consultation, server, reset } = useWizard();
  const { downloading: pdfDownloading, download: handleDownloadPdf } = useDownloadStrategyReport(
    server.recommendationId,
  );

  if (!server.consultationRequestId) {
    return (
      <Shell>
        <ShellHeader step={5} />
        <div className="px-14 py-16 text-center">
          <p className="mb-6 text-sm text-ink-soft">아직 상담 신청이 완료되지 않았습니다.</p>
          <LinkButton href="/consultation">상담 신청으로 이동</LinkButton>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <ShellHeader step={5} />
      <div className="px-14 py-14 text-center">
        <div className="mx-auto mb-4.5 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-[26px] font-extrabold text-success-text">
          ✓
        </div>
        <h2 className="mb-6 text-[21px] font-bold text-ink">상담 신청이 완료되었습니다</h2>
        <div className="mx-auto mb-5 grid max-w-[440px] grid-cols-2 gap-2.5 rounded-xl border border-border-soft p-5 text-left text-[12.5px] text-ink-soft">
          <div>
            상담 신청번호 <b className="text-ink">#{server.consultationRequestId}</b>
          </div>
          <div>
            RM 매칭 상태{" "}
            <b className="text-ink">
              {server.consultationStatus ? CONSULTATION_STATUS_LABEL[server.consultationStatus] : "진행중"}
            </b>
          </div>
          <div>
            상담 방식 <b className="text-ink">{CONTACT_METHOD_LABEL[consultation.contactMethod]}</b>
          </div>
          <div>
            희망 상담시간 <b className="text-ink">{consultation.preferredTime || "미지정"}</b>
          </div>
          <div>
            희망 지점 <b className="text-ink">{consultation.branch}</b>
          </div>
          <div>
            전달된 추천상품 <b className="text-ink">{server.matchItems.length}건</b>
          </div>
        </div>
        <p className="mb-6 text-[12.5px] text-ink-soft">
          담당 RM이 신청하신 금융상품의 가입 조건과 필요 서류를 안내해드릴 예정입니다.
        </p>
        <div className="flex justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={handleDownloadPdf}
            disabled={!server.recommendationId || pdfDownloading}
          >
            {pdfDownloading ? "다운로드 중..." : "PDF 리포트 다시 다운로드"}
          </Button>
          <LinkButton href="/" size="sm" onClick={() => reset()}>
            처음으로
          </LinkButton>
        </div>
      </div>
    </Shell>
  );
}
