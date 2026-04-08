"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlusCircle, Loader2 } from "lucide-react";

interface LeaveType {
  id: string;
  name: string;
  daysAllowed: number;
  color: string;
}

interface Props {
  leaveTypes: LeaveType[];
}

export default function ApplyLeaveDialog({ leaveTypes }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    leaveTypeId: "",
    startDate: "",
    endDate: "",
    reason: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.leaveTypeId) {
      setError("Please select a leave type.");
      return;
    }
    if (!form.startDate || !form.endDate) {
      setError("Please select start and end dates.");
      return;
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      setError("End date cannot be before start date.");
      return;
    }
    if (!form.reason.trim()) {
      setError("Please provide a reason for the leave.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to submit leave request");
      }

      setOpen(false);
      setForm({ leaveTypeId: "", startDate: "", endDate: "", reason: "" });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="w-4 h-4 mr-2" />
          Apply Leave
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Apply for Leave</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Leave Type */}
          <div className="space-y-1.5">
            <Label htmlFor="leaveTypeId">Leave Type</Label>
            <Select
              value={form.leaveTypeId}
              onValueChange={(val) =>
                setForm((prev) => ({ ...prev, leaveTypeId: val }))
              }
            >
              <SelectTrigger id="leaveTypeId">
                <SelectValue placeholder="Select leave type..." />
              </SelectTrigger>
              <SelectContent>
                {leaveTypes.map((lt) => (
                  <SelectItem key={lt.id} value={lt.id}>
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: lt.color }}
                      />
                      {lt.name}
                      <span className="text-gray-400 text-xs ml-1">
                        ({lt.daysAllowed} days/yr)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                name="startDate"
                type="date"
                min={today}
                value={form.startDate}
                onChange={handleChange}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                name="endDate"
                type="date"
                min={form.startDate || today}
                value={form.endDate}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Days preview */}
          {form.startDate && form.endDate && new Date(form.endDate) >= new Date(form.startDate) && (
            <div className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
              Duration:{" "}
              <span className="font-semibold">
                {Math.round(
                  (new Date(form.endDate).getTime() -
                    new Date(form.startDate).getTime()) /
                    (1000 * 60 * 60 * 24) +
                    1
                )}{" "}
                day(s)
              </span>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason</Label>
            <textarea
              id="reason"
              name="reason"
              rows={3}
              placeholder="Brief reason for leave..."
              value={form.reason}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 text-sm border border-input rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-background placeholder:text-muted-foreground"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
