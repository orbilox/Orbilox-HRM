"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Loader2, CheckCircle } from "lucide-react";

type CheckStatus = "CHECKED_IN" | "CHECKED_OUT" | "NOT_CHECKED_IN";

export default function AttendanceActions() {
  const router = useRouter();
  const [status, setStatus] = useState<CheckStatus>("NOT_CHECKED_IN");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastActionTime, setLastActionTime] = useState<string | null>(null);

  async function handleCheckIn() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to check in");
      }
      const now = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setStatus("CHECKED_IN");
      setLastActionTime(now);
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckOut() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/attendance/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "checkout" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to check out");
      }
      const now = new Date().toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setStatus("CHECKED_OUT");
      setLastActionTime(now);
      router.refresh();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Status indicator */}
      {status === "CHECKED_IN" && lastActionTime && (
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1.5">
          <CheckCircle className="w-3.5 h-3.5" />
          Checked in at {lastActionTime}
        </div>
      )}
      {status === "CHECKED_OUT" && lastActionTime && (
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-600 bg-gray-100 border border-gray-200 rounded-full px-3 py-1.5">
          <CheckCircle className="w-3.5 h-3.5" />
          Checked out at {lastActionTime}
        </div>
      )}

      {/* Error */}
      {errorMsg && (
        <span className="text-xs text-red-600 max-w-[180px] truncate">{errorMsg}</span>
      )}

      {/* Action buttons */}
      {status === "NOT_CHECKED_IN" && (
        <Button
          size="sm"
          onClick={handleCheckIn}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <LogIn className="w-4 h-4 mr-2" />
          )}
          Check In
        </Button>
      )}

      {status === "CHECKED_IN" && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleCheckOut}
          disabled={loading}
          className="border-orange-300 text-orange-700 hover:bg-orange-50"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <LogOut className="w-4 h-4 mr-2" />
          )}
          Check Out
        </Button>
      )}

      {status === "CHECKED_OUT" && (
        <Button size="sm" variant="outline" disabled className="opacity-60">
          <CheckCircle className="w-4 h-4 mr-2" />
          Done for today
        </Button>
      )}
    </div>
  );
}
