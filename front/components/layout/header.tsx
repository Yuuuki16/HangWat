import { ArrowLeft } from "lucide-react";
import Link from "next/link";

type HeaderProps = {
  backLink?: {
    href: string;
    label: string;
  };
  showProfile?: boolean;
};

export function Header({ backLink, showProfile = true }: HeaderProps) {
  return (
    <header className="grid h-[60px] w-full shrink-0 grid-cols-[1fr_auto_1fr] items-center border-b border-primary bg-background px-5 border-b-2">
      {backLink ? (
        <Link
          href={backLink.href}
          className="flex w-fit items-center gap-1 text-sm text-primary transition-opacity hover:opacity-70 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <ArrowLeft aria-hidden="true" size={16} strokeWidth={3} />
          <span>{backLink.label}</span>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}

      <Link
        href="/home"
        className="font-title text-2xl leading-none text-primary drop-shadow-[0_2px_1px_rgb(0_0_0/0.18)] focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        HangWat
      </Link>

      {showProfile ? (
        <Link
          href="/login"
          aria-label="プロフィール"
          className="justify-self-end rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span className="block size-7 rounded-full bg-zinc-300" />
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
    </header>
  );
}
