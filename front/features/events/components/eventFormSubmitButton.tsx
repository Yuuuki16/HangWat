import type { ComponentPropsWithoutRef } from "react";

type EventFormSubmitButtonProps = ComponentPropsWithoutRef<"button">;

export function EventFormSubmitButton({
  className,
  children,
  ...props
}: EventFormSubmitButtonProps) {
  return (
    <button
      type="submit"
      className={`min-h-12 rounded-base bg-primary px-12 py-2 text-2xl text-white shadow-[0_4px_3px_rgb(0_0_0/0.28)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}
