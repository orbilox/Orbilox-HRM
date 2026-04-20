"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Eye, EyeOff, KeyRound } from "lucide-react";

interface Props {
  departments: { id: string; name: string }[];
  managers: { id: string; firstName: string; lastName: string; designation: string | null }[];
  employee?: Record<string, unknown>;
}

function str(v: unknown): string {
  return v == null ? "" : String(v);
}

function numStr(v: unknown): string {
  return v == null ? "0" : String(v);
}

export default function EmployeeForm({ departments, managers, employee }: Props) {
  const router = useRouter();
  const isEdit = !!employee;

  // ── Personal Info ───────────────────────────────────────────────────────
  const [firstName, setFirstName] = useState(str(employee?.firstName));
  const [lastName, setLastName] = useState(str(employee?.lastName));
  const [email, setEmail] = useState(str(employee?.email));
  const [phone, setPhone] = useState(str(employee?.phone));
  const [dateOfBirth, setDateOfBirth] = useState(
    employee?.dateOfBirth ? new Date(employee.dateOfBirth as string).toISOString().split("T")[0] : ""
  );
  const [gender, setGender] = useState(str(employee?.gender));
  const [address, setAddress] = useState(str(employee?.address));
  const [city, setCity] = useState(str(employee?.city));
  const [state, setState] = useState(str(employee?.state));
  const [pinCode, setPinCode] = useState(str(employee?.pinCode));

  // ── Work Info ───────────────────────────────────────────────────────────
  const [designation, setDesignation] = useState(str(employee?.designation));
  const [departmentId, setDepartmentId] = useState(str(employee?.departmentId));
  const [managerId, setManagerId] = useState(str(employee?.managerId));
  const [employmentType, setEmploymentType] = useState(str(employee?.employmentType) || "FULL_TIME");
  const [workLocation, setWorkLocation] = useState(str(employee?.workLocation));
  const [joiningDate, setJoiningDate] = useState(
    employee?.joiningDate
      ? new Date(employee.joiningDate as string).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [status, setStatus] = useState(str(employee?.status) || "ACTIVE");

  // ── Salary ──────────────────────────────────────────────────────────────
  const [basicSalary, setBasicSalary] = useState(numStr(employee?.basicSalary));
  const [hra, setHra] = useState(numStr(employee?.hra));
  const [da, setDa] = useState(numStr(employee?.da));
  const [ta, setTa] = useState(numStr(employee?.ta));
  const [otherAllowance, setOtherAllowance] = useState(numStr(employee?.otherAllowance));
  const [pfEmployee, setPfEmployee] = useState(numStr(employee?.pfEmployee));
  const [pfEmployer, setPfEmployer] = useState(numStr(employee?.pfEmployer));
  const [professionalTax, setProfessionalTax] = useState(numStr(employee?.professionalTax));

  // ── Bank & Identity ─────────────────────────────────────────────────────
  const [bankAccount, setBankAccount] = useState(str(employee?.bankAccount));
  const [bankName, setBankName] = useState(str(employee?.bankName));
  const [ifscCode, setIfscCode] = useState(str(employee?.ifscCode));
  const [panNumber, setPanNumber] = useState(str(employee?.panNumber));
  const [aadharNumber, setAadharNumber] = useState(str(employee?.aadharNumber));

  // ── Login Account ────────────────────────────────────────────────────────
  const [createAccount, setCreateAccount] = useState(!isEdit);
  const [loginEmail, setLoginEmail] = useState(str(employee?.email));
  const [loginPassword, setLoginPassword] = useState("Welcome@123");
  const [loginRole, setLoginRole] = useState("EMPLOYEE");
  const [showPwd, setShowPwd] = useState(false);

  // ── Form state ──────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !designation.trim() || !joiningDate) {
      setError("Please fill in all required fields (First Name, Last Name, Email, Designation, Joining Date).");
      return;
    }
    setLoading(true);
    setError("");

    // Keep loginEmail in sync with employee email if it wasn't changed
    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      phone: phone.trim() || null,
      dateOfBirth: dateOfBirth || null,
      gender: gender || null,
      address: address.trim() || null,
      city: city.trim() || null,
      state: state.trim() || null,
      pinCode: pinCode.trim() || null,
      designation: designation.trim(),
      departmentId: departmentId || null,
      managerId: managerId || null,
      employmentType: employmentType || "FULL_TIME",
      workLocation: workLocation.trim() || null,
      joiningDate,
      status: status || "ACTIVE",
      basicSalary: parseFloat(basicSalary) || 0,
      hra: parseFloat(hra) || 0,
      da: parseFloat(da) || 0,
      ta: parseFloat(ta) || 0,
      otherAllowance: parseFloat(otherAllowance) || 0,
      pfEmployee: parseFloat(pfEmployee) || 0,
      pfEmployer: parseFloat(pfEmployer) || 0,
      professionalTax: parseFloat(professionalTax) || 0,
      bankAccount: bankAccount.trim() || null,
      bankName: bankName.trim() || null,
      ifscCode: ifscCode.trim() || null,
      panNumber: panNumber.trim() || null,
      aadharNumber: aadharNumber.trim() || null,
      // Login account fields
      createAccount,
      loginEmail: (loginEmail.trim() || email.trim()),
      loginPassword,
      loginRole,
    };

    try {
      const url = isEdit ? `/api/employees/${(employee as { id: string }).id}` : "/api/employees";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        let msg = "Failed to save employee";
        try {
          const json = JSON.parse(text);
          msg = json.error || msg;
        } catch {
          // non-JSON error body
        }
        throw new Error(msg);
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
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>
      )}

      {/* Personal Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4"><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>First Name *</Label>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" required />
          </div>
          <div className="space-y-1.5">
            <Label>Last Name *</Label>
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" required />
          </div>
          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@company.com" required />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <div className="space-y-1.5">
            <Label>Date of Birth</Label>
            <Input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="MALE">Male</SelectItem>
                <SelectItem value="FEMALE">Female</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="123 Main Street" />
          </div>
          <div className="space-y-1.5">
            <Label>City</Label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Mumbai" />
          </div>
          <div className="space-y-1.5">
            <Label>State</Label>
            <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="Maharashtra" />
          </div>
          <div className="space-y-1.5">
            <Label>PIN Code</Label>
            <Input value={pinCode} onChange={(e) => setPinCode(e.target.value)} placeholder="400001" />
          </div>
        </CardContent>
      </Card>

      {/* Work Info */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4"><CardTitle className="text-base">Work Information</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Designation *</Label>
            <Input value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="Software Engineer" required />
          </div>
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Select value={departmentId} onValueChange={setDepartmentId}>
              <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
              <SelectContent>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Manager</Label>
            <Select value={managerId} onValueChange={setManagerId}>
              <SelectTrigger><SelectValue placeholder="Select manager" /></SelectTrigger>
              <SelectContent>
                {managers.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}{m.designation ? ` — ${m.designation}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Employment Type</Label>
            <Select value={employmentType} onValueChange={setEmploymentType}>
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
            <Label>Work Location</Label>
            <Input value={workLocation} onChange={(e) => setWorkLocation(e.target.value)} placeholder="Mumbai Office" />
          </div>
          <div className="space-y-1.5">
            <Label>Joining Date *</Label>
            <Input type="date" value={joiningDate} onChange={(e) => setJoiningDate(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
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
            { label: "Basic Salary", value: basicSalary, set: setBasicSalary },
            { label: "HRA", value: hra, set: setHra },
            { label: "DA", value: da, set: setDa },
            { label: "TA", value: ta, set: setTa },
            { label: "Other Allowance", value: otherAllowance, set: setOtherAllowance },
            { label: "PF (Employee)", value: pfEmployee, set: setPfEmployee },
            { label: "PF (Employer)", value: pfEmployer, set: setPfEmployer },
            { label: "Professional Tax", value: professionalTax, set: setProfessionalTax },
          ].map((f) => (
            <div key={f.label} className="space-y-1.5">
              <Label>{f.label} (₹)</Label>
              <Input
                type="number" min="0" step="0.01"
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder="0"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Bank & Identity */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4"><CardTitle className="text-base">Bank & Identity</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Bank Account No.</Label>
            <Input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Bank Name</Label>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="HDFC Bank" />
          </div>
          <div className="space-y-1.5">
            <Label>IFSC Code</Label>
            <Input value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} placeholder="HDFC0001234" />
          </div>
          <div className="space-y-1.5">
            <Label>PAN Number</Label>
            <Input value={panNumber} onChange={(e) => setPanNumber(e.target.value)} placeholder="ABCDE1234F" />
          </div>
          <div className="space-y-1.5">
            <Label>Aadhar Number</Label>
            <Input value={aadharNumber} onChange={(e) => setAadharNumber(e.target.value)} placeholder="1234 5678 9012" />
          </div>
        </CardContent>
      </Card>

      {/* Login Account */}
      {!isEdit && (
        <Card className="border-0 shadow-sm border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-purple-600" />
                Login Account Setup
              </CardTitle>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={createAccount}
                  onChange={(e) => setCreateAccount(e.target.checked)}
                  className="w-4 h-4 rounded accent-purple-600"
                />
                <span className="text-sm font-medium text-gray-700">Create login account</span>
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Set the email and password the employee will use to log in to the Orbilox portal.
            </p>
          </CardHeader>
          {createAccount && (
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label>Login Email *</Label>
                <Input
                  type="email"
                  value={loginEmail || email}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="employee@company.com"
                />
                <p className="text-xs text-gray-400">Defaults to the work email above</p>
              </div>
              <div className="space-y-1.5">
                <Label>Password *</Label>
                <div className="relative">
                  <Input
                    type={showPwd ? "text" : "password"}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="pr-10"
                    placeholder="Welcome@123"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-400">Share this password with the employee</p>
              </div>
              <div className="space-y-1.5">
                <Label>Portal Role</Label>
                <Select value={loginRole} onValueChange={setLoginRole}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="HR">HR</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      <div className="flex gap-3 pb-6">
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
