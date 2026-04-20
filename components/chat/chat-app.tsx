"use client";

import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import ChatSidebar from "./chat-sidebar";
import ChatWindow from "./chat-window";

interface Room {
  id: string;
  name: string | null;
  type: string;
  description?: string | null;
  participants: { employeeId: string; employee: { id: string; firstName: string; lastName: string; designation?: string } }[];
  messages: { content: string; sender: { firstName: string; lastName: string }; createdAt: string }[];
  unread: number;
}

interface Props {
  myEmployeeId: string;
  myName: string;
}

export default function ChatApp({ myEmployeeId, myName }: Props) {
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  // Fire seed in background — never blocks the UI
  useEffect(() => {
    fetch("/api/chat/seed", { method: "POST" }).catch(() => {});
  }, []);

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────
          Mobile: full-screen when no room selected, hidden when room open
          Desktop: always visible, fixed w-72
      ──────────────────────────────────────────────────── */}
      <div className={[
        "flex flex-col bg-[#1E1B2E] flex-shrink-0 overflow-hidden",
        selectedRoom
          ? "hidden lg:flex lg:w-72"
          : "flex w-full lg:w-72",
      ].join(" ")}>
        <ChatSidebar
          myEmployeeId={myEmployeeId}
          myName={myName}
          selectedRoomId={selectedRoom?.id ?? null}
          onSelectRoom={(room) => setSelectedRoom(room as Room)}
        />
      </div>

      {/* ── Chat window ──────────────────────────────────────
          Mobile: full-screen when room selected, hidden when no room
          Desktop: always visible, takes remaining width
      ──────────────────────────────────────────────────── */}
      <div className={[
        "flex-1 min-w-0 flex flex-col overflow-hidden",
        selectedRoom ? "flex" : "hidden lg:flex",
      ].join(" ")}>
        {selectedRoom ? (
          <ChatWindow
            key={selectedRoom.id}
            room={selectedRoom}
            myEmployeeId={myEmployeeId}
            myName={myName}
            onBack={() => setSelectedRoom(null)}
          />
        ) : (
          /* Desktop empty state */
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-center px-6">
            <div className="w-20 h-20 rounded-3xl bg-purple-100 flex items-center justify-center mb-5">
              <MessageSquare className="w-10 h-10 text-purple-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Welcome to Team Chat</h2>
            <p className="text-gray-400 mt-2 max-w-xs text-sm">
              Select a channel or direct message from the sidebar to start chatting
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center">
              {[
                { icon: "💬", label: "Real-time messaging" },
                { icon: "📎", label: "Share links & files" },
                { icon: "🔔", label: "Unread notifications" },
              ].map((f) => (
                <div key={f.label} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
                  <div className="text-2xl mb-1">{f.icon}</div>
                  <p className="text-xs text-gray-500 font-medium">{f.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
