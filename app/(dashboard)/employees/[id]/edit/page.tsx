import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import EmployeeForm from "@/components/employees/employee-form";

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [employee, departments, managers] = await Promise.all([
    db.employee.findUnique({ where: { id } }),
    db.department.findMany({ orderBy: { name: "asc" } }),
    db.employee.findMany({
      where: { status: "ACTIVE", NOT: { id } },
      select: { id: true, firstName: true, lastName: true, designation: true },
      orderBy: { firstName: "asc" },
    }),
  ]);

  if (!employee) notFound();

  // Serialize dates to strings for client component
  const serialized = {
    ...employee,
    dateOfBirth: employee.dateOfBirth?.toISOString().split("T")[0] ?? "",
    joiningDate: employee.joiningDate.toISOString().split("T")[0],
    probationEnd: employee.probationEnd?.toISOString().split("T")[0] ?? "",
    confirmDate: employee.confirmDate?.toISOString().split("T")[0] ?? "",
    exitDate: employee.exitDate?.toISOString().split("T")[0] ?? "",
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Employee</h1>
        <p className="text-gray-500 mt-1">
          {employee.firstName} {employee.lastName} — {employee.employeeCode}
        </p>
      </div>
      <EmployeeForm departments={departments} managers={managers} employee={serialized as Record<string, unknown>} />
    </div>
  );
}
