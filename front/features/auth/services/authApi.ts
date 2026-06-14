import type {
  AuthUser,
  LoginInput,
  RegisterInput,
  ValidationDetail,
} from "@/features/auth/types/auth";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

const requestTimeoutMs = 10000;
const networkErrorMessage = "通信に失敗しました。時間をおいて再度お試しください";

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; message: string };

export async function registerUser(
  input: RegisterInput,
): Promise<AuthResult> {
  return postAuth("/api/auth/register", input, "登録に失敗しました");
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  return postAuth(
    "/api/auth/login",
    input,
    "メールアドレスまたはパスワードが正しくありません",
  );
}

async function postAuth(
  path: string,
  body: unknown,
  fallbackErrorMessage: string,
): Promise<AuthResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    return { ok: false, message: networkErrorMessage };
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.ok) {
    try {
      const data = (await response.json()) as { user: AuthUser };
      return { ok: true, user: data.user };
    } catch {
      return { ok: false, message: fallbackErrorMessage };
    }
  }

  return {
    ok: false,
    message: await extractErrorMessage(response, fallbackErrorMessage),
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
