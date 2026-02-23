"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchJobs } from "@/utils/queries";
import { Job, JobStatus } from "@/utils/interfaces";

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
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

function JobRow({ job }: { job: Job }) {
  return (
    <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-sm font-medium text-gray-900 truncate max-w-[200px]">
        {job.name}
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 capitalize">{job.jobType}</td>
      <td className="px-4 py-3">
        <StatusBadge status={job.status} />
      </td>
      {job.retryCount > 0 && (
        <td className="px-4 py-3 text-sm text-gray-400">
          Retries: {job.retryCount}
        </td>
      )}
      {job.retryCount === 0 && <td className="px-4 py-3" />}
      <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
        {new Date(job.createdAt).toLocaleString()}
      </td>
    </tr>
  );
}

export default function JobList() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["jobs", { page, limit }],
    queryFn: () => fetchJobs(page, limit),
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 1;

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-sm text-gray-400">
        Loading jobs…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 text-center text-sm text-red-600">
        Failed to load jobs: {(error as Error).message}
      </div>
    );
  }

  const jobs = data?.jobs ?? [];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-800">Jobs</h2>
        <span className="text-sm text-gray-400">{data?.total ?? 0} total</span>
      </div>

      {jobs.length === 0 ? (
        <p className="px-6 py-8 text-center text-sm text-gray-400">
          No jobs yet. Create one!
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Retries</th>
                <th className="px-4 py-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-xs text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
