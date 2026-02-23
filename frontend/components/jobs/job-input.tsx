"use client"

import * as React from "react"
import { Eye, EyeOff, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Field, type FieldProps } from "@/components/ui/field"

export interface AppInputProps
  extends Omit<React.ComponentProps<"input">, "id">,
    Omit<FieldProps, "children" | "id"> {
  id: string
  /** Icon or element displayed at the start of the input */
  leadingIcon?: React.ReactNode
  /** Icon or element displayed at the end of the input (ignored when clearable or passwordToggle is set) */
  trailingIcon?: React.ReactNode
  /** Shows a × button to clear the value */
  clearable?: boolean
  /** Enables show/hide toggle for password inputs (type="password") */
  passwordToggle?: boolean
  /** Loading state — renders an animated skeleton */
  loading?: boolean
  onClear?: () => void
}

/**
 * Composed Input with support for:
 * - label, hint, error (via Field)
 * - leading / trailing icon
 * - clear button (clearable)
 * - password visibility toggle (passwordToggle)
 * - disabled / read-only / error / loading states
 */
export const AppInput = React.forwardRef<HTMLInputElement, AppInputProps>(
  (
    {
      id,
      label,
      hint,
      error,
      required,
      className,
      leadingIcon,
      trailingIcon,
      clearable,
      passwordToggle,
      loading,
      onClear,
      type,
      value,
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = React.useState(false)

    const resolvedType =
      passwordToggle
        ? showPassword
          ? "text"
          : "password"
        : type

    const hasTrailing = clearable || passwordToggle || trailingIcon

    return (
      <Field
        id={id}
        label={label}
        hint={hint}
        error={error}
        required={required}
      >
        <div className="relative flex items-center">
          {/* Leading icon */}
          {leadingIcon && (
            <span className="pointer-events-none absolute left-3 flex items-center text-muted-foreground">
              {leadingIcon}
            </span>
          )}

          {/* Loading skeleton */}
          {loading ? (
            <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
          ) : (
            <Input
              id={id}
              ref={ref}
              type={resolvedType}
              value={value}
              disabled={disabled}
              aria-invalid={!!error}
              aria-describedby={
                error ? `${id}-error` : hint ? `${id}-hint` : undefined
              }
              className={cn(
                leadingIcon && "pl-9",
                hasTrailing && "pr-9",
                error &&
                  "border-destructive focus-visible:ring-destructive",
                className
              )}
              {...props}
            />
          )}

          {/* Trailing: clear button */}
          {!loading && clearable && value && !disabled && (
            <button
              type="button"
              aria-label="Clear input"
              onClick={onClear}
              className="absolute right-3 flex items-center text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {/* Trailing: password toggle */}
          {!loading && passwordToggle && (
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 flex items-center text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Trailing: custom icon (only when clearable and passwordToggle are not set) */}
          {!loading && !clearable && !passwordToggle && trailingIcon && (
            <span className="pointer-events-none absolute right-3 flex items-center text-muted-foreground">
              {trailingIcon}
            </span>
          )}
        </div>
      </Field>
    )
  }
)
AppInput.displayName = "AppInput"
