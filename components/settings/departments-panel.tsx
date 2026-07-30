"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, Plus, X, Loader2, Trash2 } from "lucide-react";

interface Department {
  id: string;
  name: string;
  description: string | null;
  _count: { employees: number };
}

export default function DepartmentsPanel({
  initialDepartments,
}: {
  initialDepartments: Department[];
}) {
  const [departments, setDepartments] = useState(initialDepartments);
  const [showDialog, setShowDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  async function refreshList() {
    const listRes = await fetch("/api/departments");
    if (listRes.ok) setDepartments(await listRes.json());
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description: description.trim() || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create department");
      await refreshList();
      setShowDialog(false);
      setName("");
      setDescription("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(dept: Department) {
    if (!confirm(`Delete the "${dept.name}" department? This cannot be undone.`)) return;
    setDeletingId(dept.id);
    try {
      const res = await fetch(`/api/departments/${dept.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete department");
      await refreshList();
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div>
      {/* Header with action */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <p className="text-sm text-gray-500">
          {departments.length} department{departments.length !== 1 ? "s" : ""}
        </p>
        <Button size="sm" onClick={() => { setError(""); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Add Department
        </Button>
      </div>

      {/* Dialog */}
      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Add Department</h2>
              <button
                onClick={() => { setShowDialog(false); setError(""); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="d-name">Name *</Label>
                <Input
                  id="d-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Development"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="d-description">Description (optional)</Label>
                <Input
                  id="d-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" disabled={loading || !name.trim()} className="flex-1">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Department
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowDialog(false); setError(""); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Departments list */}
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
                <button
                  onClick={() => handleDelete(dept)}
                  disabled={deletingId === dept.id}
                  className="text-red-400 hover:text-red-600 transition-colors p-1 disabled:opacity-50"
                  title="Delete department"
                >
                  {deletingId === dept.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
