import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UserPlus, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function getEmployees(search?: string) {
  return db.employee.findMany({
    where: search
      ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
            { employeeCode: { contains: search } },
          ],
        }
      : undefined,
    include: { department: true },
    orderBy: { createdAt: "desc" },
  });
}

const statusColor: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
  ACTIVE: "success",
  INACTIVE: "secondary",
  RESIGNED: "warning",
  TERMINATED: "destructive",
};

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const params = await searchParams;
  const employees = await getEmployees(params.search);

  const summary = {
    total: employees.length,
    active: employees.filter((e) => e.status === "ACTIVE").length,
    fullTime: employees.filter((e) => e.employmentType === "FULL_TIME").length,
    departments: new Set(employees.map((e) => e.departmentId).filter(Boolean)).size,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-500 mt-1">Manage your workforce</p>
        </div>
        <Link href="/employees/new">
          <Button>
            <UserPlus className="w-4 h-4 mr-2" />
            Add Employee
          </Button>
        </Link>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total", value: summary.total, color: "text-blue-600" },
          { label: "Active", value: summary.active, color: "text-green-600" },
          { label: "Full-Time", value: summary.fullTime, color: "text-purple-600" },
          { label: "Departments", value: summary.departments, color: "text-orange-600" },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" /> Employee Directory
            </CardTitle>
            <form className="flex-1 max-w-sm ml-auto">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="search"
                  type="text"
                  placeholder="Search employees..."
                  defaultValue={params.search}
                  className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No employees found</p>
              <p className="text-sm mt-1">Add your first employee to get started</p>
              <Link href="/employees/new">
                <Button className="mt-4" size="sm">Add Employee</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-3 font-medium text-gray-500">Employee</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Code</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Department</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Designation</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Type</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Joining Date</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Status</th>
                    <th className="text-right pb-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {emp.firstName[0]}{emp.lastName[0]}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{emp.firstName} {emp.lastName}</div>
                            <div className="text-xs text-gray-400">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 font-mono text-xs">{emp.employeeCode}</td>
                      <td className="py-3 pr-4 text-gray-600">{emp.department?.name ?? "—"}</td>
                      <td className="py-3 pr-4 text-gray-600">{emp.designation ?? "—"}</td>
                      <td className="py-3 pr-4">
                        <span className="text-xs text-gray-500">{emp.employmentType.replace("_", " ")}</span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500">{formatDate(emp.joiningDate)}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={statusColor[emp.status] ?? "secondary"} className="text-xs">
                          {emp.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Link href={`/employees/${emp.id}`} className="text-blue-600 hover:underline text-xs font-medium">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
