import { db } from "@/lib/db";
import EmployeeForm from "@/components/employees/employee-form";

export default async function NewEmployeePage() {
  const departments = await db.department.findMany({ orderBy: { name: "asc" } });
  const managers = await db.employee.findMany({
    where: { status: "ACTIVE" },
    select: { id: true, firstName: true, lastName: true, designation: true },
    orderBy: { firstName: "asc" },
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New Employee</h1>
        <p className="text-gray-500 mt-1">Fill in the employee details below</p>
      </div>
      <EmployeeForm departments={departments} managers={managers} />
    </div>
  );
}
