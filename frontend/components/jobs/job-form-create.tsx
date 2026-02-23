"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Briefcase, Plus } from "lucide-react";
import { createJob } from "@/utils/mutations";
import { CreateJobRequest, JobType } from "@/utils/interfaces";
import {
  Button,
  AppInput,
  AppSelect,
  AppTextarea,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui";

const JOB_TYPE_OPTIONS = [
  { value: "process", label: "Process" },
  { value: "analyze", label: "Analyze" },
  { value: "export", label: "Export" },
];

function parseConfig(raw: string): Record<string, unknown> | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  return JSON.parse(trimmed); // throws on invalid JSON — caught by caller
}

export default function JobFormCreate() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [jobType, setJobType] = useState<JobType>("process");
  const [configRaw, setConfigRaw] = useState("");
  const [configError, setConfigError] = useState<string | undefined>();

  const mutation = useMutation({
    mutationFn: (data: CreateJobRequest) => createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setName("");
      setJobType("process");
      setConfigRaw("");
      setConfigError(undefined);
      setOpen(false);
      toast.success("Job created", {
        description: "The job has been queued successfully.",
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to create job", { description: error.message });
    },
  });

  const handleConfigChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setConfigRaw(val);
    if (!val.trim()) {
      setConfigError(undefined);
      return;
    }
    try {
      JSON.parse(val);
      setConfigError(undefined);
    } catch {
      setConfigError("Invalid JSON — please check the syntax.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let config: Record<string, unknown> | undefined;
    try {
      config = parseConfig(configRaw);
    } catch {
      setConfigError("Invalid JSON — please fix it before submitting.");
      return;
    }
    mutation.mutate({ name, job_type: jobType, config });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button leadingIcon={<Plus className="h-4 w-4" />}>
          New Job
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Job</DialogTitle>
          <DialogDescription>
            Fill in the details below to queue a new background job.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <AppInput
            id="job-name"
            label="Name"
            required
            placeholder="My background job"
            leadingIcon={<Briefcase className="h-4 w-4" />}
            clearable
            value={name}
            onChange={(e) => setName(e.target.value)}
            onClear={() => setName("")}
            error={
              mutation.isError ? (mutation.error as Error).message : undefined
            }
          />

          <AppSelect
            id="job-type"
            label="Job Type"
            options={JOB_TYPE_OPTIONS}
            value={jobType}
            onValueChange={(v) => setJobType(v as JobType)}
          />

          <AppTextarea
            id="job-config"
            label="Config (optional)"
            hint='Optional JSON configuration, e.g. {"retries": 3, "timeout": 30}'
            placeholder='{"key": "value"}'
            value={configRaw}
            onChange={handleConfigChange}
            error={configError}
            rows={4}
            spellCheck={false}
            className="font-mono text-xs"
          />

          <Button
            type="submit"
            className="w-full"
            loading={mutation.isPending}
            disabled={!!configError}
          >
            Create Job
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
