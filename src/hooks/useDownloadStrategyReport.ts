"use client";

import { useState } from "react";
import { downloadStrategyReport, ApiError } from "@/lib/api";

/** PDF 리포트 다운로드 — /diagnosis/recommendations와 /consultation/complete가
 * 동일하게 사용한다: blob으로 받아 브라우저 다운로드를 트리거하고, 중복 클릭을
 * 막고, 실패 시 에러 메시지를 보여준다. */
export function useDownloadStrategyReport(recommendationId: number | null) {
  const [downloading, setDownloading] = useState(false);

  const download = async () => {
    if (!recommendationId || downloading) return;
    setDownloading(true);
    try {
      const blob = await downloadStrategyReport(recommendationId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `환리스크진단_추천리포트_${recommendationId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e instanceof ApiError || e instanceof Error ? e.message : "PDF 리포트를 다운로드하지 못했습니다.");
    } finally {
      setDownloading(false);
    }
  };

  return { downloading, download };
}
