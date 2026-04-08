import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatDate, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { ArrowLeft, Edit, Mail, Phone, MapPin, Calendar, Briefcase, DollarSign } from "lucide-react";

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employee = await db.employee.findUnique({
    where: { id },
    include: {
      department: true,
      manager: true,
      attendance: { orderBy: { date: "desc" }, take: 10 },
      leaves: { orderBy: { createdAt: "desc" }, take: 5, include: { leaveType: true } },
      payslips: { orderBy: { year: "desc" }, take: 6 },
      documents: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!employee) notFound();

  const statusColor: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
    ACTIVE: "success", INACTIVE: "secondary", RESIGNED: "warning", TERMINATED: "destructive",
  };

  const grossSalary = employee.basicSalary + employee.hra + employee.da + employee.ta + employee.otherAllowance;
  const totalDeductions = employee.pfEmployee + employee.esiEmployee + employee.professionalTax;
  const netSalary = grossSalary - totalDeductions;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/employees">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              {employee.firstName[0]}{employee.lastName[0]}
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{employee.firstName} {employee.lastName}</h1>
              <p className="text-gray-500 text-sm">{employee.designation} · {employee.employeeCode}</p>
            </div>
            <Badge variant={statusColor[employee.status] ?? "secondary"} className="ml-2">{employee.status}</Badge>
          </div>
        </div>
        <Link href={`/employees/${employee.id}/edit`}>
          <Button variant="outline" size="sm"><Edit className="w-4 h-4 mr-2" />Edit</Button>
        </Link>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="leaves">Leaves</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2"><Mail className="w-4 h-4" />Contact</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm"><Mail className="w-4 h-4 text-gray-400" /><span>{employee.email}</span></div>
                {employee.phone && <div className="flex items-center gap-2 text-sm"><Phone className="w-4 h-4 text-gray-400" /><span>{employee.phone}</span></div>}
                {employee.city && <div className="flex items-center gap-2 text-sm"><MapPin className="w-4 h-4 text-gray-400" /><span>{[employee.address, employee.city, employee.state].filter(Boolean).join(", ")}</span></div>}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2"><Briefcase className="w-4 h-4" />Work Details</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Department</span><span className="font-medium">{employee.department?.name ?? "—"}</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-gray-500">Manager</span><span className="font-medium">{employee.manager ? `${employee.manager.firstName} ${employee.manager.lastName}` : "—"}</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-gray-500">Employment Type</span><span className="font-medium">{employee.employmentType.replace("_", " ")}</span></div>
                <Separator />
                <div className="flex justify-between"><span className="text-gray-500">Joining Date</span><span className="font-medium">{formatDate(employee.joiningDate)}</span></div>
                {employee.workLocation && (
                  <>
                    <Separator />
                    <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="font-medium">{employee.workLocation}</span></div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Salary Summary */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-gray-600 flex items-center gap-2"><DollarSign className="w-4 h-4" />Salary Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="p-3 bg-blue-50 rounded-lg"><div className="text-blue-600 font-bold text-lg">{formatCurrency(employee.basicSalary)}</div><div className="text-gray-500 text-xs mt-0.5">Basic Salary</div></div>
                <div className="p-3 bg-green-50 rounded-lg"><div className="text-green-600 font-bold text-lg">{formatCurrency(grossSalary)}</div><div className="text-gray-500 text-xs mt-0.5">Gross Salary</div></div>
                <div className="p-3 bg-orange-50 rounded-lg"><div className="text-orange-600 font-bold text-lg">{formatCurrency(totalDeductions)}</div><div className="text-gray-500 text-xs mt-0.5">Deductions</div></div>
                <div className="p-3 bg-purple-50 rounded-lg"><div className="text-purple-600 font-bold text-lg">{formatCurrency(netSalary)}</div><div className="text-gray-500 text-xs mt-0.5">Net Salary</div></div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance */}
        <TabsContent value="attendance" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Recent Attendance</CardTitle></CardHeader>
            <CardContent>
              {employee.attendance.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No attendance records found</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-gray-500"><th className="text-left pb-2">Date</th><th className="text-left pb-2">Check In</th><th className="text-left pb-2">Check Out</th><th className="text-left pb-2">Hours</th><th className="text-left pb-2">Status</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {employee.attendance.map((a) => (
                      <tr key={a.id} className="hover:bg-gray-50">
                        <td className="py-2">{formatDate(a.date)}</td>
                        <td className="py-2">{a.checkIn ? new Date(a.checkIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                        <td className="py-2">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                        <td className="py-2">{a.hoursWorked?.toFixed(1) ?? "—"}h</td>
                        <td className="py-2"><Badge variant={a.status === "PRESENT" ? "success" : "secondary"} className="text-xs">{a.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaves */}
        <TabsContent value="leaves" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Leave History</CardTitle></CardHeader>
            <CardContent>
              {employee.leaves.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No leave records found</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-gray-500"><th className="text-left pb-2">Type</th><th className="text-left pb-2">From</th><th className="text-left pb-2">To</th><th className="text-left pb-2">Days</th><th className="text-left pb-2">Status</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {employee.leaves.map((l) => (
                      <tr key={l.id} className="hover:bg-gray-50">
                        <td className="py-2">{l.leaveType.name}</td>
                        <td className="py-2">{formatDate(l.startDate)}</td>
                        <td className="py-2">{formatDate(l.endDate)}</td>
                        <td className="py-2">{l.days}</td>
                        <td className="py-2"><Badge variant={l.status === "APPROVED" ? "success" : l.status === "REJECTED" ? "destructive" : "warning"} className="text-xs">{l.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll */}
        <TabsContent value="payroll" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Payslip History</CardTitle></CardHeader>
            <CardContent>
              {employee.payslips.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No payslips generated yet</p>
              ) : (
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-gray-500"><th className="text-left pb-2">Period</th><th className="text-right pb-2">Gross</th><th className="text-right pb-2">Deductions</th><th className="text-right pb-2">Net</th><th className="text-left pb-2">Status</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {employee.payslips.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50">
                        <td className="py-2">{new Date(p.year, p.month - 1).toLocaleString("en-IN", { month: "long", year: "numeric" })}</td>
                        <td className="py-2 text-right">{formatCurrency(p.grossSalary)}</td>
                        <td className="py-2 text-right text-red-600">{formatCurrency(p.totalDeductions)}</td>
                        <td className="py-2 text-right font-semibold text-green-600">{formatCurrency(p.netSalary)}</td>
                        <td className="py-2"><Badge variant={p.status === "PUBLISHED" ? "success" : "secondary"} className="text-xs">{p.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Documents */}
        <TabsContent value="documents" className="mt-4">
          <Card className="border-0 shadow-sm">
            <CardHeader><CardTitle className="text-base">Documents</CardTitle></CardHeader>
            <CardContent>
              {employee.documents.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No documents uploaded yet</p>
              ) : (
                <div className="space-y-2">
                  {employee.documents.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <div className="font-medium text-sm">{doc.name}</div>
                        <div className="text-xs text-gray-400">{doc.type} · {formatDate(doc.createdAt)}</div>
                      </div>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 text-xs hover:underline">View</a>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
