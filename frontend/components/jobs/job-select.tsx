"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Field, type FieldProps } from "@/components/ui/field"

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectOptionGroup {
  groupLabel: string
  options: SelectOption[]
}

export type SelectOptions = SelectOption[] | SelectOptionGroup[]

function isGrouped(opts: SelectOptions): opts is SelectOptionGroup[] {
  return opts.length > 0 && "groupLabel" in opts[0]
}

export interface AppSelectProps extends Omit<FieldProps, "children"> {
  id: string
  /** Flat or grouped options */
  options: SelectOptions
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  /** Loading state — renders a skeleton */
  loading?: boolean
  className?: string
}

/**
 * Composed Select with support for:
 * - label, hint, error (via Field)
 * - flat or grouped options
 * - placeholder
 * - disabled / error / loading states
 */
export function AppSelect({
  id,
  label,
  hint,
  error,
  required,
  options,
  value,
  onValueChange,
  placeholder = "Select an option…",
  disabled,
  loading,
  className,
}: AppSelectProps) {
  if (loading) {
    return (
      <Field id={id} label={label} hint={hint} error={error} required={required}>
        <div className="h-9 w-full animate-pulse rounded-md bg-muted" />
      </Field>
    )
  }

  return (
    <Field id={id} label={label} hint={hint} error={error} required={required}>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger
          id={id}
          aria-invalid={!!error}
          className={cn(
            error && "border-destructive focus:ring-destructive",
            className
          )}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>

        <SelectContent>
          {isGrouped(options) ? (
            (options as SelectOptionGroup[]).map((group, gi) => (
              <React.Fragment key={group.groupLabel}>
                {gi > 0 && <SelectSeparator />}
                <SelectGroup>
                  <SelectLabel>{group.groupLabel}</SelectLabel>
                  {group.options.map((opt) => (
                    <SelectItem
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.disabled}
                    >
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </React.Fragment>
            ))
          ) : (
            (options as SelectOption[]).map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
                disabled={opt.disabled}
              >
                {opt.label}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </Field>
  )
}
