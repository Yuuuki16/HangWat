const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

const requestTimeoutMs = 10000;
const networkErrorMessage = "通信に失敗しました。時間をおいて再度お試しください";

type ValidationDetail = {
  field: string;
  message: string;
};

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; message: string; status?: number };

export async function request<T>(
  path: string,
  init: RequestInit,
  fallbackErrorMessage: string,
): Promise<ApiResult<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      ...init,
      credentials: "include",
      signal: controller.signal,
    });
  } catch {
    return { ok: false, message: networkErrorMessage };
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.ok) {
    try {
      const data = (await response.json()) as T;
      return { ok: true, data };
    } catch {
      return { ok: false, message: fallbackErrorMessage };
    }
  }

  return {
    ok: false,
    message: await extractErrorMessage(response, fallbackErrorMessage),
    status: response.status,
  };
}

async function extractErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = (await response.json()) as {
      error?: { message?: string; details?: ValidationDetail[] };
    };
    if (data.error?.details && data.error.details.length > 0) {
      return data.error.details.map((detail) => detail.message).join("\n");
    }
    if (data.error?.message) {
      return data.error.message;
    }
  } catch {
    // レスポンスボディが JSON でない場合は既定のメッセージを使う
  }

  return fallback;
}
