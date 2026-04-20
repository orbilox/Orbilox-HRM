"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2, UserX } from "lucide-react";

interface Props {
  employeeId: string;
  employeeEmail: string;
  existingLogin: { email: string; role: string } | null;
}

const roleVariant: Record<string, "destructive" | "warning" | "success" | "secondary"> = {
  ADMIN: "destructive", HR: "warning", MANAGER: "success", EMPLOYEE: "secondary",
};

export default function ManageLogin({ employeeId, employeeEmail, existingLogin }: Props) {
  const [login, setLogin] = useState(existingLogin);
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState(existingLogin?.email ?? employeeEmail);
  const [password, setPassword] = useState("Welcome@123");
  const [role, setRole] = useState(existingLogin?.role ?? "EMPLOYEE");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          role,
          employeeId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create login");
      setLogin({ email: email.trim(), role });
      setSuccess("Login account created successfully!");
      setShowForm(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Current login status */}
      {login ? (
        <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
          <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-green-800">Login account exists</p>
            <p className="text-xs text-green-700 mt-0.5 truncate">{login.email}</p>
          </div>
          <Badge variant={roleVariant[login.role] ?? "secondary"} className="text-xs shrink-0">
            {login.role}
          </Badge>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100">
          <UserX className="w-5 h-5 text-orange-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-orange-800">No login account</p>
            <p className="text-xs text-orange-600 mt-0.5">This employee cannot log in to the Orbilox portal yet.</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <KeyRound className="w-3.5 h-3.5 mr-1.5" />
            Create Login
          </Button>
        </div>
      )}

      {success && (
        <div className="text-sm text-green-700 bg-green-50 border border-green-200 px-3 py-2 rounded-md">
          {success}
        </div>
      )}

      {/* Create login form */}
      {!login && showForm && (
        <form onSubmit={handleSave} className="border border-gray-200 rounded-xl p-4 space-y-4 bg-white">
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-purple-600" /> Set Login Credentials
          </h3>

          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-md">{error}</div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Login Email *</Label>
              <Input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@company.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Password *</Label>
              <div className="relative">
                <Input
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
            </div>
            <div className="space-y-1.5">
              <Label>Portal Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EMPLOYEE">Employee</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading}>
              {loading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Save Login
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setShowForm(false); setError(""); }}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {login && (
        <p className="text-xs text-gray-400">
          To reset the password, go to <strong>Settings → Users</strong> and create a new login with the same email.
        </p>
      )}
    </div>
  );
}
