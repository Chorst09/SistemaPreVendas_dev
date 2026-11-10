import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const inputVariants = cva(
  "flex h-11 w-full rounded-lg px-4 py-2.5 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-200 ease-out",
  {
    variants: {
      variant: {
        default: "border border-input bg-background hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 focus-visible:border-primary",
        success: "border border-accent-green/50 bg-background hover:border-accent-green focus-visible:ring-2 focus-visible:ring-accent-green/20 focus-visible:border-accent-green",
        error: "border border-destructive/50 bg-background hover:border-destructive focus-visible:ring-2 focus-visible:ring-destructive/20 focus-visible:border-destructive",
        ghost: "border-0 bg-transparent hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-primary/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface InputProps
  extends React.ComponentProps<"input">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
