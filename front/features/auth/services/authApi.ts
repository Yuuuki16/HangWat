import type {
  AuthUser,
  LoginInput,
  RegisterInput,
  ValidationDetail,
} from "@/features/auth/types/auth";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

export type AuthResult =
  | { ok: true; user: AuthUser }
  | { ok: false; message: string };

const networkErrorMessage = "通信に失敗しました。時間をおいて再度お試しください";

export async function registerUser(
  input: RegisterInput,
): Promise<AuthResult> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, message: networkErrorMessage };
  }

  if (response.ok) {
    const data = (await response.json()) as { user: AuthUser };
    return { ok: true, user: data.user };
  }

  return { ok: false, message: await extractErrorMessage(response, "登録に失敗しました") };
}

export async function loginUser(input: LoginInput): Promise<AuthResult> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, message: networkErrorMessage };
  }

  if (response.ok) {
    const data = (await response.json()) as { user: AuthUser };
    return { ok: true, user: data.user };
  }

  return {
    ok: false,
    message: await extractErrorMessage(
      response,
      "メールアドレスまたはパスワードが正しくありません",
    ),
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
