"use client";

import { CalendarDays } from "lucide-react";

export default function AttendanceDatePicker({
  selectedDate,
  maxDate,
}: {
  selectedDate: string;
  maxDate: string;
}) {
  return (
    <div className="relative">
      <CalendarDays className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="date"
        name="date"
        defaultValue={selectedDate}
        max={maxDate}
        onChange={(e) => {
          const url = new URL(window.location.href);
          url.searchParams.set("date", e.target.value);
          window.location.href = url.toString();
        }}
        className="pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
    </div>
  );
}
