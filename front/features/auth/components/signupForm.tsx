"use client";

import { useState, type FormEvent } from "react";
import { AuthFormField } from "@/features/auth/components/authFormField";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-8">
      <AuthFormField
        id="signup-email"
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
        id="signup-password"
        name="password"
        type="password"
        label="パスワード"
        placeholder="8文字以上で入力"
        autoComplete="new-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      <AuthFormField
        id="signup-username"
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
          className="min-h-12 rounded-base border-2 border-primary bg-transparent px-16 py-2 text-3xl tracking-[0.15em] text-primary shadow-[0_4px_3px_rgb(0_0_0/0.12)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary active:translate-y-0"
        >
          新規登録
        </button>
      </div>
    </form>
  );
}
