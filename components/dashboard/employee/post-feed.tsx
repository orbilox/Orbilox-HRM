"use client";

import { useState } from "react";
import { Send, ThumbsUp, Star, BarChart2, MessageSquare } from "lucide-react";

type Tab = "post" | "poll" | "praise";

export default function PostFeed() {
  const [tab, setTab] = useState<Tab>("post");
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [praiseFor, setPraiseFor] = useState("");
  const [praiseMsg, setPraiseMsg] = useState("");

  function handleSubmit() {
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setText("");
      setPollOptions(["", ""]);
      setPraiseFor("");
      setPraiseMsg("");
    }, 2000);
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-gray-100">
        {([
          { key: "post", label: "Post", icon: MessageSquare },
          { key: "poll", label: "Poll", icon: BarChart2 },
          { key: "praise", label: "Praise", icon: Star },
        ] as { key: Tab; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? "border-purple-600 text-purple-700"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "post" && (
          <div className="space-y-3">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your post here and mention your peers..."
              rows={3}
              className="w-full text-sm text-gray-700 placeholder-gray-400 resize-none outline-none border border-gray-100 rounded-lg p-3 focus:border-purple-300 focus:ring-1 focus:ring-purple-200 transition"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!text.trim() || submitted}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                {submitted ? "Posted!" : "Post"}
              </button>
            </div>
          </div>
        )}

        {tab === "poll" && (
          <div className="space-y-3">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ask a question..."
              className="w-full text-sm border border-gray-100 rounded-lg p-3 outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-200"
            />
            <div className="space-y-2">
              {pollOptions.map((opt, i) => (
                <input
                  key={i}
                  value={opt}
                  onChange={(e) => {
                    const next = [...pollOptions];
                    next[i] = e.target.value;
                    setPollOptions(next);
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="w-full text-sm border border-gray-100 rounded-lg p-2.5 outline-none focus:border-purple-300"
                />
              ))}
              {pollOptions.length < 4 && (
                <button
                  onClick={() => setPollOptions([...pollOptions, ""])}
                  className="text-xs text-purple-600 hover:underline"
                >
                  + Add option
                </button>
              )}
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!text.trim() || submitted}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                {submitted ? "Created!" : "Create Poll"}
              </button>
            </div>
          </div>
        )}

        {tab === "praise" && (
          <div className="space-y-3">
            <input
              value={praiseFor}
              onChange={(e) => setPraiseFor(e.target.value)}
              placeholder="Who are you praising? (name or @mention)"
              className="w-full text-sm border border-gray-100 rounded-lg p-3 outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-200"
            />
            <textarea
              value={praiseMsg}
              onChange={(e) => setPraiseMsg(e.target.value)}
              placeholder="Say something nice..."
              rows={2}
              className="w-full text-sm resize-none border border-gray-100 rounded-lg p-3 outline-none focus:border-purple-300 focus:ring-1 focus:ring-purple-200"
            />
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={!praiseFor.trim() || !praiseMsg.trim() || submitted}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                {submitted ? "Praised!" : "Send Praise"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
