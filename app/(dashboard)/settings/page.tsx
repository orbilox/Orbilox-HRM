import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, Calendar, Gift, UserCog, Plus, Trash2 } from "lucide-react";

async function getSettingsData() {
  const [company, departments, leaveTypes, holidays, users] = await Promise.all([
    db.company.findFirst(),
    db.department.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { employees: true } } } }),
    db.leaveType.findMany({ orderBy: { name: "asc" } }),
    db.holiday.findMany({ orderBy: { date: "asc" } }),
    db.user.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  return { company, departments, leaveTypes, holidays, users };
}

const roleVariant: Record<string, "destructive" | "warning" | "success" | "secondary"> = {
  ADMIN: "destructive",
  HR: "warning",
  MANAGER: "success",
  EMPLOYEE: "secondary",
};

export default async function SettingsPage() {
  const { company, departments, leaveTypes, holidays, users } = await getSettingsData();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage company settings and configurations</p>
      </div>

      <Tabs defaultValue="company">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="company">
            <Building2 className="w-4 h-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="departments">
            <Users className="w-4 h-4 mr-2" />
            Departments
          </TabsTrigger>
          <TabsTrigger value="leave-types">
            <Calendar className="w-4 h-4 mr-2" />
            Leave Types
          </TabsTrigger>
          <TabsTrigger value="holidays">
            <Gift className="w-4 h-4 mr-2" />
            Holidays
          </TabsTrigger>
          <TabsTrigger value="users">
            <UserCog className="w-4 h-4 mr-2" />
            Users
          </TabsTrigger>
        </TabsList>

        {/* Company Tab */}
        <TabsContent value="company">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold">Company Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Company Name</label>
                  <input
                    name="name"
                    defaultValue={company?.name ?? ""}
                    placeholder="e.g. Acme Corp"
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Industry</label>
                  <input
                    name="industry"
                    defaultValue={company?.industry ?? ""}
                    placeholder="e.g. Technology"
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={company?.email ?? ""}
                    placeholder="hr@company.com"
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <input
                    name="phone"
                    defaultValue={company?.phone ?? ""}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    name="address"
                    defaultValue={company?.address ?? ""}
                    placeholder="Full company address"
                    rows={3}
                    className="w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button type="submit">Save Company Settings</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Departments Tab */}
        <TabsContent value="departments">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Departments</CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Department
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {departments.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No departments yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {departments.map((dept) => (
                    <div key={dept.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium text-gray-900">{dept.name}</div>
                        {dept.description && (
                          <div className="text-xs text-gray-400 mt-0.5">{dept.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">{dept._count.employees} employees</span>
                        <button className="text-red-400 hover:text-red-600 transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Types Tab */}
        <TabsContent value="leave-types">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Leave Types</CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Leave Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {leaveTypes.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No leave types configured</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-3 font-medium text-gray-500">Leave Type</th>
                        <th className="text-left pb-3 font-medium text-gray-500">Days Allowed</th>
                        <th className="text-left pb-3 font-medium text-gray-500">Carry Forward</th>
                        <th className="text-left pb-3 font-medium text-gray-500">Paid</th>
                        <th className="text-right pb-3 font-medium text-gray-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {leaveTypes.map((lt) => (
                        <tr key={lt.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <span
                                className="w-3 h-3 rounded-full shrink-0"
                                style={{ backgroundColor: lt.color }}
                              />
                              <div>
                                <div className="font-medium text-gray-900">{lt.name}</div>
                                {lt.description && (
                                  <div className="text-xs text-gray-400">{lt.description}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 pr-4 font-medium text-gray-700">{lt.daysAllowed} days</td>
                          <td className="py-3 pr-4">
                            <Badge variant={lt.carryForward ? "success" : "secondary"} className="text-xs">
                              {lt.carryForward ? "Yes" : "No"}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant={lt.isPaid ? "success" : "secondary"} className="text-xs">
                              {lt.isPaid ? "Paid" : "Unpaid"}
                            </Badge>
                          </td>
                          <td className="py-3 text-right">
                            <button className="text-red-400 hover:text-red-600 transition-colors p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Holidays Tab */}
        <TabsContent value="holidays">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">Holidays</CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Holiday
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {holidays.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Gift className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No holidays added yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {holidays.map((holiday) => (
                    <div key={holiday.id} className="flex items-center justify-between py-3">
                      <div>
                        <div className="font-medium text-gray-900">{holiday.name}</div>
                        {holiday.description && (
                          <div className="text-xs text-gray-400 mt-0.5">{holiday.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm text-gray-600">
                            {new Date(holiday.date).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </div>
                          <Badge variant="secondary" className="text-xs mt-0.5">{holiday.type}</Badge>
                        </div>
                        <button className="text-red-400 hover:text-red-600 transition-colors p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">System Users</CardTitle>
            </CardHeader>
            <CardContent>
              {users.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <UserCog className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No users found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-3 font-medium text-gray-500">Email</th>
                        <th className="text-left pb-3 font-medium text-gray-500">Role</th>
                        <th className="text-left pb-3 font-medium text-gray-500">Linked Employee</th>
                        <th className="text-left pb-3 font-medium text-gray-500">Created</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-xs font-bold shrink-0">
                                {user.email[0].toUpperCase()}
                              </div>
                              <span className="text-gray-900">{user.email}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <Badge variant={roleVariant[user.role] ?? "secondary"} className="text-xs">
                              {user.role}
                            </Badge>
                          </td>
                          <td className="py-3 pr-4 text-gray-500 text-xs">
                            {user.employeeId ? (
                              <span className="text-green-600 font-medium">Linked</span>
                            ) : (
                              <span className="text-gray-400">Not linked</span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-gray-500 text-xs">
                            {new Date(user.createdAt).toLocaleDateString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
