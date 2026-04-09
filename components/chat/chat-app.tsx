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
  const [seeded, setSeeded] = useState(false);

  // Seed default channels on first load
  useEffect(() => {
    fetch("/api/chat/seed", { method: "POST" })
      .then(() => setSeeded(true))
      .catch(() => setSeeded(true)); // still show UI even if seed fails
  }, []);

  if (!seeded) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1E1B2E]">
        <div className="text-center text-white">
          <MessageSquare className="w-8 h-8 animate-pulse text-purple-400 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Setting up chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      <ChatSidebar
        myEmployeeId={myEmployeeId}
        myName={myName}
        selectedRoomId={selectedRoom?.id ?? null}
        onSelectRoom={(room) => setSelectedRoom(room as Room)}
      />

      <div className="flex-1 overflow-hidden relative">
        {selectedRoom ? (
          <ChatWindow
            key={selectedRoom.id}
            room={selectedRoom}
            myEmployeeId={myEmployeeId}
            myName={myName}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50 text-center px-6">
            <div className="w-20 h-20 rounded-3xl bg-purple-100 flex items-center justify-center mb-5">
              <MessageSquare className="w-10 h-10 text-purple-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Welcome to Team Chat</h2>
            <p className="text-gray-400 mt-2 max-w-xs text-sm">
              Select a channel or direct message from the sidebar to start chatting with your team
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
