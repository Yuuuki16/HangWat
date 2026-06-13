import type { ComponentPropsWithoutRef } from "react";

type InputProps = ComponentPropsWithoutRef<"input">;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={`border-0 border-b-2 border-primary bg-transparent px-1 pb-1 text-lg text-foreground placeholder:text-foreground/40 focus:border-foreground focus:outline-none ${className ?? ""}`}
      {...props}
    />
  );
}
