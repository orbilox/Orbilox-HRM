import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Search, ExternalLink } from "lucide-react";

const docTypeColors: Record<string, string> = {
  OFFER_LETTER: "bg-blue-100 text-blue-700",
  EXPERIENCE: "bg-green-100 text-green-700",
  ID_PROOF: "bg-purple-100 text-purple-700",
  PAYSLIP: "bg-orange-100 text-orange-700",
  CONTRACT: "bg-pink-100 text-pink-700",
};

export default async function DocumentsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const session = await auth();
  const role = session?.user?.role ?? "EMPLOYEE";
  const isAdmin = role === "ADMIN" || role === "HR" || role === "MANAGER";
  const params = await searchParams;

  // ── EMPLOYEE VIEW ──────────────────────────────────────────────────────────
  if (!isAdmin) {
    const employeeId = session?.user?.employeeId;
    if (!employeeId) {
      return (
        <div className="p-8 text-center text-gray-500">
          Your account is not linked to an employee profile. Please contact HR.
        </div>
      );
    }

    const documents = await db.document.findMany({
      where: { employeeId },
      orderBy: { createdAt: "desc" },
    });

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
            <p className="text-gray-500 mt-1">Your personal documents and files</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Documents", value: documents.length, color: "text-blue-600" },
            { label: "Offer Letters", value: documents.filter((d) => d.type === "OFFER_LETTER").length, color: "text-green-600" },
            { label: "ID Proofs", value: documents.filter((d) => d.type === "ID_PROOF").length, color: "text-purple-600" },
            { label: "Payslips", value: documents.filter((d) => d.type === "PAYSLIP").length, color: "text-orange-600" },
          ].map((s) => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />My Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No documents yet</p>
                <p className="text-sm mt-1">Your HR team will upload documents for you here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 hover:border-purple-100 hover:bg-purple-50/20 transition-all">
                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{doc.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(doc.createdAt)}</p>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 ${docTypeColors[doc.type] ?? "bg-gray-100 text-gray-700"}`}>
                      {doc.type.replace(/_/g, " ")}
                    </span>
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-purple-600 hover:underline text-xs font-medium shrink-0"
                    >
                      <ExternalLink className="w-3 h-3" />View
                    </a>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── ADMIN VIEW ─────────────────────────────────────────────────────────────
  const documents = await db.document.findMany({
    where: params.search
      ? { employee: { OR: [{ firstName: { contains: params.search } }, { lastName: { contains: params.search } }] } }
      : undefined,
    include: { employee: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-500 mt-1">Manage employee documents and files</p>
        </div>
        <Button>
          <Upload className="w-4 h-4 mr-2" />Upload Document
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Documents", value: documents.length, color: "text-blue-600" },
          { label: "Offer Letters", value: documents.filter((d) => d.type === "OFFER_LETTER").length, color: "text-green-600" },
          { label: "ID Proofs", value: documents.filter((d) => d.type === "ID_PROOF").length, color: "text-purple-600" },
          { label: "Payslips", value: documents.filter((d) => d.type === "PAYSLIP").length, color: "text-orange-600" },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4" />All Documents
            </CardTitle>
            <form className="flex-1 max-w-sm ml-auto">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  name="search"
                  type="text"
                  placeholder="Search by employee name..."
                  defaultValue={params.search}
                  className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </form>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No documents found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-3 font-medium text-gray-500">Employee</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Document Name</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Type</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Uploaded Date</th>
                    <th className="text-right pb-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {doc.employee.firstName[0]}{doc.employee.lastName[0]}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{doc.employee.firstName} {doc.employee.lastName}</div>
                            <div className="text-xs text-gray-400">{doc.employee.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-gray-700">{doc.name}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${docTypeColors[doc.type] ?? "bg-gray-100 text-gray-700"}`}>
                          {doc.type.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">{formatDate(doc.createdAt)}</td>
                      <td className="py-3 text-right">
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline text-xs font-medium">
                          <ExternalLink className="w-3 h-3" />View
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
