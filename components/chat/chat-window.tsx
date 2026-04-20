"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send, Hash, Loader2, Trash2, Reply,
  Users, ChevronDown, MessageSquare, ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Sender {
  id: string;
  firstName: string;
  lastName: string;
  designation?: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  sender: Sender;
  createdAt: string;
  isDeleted: boolean;
  isEdited: boolean;
  replyToId?: string | null;
}

interface Room {
  id: string;
  name: string | null;
  type: string;
  description?: string | null;
  participants: { employeeId: string; employee: { id: string; firstName: string; lastName: string; designation?: string } }[];
}

interface Props {
  room: Room;
  myEmployeeId: string;
  myName: string;
  onBack?: () => void;
}

const AVATAR_COLORS = ["bg-purple-600","bg-blue-600","bg-green-600","bg-pink-600","bg-orange-500","bg-teal-600","bg-indigo-600"];
function avatarColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function initials(firstName: string, lastName?: string) {
  const a = firstName?.[0] ?? "";
  const b = lastName?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}

function formatTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  if (diffDays === 1) return `Yesterday ${d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}`;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }) + " " +
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function formatDateDivider(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
}

function isSameDay(a: string, b: string) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

const REACTIONS = ["👍","❤️","😂","🎉","🔥","👏","😮","🙏"];

export default function ChatWindow({ room, myEmployeeId, myName, onBack }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [hoveredMsg, setHoveredMsg] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [showMembers, setShowMembers] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<string | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [newMsgCount, setNewMsgCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const roomId = room.id;

  const scrollToBottom = useCallback((smooth = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  // Initial load
  async function loadMessages() {
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/messages?roomId=${roomId}&limit=60`);
      const data = await res.json();
      setMessages(data.messages ?? []);
      if (data.messages?.length) {
        setLastMessageTime(data.messages[data.messages.length - 1].createdAt);
      }
    } finally {
      setLoading(false);
    }
  }

  // Polling for new messages
  const pollMessages = useCallback(async () => {
    if (!lastMessageTime) return;
    const res = await fetch(`/api/chat/messages?roomId=${roomId}&after=${encodeURIComponent(lastMessageTime)}`);
    const data = await res.json();
    const newMsgs: Message[] = data.messages ?? [];
    if (newMsgs.length > 0) {
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const toAdd = newMsgs.filter((m) => !existingIds.has(m.id));
        return toAdd.length ? [...prev, ...toAdd] : prev;
      });
      setLastMessageTime(newMsgs[newMsgs.length - 1].createdAt);
      if (!isAtBottom) setNewMsgCount((c) => c + newMsgs.length);
    }
  }, [roomId, lastMessageTime, isAtBottom]);

  useEffect(() => {
    loadMessages();
    setReplyTo(null);
  }, [roomId]);

  // Auto scroll on initial load
  useEffect(() => {
    if (!loading && messages.length > 0) scrollToBottom();
  }, [loading]);

  // Poll every 2 seconds
  useEffect(() => {
    if (!lastMessageTime) return;
    const id = setInterval(pollMessages, 2000);
    return () => clearInterval(id);
  }, [pollMessages]);

  // Auto scroll when new messages arrive if at bottom
  useEffect(() => {
    if (isAtBottom && messages.length > 0) {
      scrollToBottom(true);
      setNewMsgCount(0);
    }
  }, [messages.length, isAtBottom]);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setIsAtBottom(atBottom);
    if (atBottom) setNewMsgCount(0);
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setSending(true);
    setInput("");
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId, content, replyToId: replyTo?.id ?? null }),
      });
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
        setLastMessageTime(data.message.createdAt);
        setReplyTo(null);
        setIsAtBottom(true);
        setTimeout(() => scrollToBottom(true), 50);
      }
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  async function deleteMessage(msgId: string) {
    await fetch("/api/chat/messages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId: msgId }),
    });
    setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, isDeleted: true, content: "This message was deleted." } : m));
  }

  const getDMOther = () => {
    const other = room.participants.find((p) => p.employeeId !== myEmployeeId);
    if (!other) return null;
    return other.employee;
  };

  const roomDisplayName = room.type === "DIRECT"
    ? (() => { const o = getDMOther(); return o ? `${o.firstName} ${o.lastName}` : "Direct Message"; })()
    : `#${room.name}`;

  // Group messages: show avatar only for first message in a sequence from same sender
  function shouldShowAvatar(idx: number): boolean {
    if (idx === 0) return true;
    const prev = messages[idx - 1];
    const cur = messages[idx];
    return prev.senderId !== cur.senderId || !isSameDay(prev.createdAt, cur.createdAt);
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-3 lg:px-5 py-3 lg:py-3.5 border-b border-gray-100 bg-white shadow-sm shrink-0">
        <div className="flex items-center gap-2 lg:gap-3 min-w-0">
          {/* Back button — mobile only */}
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden p-1.5 -ml-1 rounded-lg text-gray-500 hover:bg-gray-100 active:bg-gray-200 shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          {room.type === "DIRECT" ? (
            <>
              {(() => {
                const o = getDMOther();
                return o ? (
                  <div className={`w-9 h-9 rounded-full ${avatarColor(`${o.firstName} ${o.lastName}`)} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                    {initials(o.firstName, o.lastName)}
                  </div>
                ) : null;
              })()}
              <div>
                <p className="font-bold text-gray-900 text-sm">{roomDisplayName}</p>
                {(() => { const o = getDMOther(); return o?.designation ? <p className="text-xs text-gray-400">{o.designation}</p> : null; })()}
              </div>
            </>
          ) : (
            <>
              <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                <Hash className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{roomDisplayName}</p>
                {room.description && <p className="text-xs text-gray-400 truncate max-w-xs">{room.description}</p>}
              </div>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {room.type === "CHANNEL" && (
            <button
              onClick={() => setShowMembers(!showMembers)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                showMembers ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100"
              )}
            >
              <Users className="w-4 h-4" />
              <span>{room.participants.length}</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Messages area */}
        <div className="flex flex-col flex-1 min-w-0">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-0.5"
          >
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
                  {room.type === "DIRECT" ? (
                    <MessageSquare className="w-8 h-8 text-purple-500" />
                  ) : (
                    <Hash className="w-8 h-8 text-purple-500" />
                  )}
                </div>
                <p className="text-lg font-bold text-gray-800">
                  {room.type === "DIRECT" ? `Message ${roomDisplayName}` : `Welcome to #${room.name}!`}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {room.type === "DIRECT"
                    ? "This is the beginning of your conversation."
                    : room.description ?? "Send the first message to start the conversation."}
                </p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMine = msg.senderId === myEmployeeId;
                const showAvatar = shouldShowAvatar(idx);
                const showDateDivider = idx === 0 || !isSameDay(messages[idx - 1].createdAt, msg.createdAt);
                const senderName = `${msg.sender.firstName} ${msg.sender.lastName}`;

                return (
                  <div key={msg.id}>
                    {/* Date divider */}
                    {showDateDivider && (
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 border-t border-gray-100" />
                        <span className="text-xs text-gray-400 font-medium px-3 py-1 bg-gray-50 rounded-full">
                          {formatDateDivider(msg.createdAt)}
                        </span>
                        <div className="flex-1 border-t border-gray-100" />
                      </div>
                    )}

                    {/* Message row */}
                    <div
                      className={cn(
                        "flex gap-3 px-2 py-0.5 rounded-xl transition-colors group relative",
                        !msg.isDeleted && "hover:bg-gray-50",
                        showAvatar ? "mt-3" : "mt-0.5"
                      )}
                      onMouseEnter={() => setHoveredMsg(msg.id)}
                      onMouseLeave={() => setHoveredMsg(null)}
                    >
                      {/* Avatar column */}
                      <div className="w-9 shrink-0 pt-0.5">
                        {showAvatar ? (
                          <div className={`w-9 h-9 rounded-full ${avatarColor(senderName)} flex items-center justify-center text-white text-sm font-bold`}>
                            {initials(msg.sender.firstName, msg.sender.lastName)}
                          </div>
                        ) : (
                          <span className="text-[10px] text-gray-300 invisible group-hover:visible select-none pt-1 block text-center">
                            {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        {showAvatar && (
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className={cn("text-sm font-bold", isMine ? "text-purple-700" : "text-gray-900")}>
                              {isMine ? "You" : senderName}
                            </span>
                            <span className="text-[10px] text-gray-400">{formatTime(msg.createdAt)}</span>
                            {msg.sender.designation && (
                              <span className="text-[10px] text-gray-400 hidden sm:inline">{msg.sender.designation}</span>
                            )}
                          </div>
                        )}

                        {msg.replyToId && (
                          <div className="bg-gray-100 border-l-2 border-purple-400 rounded px-2 py-1 mb-1 text-xs text-gray-500 truncate">
                            ↩ Replying to a message
                          </div>
                        )}

                        <p className={cn(
                          "text-sm leading-relaxed break-words",
                          msg.isDeleted ? "text-gray-400 italic" : "text-gray-800"
                        )}>
                          {msg.content}
                          {msg.isEdited && !msg.isDeleted && (
                            <span className="text-xs text-gray-400 ml-1">(edited)</span>
                          )}
                        </p>
                      </div>

                      {/* Hover actions */}
                      {!msg.isDeleted && hoveredMsg === msg.id && (
                        <div className="absolute right-3 top-1 flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-sm px-1 py-0.5">
                          <button
                            onClick={() => setReplyTo(msg)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-purple-600 transition-colors"
                            title="Reply"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                          {isMine && (
                            <button
                              onClick={() => deleteMessage(msg.id)}
                              className="p-1 hover:bg-red-50 rounded text-gray-500 hover:text-red-600 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Scroll to bottom button */}
          {!isAtBottom && (
            <div className="absolute bottom-24 right-6">
              <button
                onClick={() => { scrollToBottom(true); setIsAtBottom(true); setNewMsgCount(0); }}
                className="flex items-center gap-1.5 bg-purple-600 text-white text-xs font-medium px-3 py-1.5 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
              >
                {newMsgCount > 0 && <span className="bg-white text-purple-600 rounded-full px-1.5 font-bold text-[10px]">{newMsgCount}</span>}
                <ChevronDown className="w-3.5 h-3.5" />
                New messages
              </button>
            </div>
          )}

          {/* Reply indicator */}
          {replyTo && (
            <div className="mx-4 mb-1 px-3 py-2 bg-purple-50 border border-purple-200 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Reply className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                <p className="text-xs text-purple-700 truncate">
                  <span className="font-semibold">{replyTo.sender.firstName}:</span> {replyTo.content}
                </p>
              </div>
              <button onClick={() => setReplyTo(null)} className="text-purple-400 hover:text-purple-600 ml-2 shrink-0">
                <span className="text-xs">✕</span>
              </button>
            </div>
          )}

          {/* Input area */}
          <div className={cn("px-3 lg:px-4 pb-3 lg:pb-4", replyTo ? "pt-0" : "pt-2")}>
            <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-3 py-2 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={(e) => {
                  // Only send on Enter on desktop (non-mobile)
                  if (e.key === "Enter" && !e.shiftKey && window.innerWidth >= 1024) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={`Message ${roomDisplayName}...`}
                rows={1}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none max-h-28 leading-relaxed"
                style={{ touchAction: "manipulation" }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className="w-9 h-9 flex items-center justify-center bg-purple-600 text-white rounded-xl hover:bg-purple-700 active:bg-purple-800 disabled:opacity-40 transition-colors shrink-0"
                style={{ touchAction: "manipulation" }}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <p className="hidden lg:block text-[10px] text-gray-400 mt-1 px-1">Press Enter to send · Shift+Enter for new line</p>
          </div>
        </div>

        {/* Members panel */}
        {showMembers && room.type === "CHANNEL" && (
          <div className="w-56 border-l border-gray-100 bg-gray-50 flex flex-col shrink-0">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-700">Members · {room.participants.length}</p>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {room.participants.map((p) => {
                const name = `${p.employee.firstName} ${p.employee.lastName}`;
                return (
                  <div key={p.employeeId} className="flex items-center gap-2.5 px-3 py-2 hover:bg-gray-100 transition-colors">
                    <div className={`w-7 h-7 rounded-full ${avatarColor(name)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                      {initials(p.employee.firstName, p.employee.lastName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-800 truncate">{name}</p>
                      {p.employee.designation && <p className="text-[10px] text-gray-400 truncate">{p.employee.designation}</p>}
                    </div>
                    {p.employeeId === myEmployeeId && (
                      <span className="text-[9px] text-purple-500 font-semibold shrink-0">YOU</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
