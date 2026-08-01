const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

let authTokenProvider: (() => string | null | undefined) | null = null;

/**
 * Registers a function used to attach `Authorization: Bearer <token>` to
 * requests (only the risk-assessment "결과 조회" endpoint documents this
 * header today). There's no login flow yet, so nothing calls this — wire it
 * up once one exists.
 */
export function setAuthTokenProvider(provider: () => string | null | undefined): void {
  authTokenProvider = provider;
}

interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  pathParams?: Record<string, string | number>;
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
  headers?: Record<string, string>;
  responseType?: "json" | "blob";
}

function resolvePath(path: string, pathParams?: Record<string, string | number>): string {
  if (!pathParams) return path;
  return Object.entries(pathParams).reduce(
    (acc, [key, value]) => acc.replace(`{${key}}`, encodeURIComponent(String(value))),
    path,
  );
}

function buildQueryString(query?: Record<string, string | number | boolean | undefined>): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Thin fetch wrapper for the FX Mate backend API (API 명세서 기준).
 *
 * `path` uses `{pathParam}` placeholders exactly as written in the spec, e.g.
 * `/api/v1/profiles/{profileId}`, filled in via `pathParams`.
 *
 * Throws `ApiError` on a non-2xx response or when `NEXT_PUBLIC_API_BASE_URL`
 * isn't configured, so callers can surface a real error instead of a
 * confusing network failure against the wrong host.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  if (!API_BASE_URL) {
    throw new ApiError(
      0,
      "API 서버 주소가 설정되지 않았습니다. NEXT_PUBLIC_API_BASE_URL 환경변수를 설정해주세요.",
    );
  }

  const { method = "GET", pathParams, query, body, headers, responseType = "json" } = options;
  const url = `${API_BASE_URL}${resolvePath(path, pathParams)}${buildQueryString(query)}`;
  const token = authTokenProvider?.();

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, "API 서버에 연결할 수 없습니다. 네트워크 상태나 서버 주소를 확인해주세요.");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, text || `API 요청이 실패했습니다 (${res.status} ${res.statusText})`);
  }

  if (responseType === "blob") {
    return (await res.blob()) as unknown as T;
  }
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}
