import type { ComponentPropsWithoutRef } from "react";

type AuthFormFieldProps = ComponentPropsWithoutRef<"input"> & {
  id: string;
  label: string;
};

export function AuthFormField({
  id,
  label,
  className,
  ...props
}: AuthFormFieldProps) {
  return (
    <div className="flex flex-col gap-3">
      <label htmlFor={id} className="text-lg text-primary">
        {label}
      </label>
      <input
        id={id}
        className={`border-0 border-b-2 border-primary bg-transparent px-1 pb-1 text-lg text-foreground placeholder:text-foreground/40 focus:border-foreground focus:outline-none ${className ?? ""}`}
        {...props}
      />
    </div>
  );
}
