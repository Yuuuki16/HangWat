"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { AuthFormField } from "@/features/auth/components/authFormField";
import { loginUser } from "@/features/auth/services/authApi";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    const result = await loginUser({ email, password });

    if (result.ok) {
      router.push("/home");
      return;
    }

    setErrorMessage(result.message);
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-8">
      {errorMessage && (
        <p
          role="alert"
          className="whitespace-pre-line rounded-base border-2 border-red-400 bg-red-50 px-4 py-3 text-base text-red-700"
        >
          {errorMessage}
        </p>
      )}

      <AuthFormField
        id="login-email"
        name="email"
        type="email"
        label="メールアドレス"
        placeholder="example@email.com"
        autoComplete="email"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <AuthFormField
        id="login-password"
        name="password"
        type="password"
        label="パスワード"
        placeholder="8文字以上で入力"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <AuthFormField
        id="login-username"
        name="username"
        type="text"
        label="ユーザーネーム"
        placeholder="yamada_taro"
        autoComplete="username"
        required
        value={username}
        onChange={(event) => setUsername(event.target.value)}
      />

      <div className="flex justify-center pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="min-h-12 rounded-base bg-primary px-16 py-2 text-3xl tracking-[0.15em] text-white shadow-[0_4px_3px_rgb(0_0_0/0.28)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {isSubmitting ? "ログイン中..." : "ログイン"}
        </button>
      </div>
    </form>
  );
}
