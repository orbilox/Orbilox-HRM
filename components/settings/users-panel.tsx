"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Plus, X, Loader2, Eye, EyeOff } from "lucide-react";

interface User {
  id: string;
  email: string;
  role: string;
  employeeId: string | null;
  createdAt: string;
  employee?: { firstName: string; lastName: string } | null;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  employeeCode: string;
}

const roleVariant: Record<string, "destructive" | "warning" | "success" | "secondary"> = {
  ADMIN: "destructive",
  HR: "warning",
  MANAGER: "success",
  EMPLOYEE: "secondary",
};

export default function UsersPanel({
  initialUsers,
  employees,
}: {
  initialUsers: User[];
  employees: Employee[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPwd, setShowPwd] = useState(false);

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("Welcome@123");
  const [role, setRole] = useState("EMPLOYEE");
  const [employeeId, setEmployeeId] = useState("");

  // When an employee is selected, auto-fill their email
  function handleEmployeeSelect(empId: string) {
    setEmployeeId(empId);
    if (empId) {
      const emp = employees.find((e) => e.id === empId);
      if (emp) setEmail(emp.email);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, employeeId: employeeId || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create user");
      // Refresh list
      const listRes = await fetch("/api/users");
      if (listRes.ok) setUsers(await listRes.json());
      setShowDialog(false);
      setEmail(""); setPassword("Welcome@123"); setRole("EMPLOYEE"); setEmployeeId("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  // Employees that don't already have a login
  const unlinkedEmployees = employees.filter(
    (emp) => !users.some((u) => u.employeeId === emp.id)
  );

  return (
    <div>
      {/* Header with Add button */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-500">{users.length} user account{users.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Login
        </Button>
      </div>

      {/* Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Create User Login</h2>
              <button onClick={() => { setShowDialog(false); setError(""); }} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Link to existing employee (optional) */}
              <div className="space-y-1.5">
                <Label>Link to Employee (optional)</Label>
                <Select value={employeeId} onValueChange={handleEmployeeSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— No employee link —</SelectItem>
                    {unlinkedEmployees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeCode})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400">Only shows employees without a login</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="u-email">Email *</Label>
                <Input
                  id="u-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="employee@company.com"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="u-password">Password *</Label>
                <div className="relative">
                  <Input
                    id="u-password"
                    type={showPwd ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400">Default: Welcome@123</p>
              </div>

              <div className="space-y-1.5">
                <Label>Role *</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Create Login
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowDialog(false); setError(""); }}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users table */}
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
                    {user.employee ? (
                      <span className="text-green-600 font-medium">
                        {user.employee.firstName} {user.employee.lastName}
                      </span>
                    ) : user.employeeId ? (
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
    </div>
  );
}
