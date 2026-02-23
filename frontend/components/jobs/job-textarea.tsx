"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"
import { Field, type FieldProps } from "@/components/ui/field"

export interface AppTextareaProps
  extends Omit<React.ComponentProps<"textarea">, "id">,
    Omit<FieldProps, "children" | "id"> {
  id: string
  /** Character limit — shows a counter when specified */
  maxChars?: number
  /** Loading state — renders a skeleton */
  loading?: boolean
}

/**
 * Composed Textarea with support for:
 * - label, hint, error (via Field)
 * - character counter (maxChars)
 * - disabled / read-only / error / loading states
 */
export const AppTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AppTextareaProps
>(
  (
    {
      id,
      label,
      hint,
      error,
      required,
      maxChars,
      loading,
      disabled,
      className,
      value,
      onChange,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(
      (value as string) ?? ""
    )

    // Sync when controlled externally
    React.useEffect(() => {
      if (value !== undefined) setInternalValue(value as string)
    }, [value])

    const charCount =
      value !== undefined
        ? String(value).length
        : internalValue.length

    const isOverLimit = maxChars !== undefined && charCount > maxChars

    function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
      if (value === undefined) setInternalValue(e.target.value)
      onChange?.(e)
    }

    return (
      <Field id={id} label={label} hint={hint} error={error} required={required}>
        {loading ? (
          <div className="h-20 w-full animate-pulse rounded-md bg-muted" />
        ) : (
          <div className="relative">
            <Textarea
              id={id}
              ref={ref}
              disabled={disabled}
              aria-invalid={!!error || isOverLimit}
              aria-describedby={
                error ? `${id}-error` : hint ? `${id}-hint` : undefined
              }
              value={value !== undefined ? value : internalValue}
              onChange={handleChange}
              className={cn(
                error || isOverLimit
                  ? "border-destructive focus-visible:ring-destructive"
                  : "",
                maxChars && "pb-6",
                className
              )}
              {...props}
            />

            {/* Character counter */}
            {maxChars !== undefined && (
              <span
                aria-live="polite"
                className={cn(
                  "absolute bottom-2 right-3 text-xs",
                  isOverLimit
                    ? "font-semibold text-destructive"
                    : "text-muted-foreground"
                )}
              >
                {charCount}/{maxChars}
              </span>
            )}
          </div>
        )}
      </Field>
    )
  }
)
AppTextarea.displayName = "AppTextarea"
