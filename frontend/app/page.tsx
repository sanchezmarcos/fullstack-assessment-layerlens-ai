import JobFormCreate from "@/components/jobs/job-form-create";
import JobList from "@/components/jobs/job-list";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="mx-auto max-w-5xl px-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Job Processing System
          </h1>
          <JobFormCreate />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8">
        <JobList />
      </div>
    </main>
  );
}
