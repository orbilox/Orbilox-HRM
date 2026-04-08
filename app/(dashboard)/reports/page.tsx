import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart3, Calendar, DollarSign, Users, Download, Clock,
  Target, Briefcase, FileText, TrendingUp
} from "lucide-react";

async function getReportSummary() {
  const [employees, attendance, leaves, payslips] = await Promise.all([
    db.employee.count({ where: { status: "ACTIVE" } }),
    db.attendance.count({ where: { date: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) } } }),
    db.leave.count({ where: { status: "PENDING" } }),
    db.payslip.count({ where: { month: new Date().getMonth() + 1, year: new Date().getFullYear() } }),
  ]);
  return { employees, attendance, leaves, payslips };
}

const reports = [
  {
    title: "Employee Report",
    description: "Complete employee directory with status, department, designation, and joining dates.",
    icon: Users,
    color: "bg-blue-50 text-blue-600",
    border: "border-blue-100",
    badge: "HR",
    href: "/api/reports/employees",
  },
  {
    title: "Attendance Report",
    description: "Monthly attendance summary, present/absent counts, and hours worked per employee.",
    icon: Clock,
    color: "bg-green-50 text-green-600",
    border: "border-green-100",
    badge: "Monthly",
    href: "/api/reports/attendance",
  },
  {
    title: "Leave Report",
    description: "Leave balance, utilization, and pending approvals across all leave types.",
    icon: Calendar,
    color: "bg-orange-50 text-orange-600",
    border: "border-orange-100",
    badge: "Quarterly",
    href: "/api/reports/leaves",
  },
  {
    title: "Payroll Report",
    description: "Monthly payroll summary with gross salary, deductions, and net pay for all employees.",
    icon: DollarSign,
    color: "bg-teal-50 text-teal-600",
    border: "border-teal-100",
    badge: "Monthly",
    href: "/api/reports/payroll",
  },
  {
    title: "Performance Report",
    description: "Goal completion rates, review scores, and employee performance trends.",
    icon: Target,
    color: "bg-purple-50 text-purple-600",
    border: "border-purple-100",
    badge: "Annual",
    href: "/api/reports/performance",
  },
  {
    title: "Recruitment Report",
    description: "Candidate pipeline, time-to-hire, offer acceptance rates, and job fill ratios.",
    icon: Briefcase,
    color: "bg-pink-50 text-pink-600",
    border: "border-pink-100",
    badge: "ATS",
    href: "/api/reports/recruitment",
  },
  {
    title: "Headcount & Attrition",
    description: "Workforce headcount trends, department distribution, and attrition analysis.",
    icon: TrendingUp,
    color: "bg-indigo-50 text-indigo-600",
    border: "border-indigo-100",
    badge: "Workforce",
    href: "/api/reports/headcount",
  },
  {
    title: "Document Report",
    description: "Document compliance — track which employees have missing or expired documents.",
    icon: FileText,
    color: "bg-gray-50 text-gray-600",
    border: "border-gray-100",
    badge: "Compliance",
    href: "/api/reports/documents",
  },
];

export default async function ReportsPage() {
  const summary = await getReportSummary();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Generate and export HR reports</p>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Active Employees", value: summary.employees, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Attendance This Month", value: summary.attendance, icon: Clock, color: "text-green-600", bg: "bg-green-50" },
          { label: "Pending Leaves", value: summary.leaves, icon: Calendar, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Payslips Generated", value: summary.payslips, icon: BarChart3, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-2">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${s.bg}`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Cards */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4">Available Reports</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {reports.map((report) => (
            <Card key={report.title} className={`border shadow-sm hover:shadow-md transition-shadow ${report.border}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${report.color}`}>
                    <report.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {report.badge}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm mb-1">{report.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{report.description}</p>
                <Button size="sm" variant="outline" className="w-full text-xs" asChild>
                  <a href={report.href}>
                    <Download className="w-3 h-3 mr-1.5" />
                    Generate Report
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Analytics Preview */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-3 gap-6 text-sm">
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Workforce Distribution</h4>
              {[
                { label: "Full-Time", pct: 70, color: "bg-blue-500" },
                { label: "Contract", pct: 20, color: "bg-orange-400" },
                { label: "Intern", pct: 10, color: "bg-purple-400" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{item.label}</span><span>{item.pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Attendance Health</h4>
              {[
                { label: "Present", pct: 88, color: "bg-green-500" },
                { label: "On Leave", pct: 8, color: "bg-yellow-400" },
                { label: "Absent", pct: 4, color: "bg-red-400" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{item.label}</span><span>{item.pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h4 className="font-medium text-gray-700">Leave Utilization</h4>
              {[
                { label: "Annual Leave", pct: 62, color: "bg-blue-500" },
                { label: "Sick Leave", pct: 38, color: "bg-red-400" },
                { label: "Other", pct: 15, color: "bg-gray-400" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{item.label}</span><span>{item.pct}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
