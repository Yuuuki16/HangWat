import Link from "next/link";

type SignupPromptProps = {
  description: string;
  linkLabel: string;
  href: string;
};

export function SignupPrompt({ description, linkLabel, href }: SignupPromptProps) {
  return (
    <div className="flex flex-col items-center gap-10">
      <span className="w-full border-t-2 border-dotted border-primary" />
      <p className="text-xl text-foreground">
        {description}
        <Link
          href={href}
          className="underline underline-offset-4 transition-opacity hover:opacity-70 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {linkLabel}
        </Link>
      </p>
    </div>
  );
}
