import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

const buttonVariants = cva("button", {
  variants: { variant: { default: "button-primary", secondary: "button-secondary" } },
  defaultVariants: { variant: "default" },
});

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, asChild, ...props }: ButtonProps) {
  const Component = asChild ? Slot : "button";
  return <Component className={`${buttonVariants({ variant })} ${className ?? ""}`} {...props} />;
}
