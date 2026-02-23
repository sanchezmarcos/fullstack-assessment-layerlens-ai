import CreateJobForm from "@/components/CreateJobForm";
import JobList from "@/components/JobList";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-bold text-gray-900">Job Processing System</h1>
      </header>

      <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
        <CreateJobForm />
        <JobList />
      </div>
    </main>
  );
}
