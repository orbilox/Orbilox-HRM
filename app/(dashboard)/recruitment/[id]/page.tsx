import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MapPin, Briefcase, Users, Calendar } from "lucide-react";
import Link from "next/link";

const stageColors: Record<string, string> = {
  APPLIED: "bg-blue-100 text-blue-700",
  SCREENING: "bg-yellow-100 text-yellow-700",
  INTERVIEW: "bg-purple-100 text-purple-700",
  OFFER: "bg-orange-100 text-orange-700",
  HIRED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await db.job.findUnique({
    where: { id },
    include: {
      department: true,
      applications: {
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!job) notFound();

  const stageCounts = job.applications.reduce<Record<string, number>>((acc, app) => {
    acc[app.stage] = (acc[app.stage] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/recruitment">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{job.title}</h1>
            <Badge variant={job.status === "OPEN" ? "success" : job.status === "ON_HOLD" ? "warning" : "secondary"}>
              {job.status}
            </Badge>
          </div>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 flex-wrap">
            {job.department && <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{job.department.name}</span>}
            {job.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{job.location}</span>}
            <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{job.openings} opening{job.openings !== 1 ? "s" : ""}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />Posted {formatDate(job.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Job Details */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base">Job Description</CardTitle></CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{job.description}</p>
              {job.requirements && (
                <>
                  <h4 className="font-semibold text-sm text-gray-900 mt-4 mb-2">Requirements</h4>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{job.requirements}</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Candidates */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center justify-between">
                <span>Candidates ({job.applications.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {job.applications.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">No applications yet</p>
              ) : (
                <div className="space-y-2">
                  {job.applications.map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div>
                        <div className="font-medium text-sm text-gray-900">{app.candidateName}</div>
                        <div className="text-xs text-gray-400">{app.candidateEmail}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${stageColors[app.stage] ?? "bg-gray-100 text-gray-600"}`}>
                          {app.stage}
                        </span>
                        <span className="text-xs text-gray-400">{formatDate(app.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm text-gray-600">Job Info</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium">{job.type.replace("_", " ")}</span></div>
              {job.experience && <div className="flex justify-between"><span className="text-gray-500">Experience</span><span className="font-medium">{job.experience}</span></div>}
              {job.salary && <div className="flex justify-between"><span className="text-gray-500">Salary</span><span className="font-medium">{job.salary}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Openings</span><span className="font-medium">{job.openings}</span></div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-sm text-gray-600">Pipeline</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"].map((stage) => (
                <div key={stage} className="flex items-center justify-between">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stageColors[stage] ?? ""}`}>{stage}</span>
                  <span className="text-sm font-bold text-gray-700">{stageCounts[stage] ?? 0}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
