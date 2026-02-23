"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createJob } from "@/utils/mutations";
import { CreateJobRequest, JobType } from "@/utils/interfaces";

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: "process", label: "Process" },
  { value: "analyze", label: "Analyze" },
  { value: "export", label: "Export" },
];

export default function CreateJobForm() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [jobType, setJobType] = useState<JobType>("process");

  const mutation = useMutation({
    mutationFn: (data: CreateJobRequest) => createJob(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      setName("");
      setJobType("process");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ name, job_type: jobType });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Create Job</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error banner */}
        {mutation.isError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <span className="mt-0.5 shrink-0 text-red-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </span>
            <span>{(mutation.error as Error).message}</span>
          </div>
        )}

        {/* Success banner */}
        {mutation.isSuccess && (
          <div
            role="status"
            className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700"
          >
            Job created successfully!
          </div>
        )}

        {/* Name */}
        <div>
          <label
            htmlFor="job-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name <span className="text-red-500">*</span>
          </label>
          <input
            id="job-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My background job"
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Job Type */}
        <div>
          <label
            htmlFor="job-type"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Job Type
          </label>
          <select
            id="job-type"
            value={jobType}
            onChange={(e) => setJobType(e.target.value as JobType)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {JOB_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 transition-colors"
        >
          {mutation.isPending ? "Creating…" : "Create Job"}
        </button>
      </form>
    </div>
  );
}
