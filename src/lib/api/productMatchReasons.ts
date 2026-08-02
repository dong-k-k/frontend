/**
 * dongkk-ai(financial-product-rag)는 이제 recommendationReasons를 처음부터
 * 내부 enum·priority 숫자·세미콜론이 없는, 사용자에게 바로 보여줄 수 있는
 * 자연스러운 한국어 문장 배열로 생성한다(app/recommender.py, app/card_builder.py).
 * 다만 dongkk-server가 그 배열을 `ProductMatchItem.reason_text`에 저장하며
 * `"; ".join(...)`으로 다시 한 줄 문자열로 합친다(app/product/router.py) —
 * 그래서 프론트는 그 구분자를 기준으로 다시 나누기만 하면 된다. 문장 내용
 * 자체를 해석·번역·재작성하지 않는다(그 일은 이제 RAG가 한다).
 *
 * 서버가 나중에 `reason_text` 대신 배열 필드(예: `reasons: string[]`)를
 * 그대로 내려주면, 이 함수를 `reasonText ?? []`로 바꾸기만 하면 된다 —
 * 호출부(recommendations/page.tsx)는 이 함수의 반환 타입(string[])만
 * 알면 되므로 수정할 필요가 없다.
 */
export function parseProductMatchReasons(reasonText: string | null | undefined): string[] {
  if (!reasonText) return [];
  return reasonText
    .split(";")
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}
