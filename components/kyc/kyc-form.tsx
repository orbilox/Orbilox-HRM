"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck, Upload, CheckCircle, XCircle, Clock,
  ChevronRight, ChevronDown, AlertCircle, Loader2, Save, Send
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DocConfig {
  docType: string;
  label: string;
  isRequired: boolean;
  hasNumber?: boolean;
  numberLabel?: string;
}

interface KYCDoc {
  id: string;
  docType: string;
  label: string;
  docNumber?: string;
  fileUrl?: string;
  fileName?: string;
  status: string;
  rejectionReason?: string;
  isRequired: boolean;
}

interface KYCProfile {
  status: string;
  completionPct: number;
  submittedAt?: string;
  reviewedAt?: string;
  remarks?: string;
}

const DOC_GROUPS = [
  {
    title: "Identity Documents",
    icon: "🪪",
    types: ["PHOTO", "AADHAAR", "PAN", "PASSPORT"],
  },
  {
    title: "Financial Details",
    icon: "🏦",
    types: ["BANK"],
  },
  {
    title: "Address & Other",
    icon: "📄",
    types: ["ADDRESS_PROOF", "EDUCATION", "EXPERIENCE"],
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING:   { label: "Not Uploaded",  color: "bg-gray-100 text-gray-600",   icon: <Clock className="w-3.5 h-3.5" /> },
  SUBMITTED: { label: "Under Review",  color: "bg-yellow-100 text-yellow-700", icon: <Clock className="w-3.5 h-3.5" /> },
  VERIFIED:  { label: "Verified",      color: "bg-green-100 text-green-700",  icon: <CheckCircle className="w-3.5 h-3.5" /> },
  REJECTED:  { label: "Rejected",      color: "bg-red-100 text-red-700",      icon: <XCircle className="w-3.5 h-3.5" /> },
};

const profileStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  NOT_STARTED:  { label: "Not Started",   color: "text-gray-600",   bg: "bg-gray-50" },
  IN_PROGRESS:  { label: "In Progress",   color: "text-blue-700",   bg: "bg-blue-50" },
  SUBMITTED:    { label: "Submitted",     color: "text-yellow-700", bg: "bg-yellow-50" },
  UNDER_REVIEW: { label: "Under Review",  color: "text-orange-700", bg: "bg-orange-50" },
  APPROVED:     { label: "KYC Approved",  color: "text-green-700",  bg: "bg-green-50" },
  REJECTED:     { label: "Action Required", color: "text-red-700",  bg: "bg-red-50" },
};

export default function KYCForm() {
  const [docs, setDocs] = useState<KYCDoc[]>([]);
  const [profile, setProfile] = useState<KYCProfile | null>(null);
  const [docConfig, setDocConfig] = useState<DocConfig[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string>("Identity Documents");
  const [editingDoc, setEditingDoc] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, { docNumber: string; fileUrl: string; fileName: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/kyc");
      const data = await res.json();
      setDocs(data.documents ?? []);
      setProfile(data.profile ?? null);
      setDocConfig(data.docConfig ?? []);
    } catch {
      setError("Failed to load KYC data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function getDoc(docType: string) {
    return docs.find((d) => d.docType === docType);
  }

  function getConfig(docType: string) {
    return docConfig.find((c) => c.docType === docType);
  }

  function startEdit(docType: string) {
    const existing = getDoc(docType);
    setFormData((prev) => ({
      ...prev,
      [docType]: {
        docNumber: existing?.docNumber ?? "",
        fileUrl: existing?.fileUrl ?? "",
        fileName: existing?.fileName ?? "",
      },
    }));
    setEditingDoc(docType);
  }

  async function saveDoc(docType: string) {
    const cfg = getConfig(docType);
    if (!cfg) return;
    setSaving(docType);
    setError(null);
    const fd = formData[docType] ?? { docNumber: "", fileUrl: "", fileName: "" };
    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docType,
          label: cfg.label,
          docNumber: fd.docNumber,
          fileUrl: fd.fileUrl,
          fileName: fd.fileName || cfg.label,
          isRequired: cfg.isRequired,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSuccessMsg(`${cfg.label} saved successfully!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      setEditingDoc(null);
      await load();
    } catch {
      setError("Failed to save document. Please try again.");
    } finally {
      setSaving(null);
    }
  }

  const pct = profile?.completionPct ?? 0;
  const ps = profileStatusConfig[profile?.status ?? "NOT_STARTED"];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className={`rounded-2xl p-5 flex items-center gap-5 ${ps.bg}`}>
        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center shadow-sm shrink-0">
          <ShieldCheck className={`w-7 h-7 ${ps.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className={`text-lg font-bold ${ps.color}`}>KYC Status: {ps.label}</h2>
            {profile?.submittedAt && (
              <span className="text-xs text-gray-500">
                Submitted: {new Date(profile.submittedAt).toLocaleDateString("en-IN")}
              </span>
            )}
          </div>
          {/* Progress bar */}
          <div className="mt-2 flex items-center gap-3">
            <div className="flex-1 bg-white rounded-full h-2 overflow-hidden shadow-inner">
              <div
                className={`h-2 rounded-full transition-all duration-700 ${pct === 100 ? "bg-green-500" : "bg-purple-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className={`text-sm font-bold ${ps.color}`}>{pct}%</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {docConfig.filter((c) => c.isRequired).length - docs.filter((d) => d.isRequired && d.status !== "PENDING").length} required documents remaining
          </p>
        </div>
        {profile?.status === "APPROVED" && (
          <div className="shrink-0">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
        )}
      </div>

      {/* Admin remarks */}
      {profile?.remarks && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-orange-800">Remarks from HR</p>
            <p className="text-sm text-orange-700 mt-0.5">{profile.remarks}</p>
          </div>
        </div>
      )}

      {/* Success / error flash */}
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="w-4 h-4" />{successMsg}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700">
          <XCircle className="w-4 h-4" />{error}
        </div>
      )}

      {/* Document groups */}
      {DOC_GROUPS.map((group) => {
        const groupDocs = docConfig.filter((c) => group.types.includes(c.docType));
        const isOpen = expandedGroup === group.title;
        const groupDone = groupDocs.filter((c) => {
          const d = getDoc(c.docType);
          return d && d.status !== "PENDING";
        }).length;

        return (
          <div key={group.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Group header */}
            <button
              className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedGroup(isOpen ? "" : group.title)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{group.icon}</span>
                <div className="text-left">
                  <p className="text-sm font-semibold text-gray-800">{group.title}</p>
                  <p className="text-xs text-gray-400">{groupDone}/{groupDocs.length} documents uploaded</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-1">
                  {groupDocs.map((c) => {
                    const d = getDoc(c.docType);
                    const s = d?.status ?? "PENDING";
                    return (
                      <div
                        key={c.docType}
                        className={`w-2 h-2 rounded-full ${s === "VERIFIED" ? "bg-green-500" : s === "REJECTED" ? "bg-red-500" : s === "SUBMITTED" ? "bg-yellow-400" : "bg-gray-200"}`}
                        title={c.label}
                      />
                    );
                  })}
                </div>
                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
              </div>
            </button>

            {isOpen && (
              <div className="border-t border-gray-50 divide-y divide-gray-50">
                {groupDocs.map((cfg) => {
                  const doc = getDoc(cfg.docType);
                  const status = doc?.status ?? "PENDING";
                  const sc = statusConfig[status];
                  const isEditing = editingDoc === cfg.docType;
                  const fd = formData[cfg.docType] ?? { docNumber: "", fileUrl: "", fileName: "" };
                  const isVerified = status === "VERIFIED";

                  return (
                    <div key={cfg.docType} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-gray-800">{cfg.label}</p>
                            {cfg.isRequired && <span className="text-[10px] text-red-500 font-medium">REQUIRED</span>}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.color}`}>
                              {sc.icon}{sc.label}
                            </span>
                          </div>

                          {/* Submitted data summary */}
                          {doc && !isEditing && (
                            <div className="mt-2 space-y-1">
                              {doc.docNumber && (
                                <p className="text-xs text-gray-500">
                                  <span className="font-medium">Number:</span> {doc.docNumber}
                                </p>
                              )}
                              {doc.fileUrl && (
                                <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-purple-600 hover:underline inline-flex items-center gap-1">
                                  <Upload className="w-3 h-3" />
                                  {doc.fileName || "View document"}
                                </a>
                              )}
                              {doc.rejectionReason && (
                                <p className="text-xs text-red-600 mt-1">
                                  <span className="font-semibold">Rejection reason:</span> {doc.rejectionReason}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Edit form */}
                          {isEditing && (
                            <div className="mt-3 space-y-3 bg-gray-50 rounded-xl p-4">
                              {cfg.hasNumber && (
                                <div>
                                  <label className="text-xs font-medium text-gray-600 block mb-1">
                                    {cfg.numberLabel ?? "Document Number"}
                                  </label>
                                  <input
                                    type="text"
                                    value={fd.docNumber}
                                    onChange={(e) => setFormData((p) => ({ ...p, [cfg.docType]: { ...fd, docNumber: e.target.value } }))}
                                    placeholder={cfg.numberLabel ?? "Enter document number"}
                                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                  />
                                </div>
                              )}
                              <div>
                                <label className="text-xs font-medium text-gray-600 block mb-1">
                                  Document File URL <span className="text-gray-400 font-normal">(paste Google Drive / Dropbox link)</span>
                                </label>
                                <input
                                  type="url"
                                  value={fd.fileUrl}
                                  onChange={(e) => setFormData((p) => ({ ...p, [cfg.docType]: { ...fd, fileUrl: e.target.value } }))}
                                  placeholder="https://drive.google.com/file/..."
                                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => saveDoc(cfg.docType)}
                                  disabled={saving === cfg.docType}
                                  className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-60 transition-colors"
                                >
                                  {saving === cfg.docType ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingDoc(null)}
                                  className="px-4 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Action button */}
                        {!isEditing && !isVerified && (
                          <button
                            onClick={() => startEdit(cfg.docType)}
                            className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                              status === "REJECTED"
                                ? "bg-red-600 text-white hover:bg-red-700"
                                : status === "SUBMITTED"
                                ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                : "bg-purple-600 text-white hover:bg-purple-700"
                            }`}
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {status === "PENDING" ? "Upload" : status === "REJECTED" ? "Re-upload" : "Update"}
                          </button>
                        )}
                        {isVerified && (
                          <div className="shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
        <p className="text-sm font-semibold text-blue-800 mb-2">📋 Instructions</p>
        <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
          <li>Upload clear, legible scanned copies or photos of original documents</li>
          <li>Accepted formats: PDF, JPG, PNG — max 5MB per file</li>
          <li>Paste a shareable Google Drive or Dropbox link in the URL field</li>
          <li>Aadhaar number must be exactly 12 digits; PAN must be 10 characters</li>
          <li>Documents marked <span className="text-red-600 font-medium">REQUIRED</span> must be submitted for KYC approval</li>
          <li>HR will verify your documents within 2-3 business days</li>
        </ul>
      </div>
    </div>
  );
}
