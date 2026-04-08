"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, PartyPopper } from "lucide-react";

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
}

const BG_GRADIENTS = [
  "from-cyan-400 to-teal-500",
  "from-orange-400 to-pink-500",
  "from-purple-400 to-indigo-500",
  "from-green-400 to-emerald-500",
  "from-yellow-400 to-orange-500",
];

function formatHolidayDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "long", year: "numeric" });
}

function daysUntil(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "Today!";
  if (diff === 1) return "Tomorrow";
  if (diff < 0) return null;
  return `In ${diff} days`;
}

export default function HolidayCarousel({ holidays }: { holidays: Holiday[] }) {
  const [idx, setIdx] = useState(0);

  if (holidays.length === 0) {
    return (
      <div className="bg-gradient-to-br from-cyan-400 to-teal-500 rounded-xl p-4 flex flex-col justify-between min-h-[160px]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">Holidays</span>
        </div>
        <div className="flex flex-col items-center justify-center flex-1 py-4 text-white">
          <PartyPopper className="w-8 h-8 mb-2 opacity-70" />
          <p className="text-sm font-medium">No upcoming holidays</p>
        </div>
      </div>
    );
  }

  const h = holidays[idx];
  const gradient = BG_GRADIENTS[idx % BG_GRADIENTS.length];
  const until = daysUntil(h.date);

  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-xl p-4 text-white flex flex-col justify-between min-h-[160px] relative overflow-hidden`}>
      {/* Decorative circles */}
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10" />
      <div className="absolute -right-2 top-8 w-12 h-12 rounded-full bg-white/10" />

      <div className="flex items-center justify-between relative z-10">
        <span className="text-xs font-semibold text-white/80 uppercase tracking-wide">Holidays</span>
        <div className="flex items-center gap-2">
          <a href="/holidays" className="text-xs text-white/70 hover:text-white underline">View All</a>
          <div className="flex gap-1">
            <button
              onClick={() => setIdx((i) => Math.max(0, i - 1))}
              disabled={idx === 0}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => setIdx((i) => Math.min(holidays.length - 1, i + 1))}
              disabled={idx === holidays.length - 1}
              className="w-5 h-5 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-3">
        <h3 className="text-xl font-bold leading-tight">{h.name}</h3>
        <p className="text-sm text-white/80 mt-1">{formatHolidayDate(h.date)}</p>
        {until && (
          <span className="inline-block mt-2 text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
            {until}
          </span>
        )}
      </div>

      <div className="flex gap-1.5 mt-3 relative z-10">
        {holidays.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            className={`h-1 rounded-full transition-all ${i === idx ? "w-4 bg-white" : "w-2 bg-white/40"}`}
          />
        ))}
      </div>
    </div>
  );
}
