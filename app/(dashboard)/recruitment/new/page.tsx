import { db } from "@/lib/db";
import JobForm from "@/components/recruitment/job-form";

export default async function NewJobPage() {
  const departments = await db.department.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Post New Job</h1>
        <p className="text-gray-500 mt-1">Fill in the details to create a new job posting</p>
      </div>
      <JobForm departments={departments} />
    </div>
  );
}
