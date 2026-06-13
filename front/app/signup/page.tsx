import { SignupForm } from "@/features/auth/components/signupForm";
import { SignupPrompt } from "@/features/auth/components/signupPrompt";

export default function SignupPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 pb-20 pt-24">
      <div className="flex w-full max-w-md flex-col gap-6">
        <h1 className="text-center font-title text-7xl leading-[1.9] text-primary drop-shadow-[0_4px_3px_rgb(0_0_0/0.18)]">
          HangWat
        </h1>
        <p className="text-center text-2xl font-semibold tracking-[0.04em] text-foreground">
          会話しながら予定を決めよう
        </p>
      </div>

      <div className="mt-24 w-full max-w-md">
        <SignupForm />
      </div>

      <div className="mt-auto w-full max-w-md pt-16">
        <SignupPrompt description="登録済の方は" linkLabel="こちら" href="/login" />
      </div>
    </main>
  );
}
