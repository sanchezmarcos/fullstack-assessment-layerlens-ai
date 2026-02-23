"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  XCircle,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { fetchJobs } from "@/utils/queries";
import { cancelJob, retryJob } from "@/utils/mutations";
import {
  Job,
  JobStatus,
  canBeCancelled,
  canBeRetried,
  maxRetries,
} from "@/utils/interfaces";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

/* ─── Status badge ────────────────────────────────────────────────── */

const STATUS_STYLES: Record<JobStatus, string> = {
  pending: "bg-yellow-50 text-yellow-700 border-yellow-200",
  processing: "bg-blue-50 text-blue-700 border-blue-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  cancelling: "bg-orange-50 text-orange-700 border-orange-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

function StatusBadge({ status }: { status: JobStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
        STATUS_STYLES[status],
      )}
    >
      {status}
    </span>
  );
}

/* ─── Skeleton row ────────────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100 h-14">
      {[180, 80, 90, 40, 120, 80].map((w, i) => (
        <td key={i} className="px-4 py-3 align-middle">
          <div
            className="h-4 animate-pulse rounded bg-gray-100"
            style={{ width: w }}
          />
        </td>
      ))}
    </tr>
  );
}

/* ─── Job row ─────────────────────────────────────────────────────── */

const ACTIVE_STATUSES: JobStatus[] = ["pending", "processing", "cancelling"];

function JobRow({ job }: { job: Job }) {
  const queryClient = useQueryClient();

  const cancelMutation = useMutation({
    mutationFn: () => cancelJob(job.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job cancelled", {
        description: `"${job.name}" has been cancelled.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to cancel job", { description: error.message });
    },
  });

  const retryMutation = useMutation({
    mutationFn: () => retryJob(job.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs"] });
      toast.success("Job retried", {
        description: `"${job.name}" has been queued again.`,
      });
    },
    onError: (error: Error) => {
      toast.error("Failed to retry job", { description: error.message });
    },
  });

  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors h-14">
      <td className="px-4 py-3 text-sm font-medium text-gray-900 truncate max-w-[180px] align-middle">
        {job.name}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 capitalize align-middle">
        {job.jobType}
      </td>
      <td className="px-4 py-3 align-middle">
        <StatusBadge status={job.status} />
      </td>
      <td className="px-4 py-3 text-sm text-gray-400 align-middle">
        {job.retryCount > 0 ? `${job.retryCount}/${maxRetries(job)}` : "—"}
      </td>
      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap align-middle">
        {new Date(job.createdAt).toLocaleString()}
      </td>
      <td className="px-4 py-3 text-right align-middle">
        <div className="flex items-center justify-end gap-2">
          {canBeCancelled(job) && (
            <Button
              size="sm"
              variant="outline"
              className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:text-orange-800"
              onClick={() => cancelMutation.mutate()}
              loading={cancelMutation.isPending}
              leadingIcon={<XCircle className="h-3.5 w-3.5" />}
            >
              Cancel
            </Button>
          )}
          {canBeRetried(job) && (
            <Button
              size="sm"
              variant="outline"
              className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
              onClick={() => retryMutation.mutate()}
              loading={retryMutation.isPending}
              leadingIcon={<RotateCw className="h-3.5 w-3.5" />}
            >
              Retry ({job.retryCount}/{maxRetries(job)})
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ─── JobList ─────────────────────────────────────────────────────── */

export default function JobList() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["jobs", { page, limit }],
    queryFn: () => fetchJobs(page, limit),
    refetchInterval: (query) => {
      const jobs = query.state.data?.jobs ?? [];
      const hasActive = jobs.some((j) => ACTIVE_STATUSES.includes(j.status));
      return hasActive ? 3000 : false;
    },
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 1;
  const jobs = data?.jobs ?? [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Jobs</h2>
        {!isLoading && !isError && (
          <span className="text-sm text-gray-400">
            {data?.total ?? 0} total
          </span>
        )}
      </div>

      {/* Error state */}
      {isError && (
        <div className="flex items-center gap-2 px-6 py-8 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          Failed to load jobs: {(error as Error).message}
        </div>
      )}

      {/* Table */}
      {!isError && (
        <>
          {!isLoading && jobs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-sm text-gray-400">
              <Inbox className="h-8 w-8 opacity-40" />
              No jobs yet. Create one!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed">
                <colgroup>
                  <col className="w-auto" />
                  <col className="w-24" />
                  <col className="w-28" />
                  <col className="w-16" />
                  <col className="w-40" />
                  <col className="w-48" />
                </colgroup>
                <thead>
                  <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    <th className="px-4 py-3 text-left">Name</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-left">Retries</th>
                    <th className="px-4 py-3 text-left">Created</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading
                    ? Array.from({ length: 5 }).map((_, i) => (
                        <SkeletonRow key={i} />
                      ))
                    : jobs.map((job) => <JobRow key={job.id} job={job} />)}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                leadingIcon={<ChevronLeft className="h-3.5 w-3.5" />}
              >
                Previous
              </Button>
              <span className="text-xs text-gray-400">
                Page {page} of {totalPages}
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                trailingIcon={<ChevronRight className="h-3.5 w-3.5" />}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
