import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

export interface FieldProps {
  /** Id that links the label to the control */
  id?: string
  label?: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: React.ReactNode
}

/**
 * Reusable wrapper that wraps any control (Input / Select / Textarea)
 * with a standardized label, hint text, and error message.
 */
export function Field({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <Label
          htmlFor={id}
          className={cn(error && "text-destructive")}
        >
          {label}
          {required && (
            <span className="ml-0.5 text-destructive" aria-hidden>
              *
            </span>
          )}
        </Label>
      )}

      {children}

      {/* Hint — only shown when there is no error */}
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}

      {/* Error */}
      {error && (
        <p role="alert" className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
