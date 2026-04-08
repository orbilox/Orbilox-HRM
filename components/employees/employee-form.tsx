"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";

interface Props {
  departments: { id: string; name: string }[];
  managers: { id: string; firstName: string; lastName: string; designation: string | null }[];
  employee?: Record<string, unknown>;
}

export default function EmployeeForm({ departments, managers, employee }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!employee;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    try {
      const res = await fetch(isEdit ? `/api/employees/${(employee as {id:string}).id}` : "/api/employees", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }
      router.push("/employees");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>}

      {/* Personal Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4"><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="firstName">First Name *</Label>
            <Input id="firstName" name="firstName" required defaultValue={employee?.firstName as string} placeholder="John" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input id="lastName" name="lastName" required defaultValue={employee?.lastName as string} placeholder="Doe" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email *</Label>
            <Input id="email" name="email" type="email" required defaultValue={employee?.email as string} placeholder="john@company.com" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" name="phone" defaultValue={employee?.phone as string} placeholder="+91 98765 43210" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dateOfBirth">Date of Birth</Label>
            <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={employee?.dateOfBirth as string} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gender">Gender</Label>
            <Select name="gender" defaultValue={(employee?.gender as string) ?? ""}>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <Label htmlFor="address">Address</Label>
            <Input id="address" name="address" defaultValue={employee?.address as string} placeholder="123 Main Street" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" defaultValue={employee?.city as string} placeholder="Mumbai" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="state">State</Label>
            <Input id="state" name="state" defaultValue={employee?.state as string} placeholder="Maharashtra" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pinCode">PIN Code</Label>
            <Input id="pinCode" name="pinCode" defaultValue={employee?.pinCode as string} placeholder="400001" />
          </div>
        </CardContent>
      </Card>

      {/* Work Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4"><CardTitle className="text-base">Work Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="designation">Designation *</Label>
            <Input id="designation" name="designation" required defaultValue={employee?.designation as string} placeholder="Software Engineer" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="departmentId">Department</Label>
            <Select name="departmentId" defaultValue={(employee?.departmentId as string) ?? ""}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="managerId">Manager</Label>
            <Select name="managerId" defaultValue={(employee?.managerId as string) ?? ""}>
              <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No manager</SelectItem>
                {managers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.firstName} {m.lastName} {m.designation ? `— ${m.designation}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="employmentType">Employment Type</Label>
            <Select name="employmentType" defaultValue={(employee?.employmentType as string) ?? "FULL_TIME"}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FULL_TIME">Full Time</SelectItem>
                <SelectItem value="PART_TIME">Part Time</SelectItem>
                <SelectItem value="CONTRACT">Contract</SelectItem>
                <SelectItem value="INTERN">Intern</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="workLocation">Work Location</Label>
            <Input id="workLocation" name="workLocation" defaultValue={employee?.workLocation as string} placeholder="Mumbai Office" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="joiningDate">Joining Date *</Label>
            <Input id="joiningDate" name="joiningDate" type="date" required
              defaultValue={employee?.joiningDate ? new Date(employee.joiningDate as string).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <Select name="status" defaultValue={(employee?.status as string) ?? "ACTIVE"}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="RESIGNED">Resigned</SelectItem>
                <SelectItem value="TERMINATED">Terminated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Salary */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4"><CardTitle className="text-base">Salary & Compensation</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { id: "basicSalary", label: "Basic Salary" },
            { id: "hra", label: "HRA" },
            { id: "da", label: "DA" },
            { id: "ta", label: "TA" },
            { id: "otherAllowance", label: "Other Allowance" },
            { id: "pfEmployee", label: "PF (Employee)" },
            { id: "pfEmployer", label: "PF (Employer)" },
            { id: "professionalTax", label: "Professional Tax" },
          ].map((f) => (
            <div key={f.id} className="space-y-1.5">
              <Label htmlFor={f.id}>{f.label} (₹)</Label>
              <Input id={f.id} name={f.id} type="number" min="0" step="0.01"
                defaultValue={(employee?.[f.id] as number) ?? 0} placeholder="0" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bank & Identity */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4"><CardTitle className="text-base">Bank & Identity</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="bankAccount">Bank Account No.</Label>
            <Input id="bankAccount" name="bankAccount" defaultValue={employee?.bankAccount as string} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input id="bankName" name="bankName" defaultValue={employee?.bankName as string} placeholder="HDFC Bank" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ifscCode">IFSC Code</Label>
            <Input id="ifscCode" name="ifscCode" defaultValue={employee?.ifscCode as string} placeholder="HDFC0001234" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="panNumber">PAN Number</Label>
            <Input id="panNumber" name="panNumber" defaultValue={employee?.panNumber as string} placeholder="ABCDE1234F" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aadharNumber">Aadhar Number</Label>
            <Input id="aadharNumber" name="aadharNumber" defaultValue={employee?.aadharNumber as string} placeholder="1234 5678 9012" />
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <Save className="w-4 h-4 mr-2" />
          {isEdit ? "Update Employee" : "Save Employee"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
