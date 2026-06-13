import type {
  AuthUser,
  RegisterInput,
  ValidationDetail,
} from "@/features/auth/types/auth";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "";

export type RegisterResult =
  | { ok: true; user: AuthUser }
  | { ok: false; message: string };

export async function registerUser(
  input: RegisterInput,
): Promise<RegisterResult> {
  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(input),
    });
  } catch {
    return {
      ok: false,
      message: "通信に失敗しました。時間をおいて再度お試しください",
    };
  }

  if (response.ok) {
    const data = (await response.json()) as { user: AuthUser };
    return { ok: true, user: data.user };
  }

  let message = "登録に失敗しました";
  try {
    const data = (await response.json()) as {
      error?: { message?: string; details?: ValidationDetail[] };
    };
    if (data.error?.details && data.error.details.length > 0) {
      message = data.error.details.map((detail) => detail.message).join("\n");
    } else if (data.error?.message) {
      message = data.error.message;
    }
  } catch {
    // レスポンスボディが JSON でない場合は既定のメッセージを使う
  }

  return { ok: false, message };
}
