import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          "flex h-11 w-full rounded-xl border border-border bg-white px-4 text-sm text-foreground outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";
