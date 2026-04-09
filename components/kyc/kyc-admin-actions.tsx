"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2, ShieldCheck, ShieldX, MessageSquare } from "lucide-react";

interface KYCDoc {
  id: string;
  docType: string;
  label: string;
  docNumber?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  status: string;
  rejectionReason?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
  isRequired: boolean;
}

interface Props {
  employeeId: string;
  documents: KYCDoc[];
  profileStatus: string;
  profileRemarks?: string | null;
}

export default function KYCAdminActions({ employeeId, documents, profileStatus, profileRemarks }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [remarks, setRemarks] = useState(profileRemarks ?? "");
  const [rejectionInputs, setRejectionInputs] = useState<Record<string, string>>({});
  const [showRemarksInput, setShowRemarksInput] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleDocAction(docId: string, action: "VERIFY" | "REJECT", docType: string) {
    setLoading(docId);
    setError(null);
    try {
      const res = await fetch("/api/kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          docId,
          action,
          rejectionReason: action === "REJECT" ? (rejectionInputs[docType] || "Document rejected by HR") : undefined,
        }),
      });
      if (!res.ok) throw new Error("Action failed");
      setSuccess(`Document ${action === "VERIFY" ? "verified" : "rejected"} successfully`);
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    } catch {
      setError("Failed to update document. Please try again.");
    } finally {
      setLoading(null);
    }
  }

  async function handleProfileAction(action: "APPROVE" | "REJECT") {
    setLoading("profile_" + action);
    setError(null);
    try {
      const res = await fetch("/api/kyc", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileAction: action, employeeId, remarks }),
      });
      if (!res.ok) throw new Error("Action failed");
      setSuccess(`KYC ${action === "APPROVE" ? "approved" : "rejected"} successfully`);
      setShowRemarksInput(false);
      setTimeout(() => setSuccess(null), 3000);
      router.refresh();
    } catch {
      setError("Failed to update KYC status.");
    } finally {
      setLoading(null);
    }
  }

  const submittedDocs = documents.filter((d) => d.status === "SUBMITTED" || d.status === "VERIFIED" || d.status === "REJECTED");
  const canTakeProfileAction = submittedDocs.length > 0;

  return (
    <div className="space-y-6">
      {/* Flash messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2 text-sm text-green-700">
          <CheckCircle className="w-4 h-4 shrink-0" />{success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-sm text-red-700">
          <XCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Document review list */}
      <div className="space-y-3">
        {documents.length === 0 ? (
          <div className="text-center py-10 text-gray-400 bg-gray-50 rounded-xl">
            <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-medium text-gray-500">No documents submitted yet</p>
            <p className="text-xs mt-1">The employee hasn&apos;t uploaded any documents</p>
          </div>
        ) : (
          documents.map((doc) => (
            <div key={doc.id} className={`rounded-xl border p-4 transition-all ${
              doc.status === "VERIFIED" ? "border-green-200 bg-green-50/50" :
              doc.status === "REJECTED" ? "border-red-200 bg-red-50/50" :
              doc.status === "SUBMITTED" ? "border-yellow-200 bg-yellow-50/50" :
              "border-gray-100 bg-white"
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-semibold text-gray-800">{doc.label}</p>
                    {doc.isRequired && <span className="text-[10px] text-red-500 font-medium">REQUIRED</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      doc.status === "VERIFIED" ? "bg-green-100 text-green-700" :
                      doc.status === "REJECTED" ? "bg-red-100 text-red-700" :
                      doc.status === "SUBMITTED" ? "bg-yellow-100 text-yellow-700" :
                      "bg-gray-100 text-gray-500"
                    }`}>{doc.status}</span>
                  </div>

                  {doc.docNumber && (
                    <p className="text-xs text-gray-600 mt-1">
                      <span className="font-medium">Number:</span> {doc.docNumber}
                    </p>
                  )}
                  {doc.fileUrl && (
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-purple-600 hover:underline mt-1">
                      📎 {doc.fileName || "View Document"}
                    </a>
                  )}
                  {doc.status === "VERIFIED" && doc.verifiedBy && (
                    <p className="text-xs text-green-600 mt-1">
                      Verified by {doc.verifiedBy} · {doc.verifiedAt ? new Date(doc.verifiedAt).toLocaleDateString("en-IN") : ""}
                    </p>
                  )}
                  {doc.status === "REJECTED" && doc.rejectionReason && (
                    <p className="text-xs text-red-600 mt-1">Reason: {doc.rejectionReason}</p>
                  )}

                  {/* Rejection reason input */}
                  {doc.status === "SUBMITTED" && (
                    <input
                      type="text"
                      placeholder="Rejection reason (optional)"
                      value={rejectionInputs[doc.docType] ?? ""}
                      onChange={(e) => setRejectionInputs((p) => ({ ...p, [doc.docType]: e.target.value }))}
                      className="mt-2 w-full text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-400"
                    />
                  )}
                </div>

                {/* Verify / Reject buttons — only for SUBMITTED docs */}
                {doc.status === "SUBMITTED" && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleDocAction(doc.id, "VERIFY", doc.docType)}
                      disabled={loading === doc.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
                    >
                      {loading === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      Verify
                    </button>
                    <button
                      onClick={() => handleDocAction(doc.id, "REJECT", doc.docType)}
                      disabled={loading === doc.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
                    >
                      {loading === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                      Reject
                    </button>
                  </div>
                )}
                {doc.status === "VERIFIED" && (
                  <CheckCircle className="w-6 h-6 text-green-500 shrink-0" />
                )}
                {doc.status === "REJECTED" && (
                  <XCircle className="w-6 h-6 text-red-400 shrink-0" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Profile-level approve / reject */}
      {canTakeProfileAction && profileStatus !== "APPROVED" && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            Overall KYC Decision
          </p>

          {showRemarksInput && (
            <div className="mb-3">
              <label className="text-xs font-medium text-gray-600 block mb-1 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" /> Remarks for employee
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional notes visible to the employee..."
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
              />
            </div>
          )}

          <div className="flex gap-3 flex-wrap">
            {!showRemarksInput && (
              <button
                onClick={() => setShowRemarksInput(true)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" /> Add Remarks
              </button>
            )}
            <button
              onClick={() => handleProfileAction("APPROVE")}
              disabled={loading === "profile_APPROVE"}
              className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {loading === "profile_APPROVE" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Approve KYC
            </button>
            <button
              onClick={() => handleProfileAction("REJECT")}
              disabled={loading === "profile_REJECT"}
              className="flex items-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {loading === "profile_REJECT" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldX className="w-4 h-4" />}
              Reject KYC
            </button>
          </div>
        </div>
      )}

      {profileStatus === "APPROVED" && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-green-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-green-800">KYC Approved</p>
            <p className="text-xs text-green-600 mt-0.5">This employee&apos;s KYC has been fully verified.</p>
          </div>
        </div>
      )}
    </div>
  );
}
