import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Briefcase, Users, UserCheck, Calendar, Plus } from "lucide-react";
import Link from "next/link";

async function getRecruitmentData() {
  const [jobs, applications] = await Promise.all([
    db.job.findMany({
      include: {
        department: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.application.findMany({
      select: { stage: true },
    }),
  ]);
  return { jobs, applications };
}

const jobStatusVariant: Record<string, "success" | "secondary" | "warning"> = {
  OPEN: "success",
  CLOSED: "secondary",
  ON_HOLD: "warning",
};

const PIPELINE_STAGES = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "HIRED", "REJECTED"];

const stageColors: Record<string, string> = {
  APPLIED: "bg-blue-100 text-blue-700",
  SCREENING: "bg-yellow-100 text-yellow-700",
  INTERVIEW: "bg-purple-100 text-purple-700",
  OFFER: "bg-orange-100 text-orange-700",
  HIRED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

export default async function RecruitmentPage() {
  const { jobs, applications } = await getRecruitmentData();

  const openJobs = jobs.filter((j) => j.status === "OPEN").length;
  const totalApplications = applications.length;
  const hired = applications.filter((a) => a.stage === "HIRED").length;
  const interviewScheduled = applications.filter((a) => a.stage === "INTERVIEW").length;

  const stats = [
    { label: "Open Jobs", value: openJobs, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Total Applications", value: totalApplications, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Hired", value: hired, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
    { label: "Interview Scheduled", value: interviewScheduled, icon: Calendar, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  const pipelineCounts = PIPELINE_STAGES.reduce<Record<string, number>>((acc, stage) => {
    acc[stage] = applications.filter((a) => a.stage === stage).length;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruitment</h1>
          <p className="text-gray-500 mt-1">Manage job openings and candidate pipeline</p>
        </div>
        <Link href="/recruitment/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Post New Job
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500 font-medium">{s.label}</span>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.bg}`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Candidate Pipeline */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Candidate Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {PIPELINE_STAGES.map((stage) => (
              <div key={stage} className="text-center">
                <div className={`rounded-lg p-3 mb-2 ${stageColors[stage]}`}>
                  <div className="text-2xl font-bold">{pipelineCounts[stage]}</div>
                </div>
                <div className="text-xs font-medium text-gray-600">{stage}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Job Openings */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Job Openings</CardTitle>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No jobs posted yet</p>
              <p className="text-sm mt-1">Post your first job opening to start hiring</p>
              <Link href="/recruitment/new">
                <Button className="mt-4" size="sm">Post New Job</Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left pb-3 font-medium text-gray-500">Title</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Department</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Type</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Openings</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Applications</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Posted</th>
                    <th className="text-left pb-3 font-medium text-gray-500">Status</th>
                    <th className="text-right pb-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {jobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4">
                        <div className="font-medium text-gray-900">{job.title}</div>
                        {job.location && (
                          <div className="text-xs text-gray-400">{job.location}</div>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{job.department?.name ?? "—"}</td>
                      <td className="py-3 pr-4">
                        <span className="text-xs text-gray-500">{job.type.replace("_", " ")}</span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{job.openings}</td>
                      <td className="py-3 pr-4">
                        <span className="font-medium text-gray-900">{job._count.applications}</span>
                      </td>
                      <td className="py-3 pr-4 text-gray-500 text-xs">{formatDate(job.createdAt)}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={jobStatusVariant[job.status] ?? "secondary"} className="text-xs">
                          {job.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Link href={`/recruitment/${job.id}`} className="text-blue-600 hover:underline text-xs font-medium">
                          View
                        </Link>
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
