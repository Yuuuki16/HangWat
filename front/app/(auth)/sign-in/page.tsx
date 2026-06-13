import { LoginForm } from "@/features/auth/components/loginForm";
import { SignupPrompt } from "@/features/auth/components/signupPrompt";

export default function LoginPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-10">
      <div className="flex w-full max-w-md flex-col gap-8">
        <h1 className="text-center font-title text-7xl leading-tight text-primary drop-shadow-[0_4px_3px_rgb(0_0_0/0.18)]">
          HangWat
        </h1>
        <p className="text-center text-2xl font-semibold tracking-[0.04em] text-foreground">
          会話しながら予定を決めよう
        </p>
      </div>

      <div className="mt-12 w-full max-w-md">
        <LoginForm />
      </div>

      <div className="mt-14 w-full max-w-md">
        <SignupPrompt description="新規の方は" linkLabel="こちら" href="/sign-up" />
      </div>
    </main>
  );
}
