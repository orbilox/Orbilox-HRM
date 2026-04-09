"use client";

import { useState, useEffect } from "react";
import { Hash, Lock, Plus, Search, X, MessageSquare, ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  designation?: string;
  department?: { name: string };
}

interface Room {
  id: string;
  name: string | null;
  type: string;
  description?: string | null;
  unread: number;
  participants: { employeeId: string; employee: Employee }[];
  messages: { content: string; sender: { firstName: string; lastName: string }; createdAt: string }[];
}

interface Props {
  myEmployeeId: string;
  myName: string;
  selectedRoomId: string | null;
  onSelectRoom: (room: Room) => void;
}

export default function ChatSidebar({ myEmployeeId, myName, selectedRoomId, onSelectRoom }: Props) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNewDM, setShowNewDM] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);
  const [channelsOpen, setChannelsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(true);
  const [newChannelName, setNewChannelName] = useState("");
  const [newChannelDesc, setNewChannelDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [dmSearch, setDmSearch] = useState("");

  async function loadRooms() {
    try {
      const res = await fetch("/api/chat/rooms");
      if (!res.ok) { setLoading(false); return; }
      const text = await res.text();
      if (!text) { setLoading(false); return; }
      const data = JSON.parse(text);
      setRooms(data.rooms ?? []);
    } catch (e) {
      console.error("loadRooms error", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadEmployees() {
    const res = await fetch("/api/employees");
    const data = await res.json();
    setAllEmployees((data.employees ?? []).filter((e: Employee) => e.id !== myEmployeeId));
  }

  useEffect(() => {
    loadRooms();
    const interval = setInterval(loadRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  async function startDM(otherId: string) {
    setCreating(true);
    const res = await fetch("/api/chat/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "DIRECT", participantIds: [otherId] }),
    });
    const data = await res.json();
    setCreating(false);
    setShowNewDM(false);
    setDmSearch("");
    await loadRooms();
    if (data.room) onSelectRoom(data.room);
  }

  async function createChannel() {
    if (!newChannelName.trim()) return;
    setCreating(true);
    // Add all employees to the channel
    const empRes = await fetch("/api/employees");
    const empData = await empRes.json();
    const allIds = (empData.employees ?? []).map((e: Employee) => e.id).filter((id: string) => id !== myEmployeeId);

    const res = await fetch("/api/chat/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "CHANNEL",
        name: newChannelName.trim().toLowerCase().replace(/\s+/g, "-"),
        description: newChannelDesc.trim() || null,
        participantIds: allIds,
      }),
    });
    const data = await res.json();
    setCreating(false);
    setShowNewChannel(false);
    setNewChannelName("");
    setNewChannelDesc("");
    await loadRooms();
    if (data.room) onSelectRoom(data.room);
  }

  const channels = rooms.filter((r) => r.type === "CHANNEL");
  const dms = rooms.filter((r) => r.type === "DIRECT");

  function getDMName(room: Room) {
    const other = room.participants.find((p) => p.employeeId !== myEmployeeId);
    if (!other) return "Unknown";
    return `${other.employee.firstName} ${other.employee.lastName}`;
  }

  function getDMInitials(room: Room) {
    const other = room.participants.find((p) => p.employeeId !== myEmployeeId);
    if (!other) return "?";
    return `${other.employee.firstName[0]}${other.employee.lastName[0]}`;
  }

  const filteredEmployees = allEmployees.filter((e) =>
    `${e.firstName} ${e.lastName}`.toLowerCase().includes(dmSearch.toLowerCase()) ||
    e.designation?.toLowerCase().includes(dmSearch.toLowerCase()) ||
    e.department?.name.toLowerCase().includes(dmSearch.toLowerCase())
  );

  const AVATAR_COLORS = ["bg-purple-600","bg-blue-600","bg-green-600","bg-pink-600","bg-orange-500","bg-teal-600","bg-indigo-600"];
  function avatarColor(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
  }

  return (
    <div className="flex flex-col h-full bg-[#1E1B2E] text-white w-72 shrink-0">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            <span className="font-bold text-lg">Team Chat</span>
          </div>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rooms..."
            className="w-full bg-white/10 text-sm text-white placeholder-gray-400 pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
          />
        </div>
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto py-2 space-y-1 px-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
          </div>
        ) : (
          <>
            {/* Channels section */}
            <div>
              <div
                className="flex items-center gap-1 w-full px-2 py-1 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors cursor-pointer"
              >
                <button
                  onClick={() => setChannelsOpen(!channelsOpen)}
                  className="flex items-center gap-1 flex-1 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
                >
                  {channelsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  Channels
                  <span className="ml-auto text-gray-500 normal-case font-normal">{channels.length}</span>
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowNewChannel(true); setShowNewDM(false); }}
                  className="ml-1 p-0.5 hover:text-white hover:bg-white/10 rounded transition-colors"
                  title="New Channel"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {channelsOpen && (
                <div className="mt-1 space-y-0.5">
                  {channels
                    .filter((r) => !search || r.name?.includes(search.toLowerCase()))
                    .map((room) => (
                      <button
                        key={room.id}
                        onClick={() => onSelectRoom(room)}
                        className={cn(
                          "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm transition-all group",
                          selectedRoomId === room.id
                            ? "bg-purple-600 text-white"
                            : "text-gray-300 hover:bg-white/10 hover:text-white"
                        )}
                      >
                        <Hash className="w-4 h-4 shrink-0 opacity-70" />
                        <span className="flex-1 text-left truncate font-medium">{room.name}</span>
                        {room.unread > 0 && selectedRoomId !== room.id && (
                          <span className="bg-purple-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            {room.unread > 9 ? "9+" : room.unread}
                          </span>
                        )}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* New Channel Form */}
            {showNewChannel && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2 mx-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">New Channel</span>
                  <button onClick={() => setShowNewChannel(false)} className="text-gray-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                </div>
                <input
                  value={newChannelName}
                  onChange={(e) => setNewChannelName(e.target.value)}
                  placeholder="channel-name"
                  className="w-full bg-white/10 text-sm text-white placeholder-gray-500 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
                  onKeyDown={(e) => e.key === "Enter" && createChannel()}
                />
                <input
                  value={newChannelDesc}
                  onChange={(e) => setNewChannelDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full bg-white/10 text-xs text-white placeholder-gray-500 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
                />
                <button
                  onClick={createChannel}
                  disabled={creating || !newChannelName.trim()}
                  className="w-full py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Create Channel
                </button>
              </div>
            )}

            {/* Direct Messages section */}
            <div className="mt-3">
              <div className="flex items-center gap-1 w-full px-2 py-1 cursor-pointer">
                <button
                  onClick={() => setDmsOpen(!dmsOpen)}
                  className="flex items-center gap-1 flex-1 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-white transition-colors"
                >
                  {dmsOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  Direct Messages
                  <span className="ml-auto text-gray-500 normal-case font-normal">{dms.length}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNewDM(true);
                    setShowNewChannel(false);
                    loadEmployees();
                  }}
                  className="ml-1 p-0.5 hover:text-white hover:bg-white/10 rounded transition-colors"
                  title="New DM"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {dmsOpen && (
                <div className="mt-1 space-y-0.5">
                  {dms
                    .filter((r) => !search || getDMName(r).toLowerCase().includes(search.toLowerCase()))
                    .map((room) => {
                      const name = getDMName(room);
                      const initials = getDMInitials(room);
                      const color = avatarColor(name);
                      return (
                        <button
                          key={room.id}
                          onClick={() => onSelectRoom(room)}
                          className={cn(
                            "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-all",
                            selectedRoomId === room.id
                              ? "bg-purple-600 text-white"
                              : "text-gray-300 hover:bg-white/10 hover:text-white"
                          )}
                        >
                          <div className={`w-6 h-6 rounded-full ${color} flex items-center justify-center text-[10px] font-bold shrink-0`}>
                            {initials}
                          </div>
                          <span className="flex-1 text-left truncate font-medium">{name}</span>
                          {room.unread > 0 && selectedRoomId !== room.id && (
                            <span className="bg-purple-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full shrink-0">
                              {room.unread > 9 ? "9+" : room.unread}
                            </span>
                          )}
                        </button>
                      );
                    })}
                </div>
              )}

              {/* New DM picker */}
              {showNewDM && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 space-y-2 mx-1 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">New Direct Message</span>
                    <button onClick={() => { setShowNewDM(false); setDmSearch(""); }} className="text-gray-400 hover:text-white"><X className="w-3.5 h-3.5" /></button>
                  </div>
                  <div className="relative">
                    <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={dmSearch}
                      onChange={(e) => setDmSearch(e.target.value)}
                      placeholder="Search employee..."
                      className="w-full bg-white/10 text-xs text-white placeholder-gray-500 pl-7 pr-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-0.5">
                    {filteredEmployees.slice(0, 10).map((emp) => (
                      <button
                        key={emp.id}
                        onClick={() => startDM(emp.id)}
                        disabled={creating}
                        className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        <div className={`w-6 h-6 rounded-full ${avatarColor(`${emp.firstName} ${emp.lastName}`)} flex items-center justify-center text-[10px] font-bold shrink-0`}>
                          {emp.firstName[0]}{emp.lastName[0]}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <div className="font-medium truncate">{emp.firstName} {emp.lastName}</div>
                          <div className="text-gray-500 text-[10px] truncate">{emp.designation ?? emp.department?.name ?? ""}</div>
                        </div>
                        {creating && <Loader2 className="w-3 h-3 animate-spin" />}
                      </button>
                    ))}
                    {filteredEmployees.length === 0 && (
                      <p className="text-xs text-gray-500 text-center py-2">No employees found</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer — my name */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className={`w-7 h-7 rounded-full ${avatarColor(myName)} flex items-center justify-center text-xs font-bold shrink-0`}>
            {myName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{myName}</p>
            <p className="text-[10px] text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
