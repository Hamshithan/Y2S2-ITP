import * as React from "react"
import { cva } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80",
        secondary: "border-transparent bg-zinc-800 text-zinc-100 hover:bg-zinc-800/80",
        destructive: "border-transparent bg-red-900/30 text-red-400 hover:bg-red-900/50",
        outline: "text-zinc-100 border-zinc-700",
        success: "border-transparent bg-green-900/30 text-green-400 hover:bg-green-900/50",
        warning: "border-transparent bg-yellow-900/30 text-yellow-400 hover:bg-yellow-900/50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
