"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, Loader2, CheckCircle } from "lucide-react";

interface TimeWidgetProps {
  checkIn: string | null;
  checkOut: string | null;
}

export default function TimeWidget({ checkIn, checkOut }: TimeWidgetProps) {
  const router = useRouter();
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [localCheckIn, setLocalCheckIn] = useState(checkIn);
  const [localCheckOut, setLocalCheckOut] = useState(checkOut);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }) : null;

  const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  const dateStr = now.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });

  async function handleCheckIn() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/attendance/checkin", { method: "POST", headers: { "Content-Type": "application/json" } });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to check in");
      }
      setLocalCheckIn(new Date().toISOString());
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckOut() {
    setLoading(true);
    setError(null);
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
      setLocalCheckOut(new Date().toISOString());
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const checkedIn = !!localCheckIn;
  const checkedOut = !!localCheckOut;

  return (
    <div className="bg-[#6B46C1] rounded-xl p-4 text-white h-full flex flex-col justify-between min-h-[160px]">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-xs text-purple-200 font-medium uppercase tracking-wide">Time Today</p>
          <p className="text-xs text-purple-300 mt-0.5">{dateStr}</p>
        </div>
        {checkedIn && !checkedOut && (
          <span className="flex items-center gap-1 text-xs bg-green-400/20 text-green-300 border border-green-400/30 rounded-full px-2 py-0.5">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Active
          </span>
        )}
      </div>

      <div className="text-3xl font-bold tracking-tight tabular-nums">{timeStr}</div>

      <div className="flex items-center gap-3 mt-2 text-xs text-purple-200">
        {localCheckIn && (
          <span>In: <span className="text-white font-medium">{fmt(localCheckIn)}</span></span>
        )}
        {localCheckOut && (
          <span>Out: <span className="text-white font-medium">{fmt(localCheckOut)}</span></span>
        )}
      </div>

      {error && <p className="text-xs text-red-300 mt-1">{error}</p>}

      <div className="mt-3 flex gap-2">
        {!checkedIn && (
          <button
            onClick={handleCheckIn}
            disabled={loading}
            className="flex items-center gap-1.5 bg-white text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogIn className="w-3.5 h-3.5" />}
            Web Clock-In
          </button>
        )}
        {checkedIn && !checkedOut && (
          <button
            onClick={handleCheckOut}
            disabled={loading}
            className="flex items-center gap-1.5 bg-white/10 border border-white/30 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-white/20 transition-colors disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
            Clock-Out
          </button>
        )}
        {checkedOut && (
          <span className="flex items-center gap-1.5 text-xs text-green-300">
            <CheckCircle className="w-3.5 h-3.5" /> Done for today
          </span>
        )}
      </div>
    </div>
  );
}
