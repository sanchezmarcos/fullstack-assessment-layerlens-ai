// shadcn primitives — re-exported for direct use when needed
export { Button, buttonVariants } from "@/components/ui/button";
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
export { Toaster } from "@/components/ui/sonner";
export type { ButtonProps } from "@/components/ui/button";

export { Input } from "@/components/ui/input";
export { Label } from "@/components/ui/label";
export { Textarea } from "@/components/ui/textarea";
export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Field wrapper
export { Field } from "@/components/ui/field";
export type { FieldProps } from "@/components/ui/field";

// Composed components with built-in label / hint / error
export { AppInput } from "@/components/jobs/job-input";
export type { AppInputProps } from "@/components/jobs/job-input";

export { AppSelect } from "@/components/jobs/job-select";
export type {
  AppSelectProps,
  SelectOption,
  SelectOptionGroup,
  SelectOptions,
} from "@/components/jobs/job-select";

export { AppTextarea } from "@/components/jobs/job-textarea";
export type { AppTextareaProps } from "@/components/jobs/job-textarea";
