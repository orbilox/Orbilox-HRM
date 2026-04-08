import { auth } from "@/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Target, Star, Plus, ClipboardList, TrendingUp, CheckCircle } from "lucide-react";

const goalStatusVariant: Record<string, "success" | "warning" | "secondary" | "destructive"> = {
  COMPLETED: "success",
  IN_PROGRESS: "warning",
  ON_HOLD: "secondary",
  CANCELLED: "destructive",
};

const reviewStatusVariant: Record<string, "success" | "warning" | "secondary"> = {
  SUBMITTED: "success",
  PENDING: "warning",
  ACKNOWLEDGED: "secondary",
};

export default async function PerformancePage() {
  const session = await auth();
  const role = session?.user?.role ?? "EMPLOYEE";
  const isAdmin = role === "ADMIN" || role === "HR" || role === "MANAGER";

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

    const [goals, reviews] = await Promise.all([
      db.goal.findMany({
        where: { employeeId },
        orderBy: { createdAt: "desc" },
      }),
      db.review.findMany({
        where: { employeeId },
        include: { reviewer: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const stats = [
      { label: "Total Goals", value: goals.length, color: "text-blue-600", bg: "bg-blue-50", icon: Target },
      { label: "Completed", value: goals.filter((g) => g.status === "COMPLETED").length, color: "text-green-600", bg: "bg-green-50", icon: CheckCircle },
      { label: "In Progress", value: goals.filter((g) => g.status === "IN_PROGRESS").length, color: "text-orange-600", bg: "bg-orange-50", icon: TrendingUp },
      { label: "My Reviews", value: reviews.length, color: "text-purple-600", bg: "bg-purple-50", icon: Star },
    ];

    const avgProgress = goals.length > 0
      ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
      : 0;

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Performance</h1>
            <p className="text-gray-500 mt-1">Track your goals and performance reviews</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((s) => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                  </div>
                  <div className={`p-2 rounded-lg ${s.bg}`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Overall progress bar */}
        {goals.length > 0 && (
          <Card className="border-0 shadow-sm bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Overall Goal Progress</p>
                  <p className="text-xs text-gray-500">{goals.filter((g) => g.status === "COMPLETED").length} of {goals.length} goals completed</p>
                </div>
                <span className="text-2xl font-bold text-purple-600">{avgProgress}%</span>
              </div>
              <Progress value={avgProgress} className="h-2" />
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="goals">
          <TabsList>
            <TabsTrigger value="goals"><Target className="w-4 h-4 mr-2" />My Goals</TabsTrigger>
            <TabsTrigger value="reviews"><Star className="w-4 h-4 mr-2" />My Reviews</TabsTrigger>
          </TabsList>

          <TabsContent value="goals">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">My Goals</CardTitle>
              </CardHeader>
              <CardContent>
                {goals.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No goals set yet</p>
                    <p className="text-sm mt-1">Your manager will assign goals to you</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {goals.map((goal) => (
                      <div key={goal.id} className="p-4 rounded-xl border border-gray-100 hover:border-purple-100 transition-all">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800">{goal.title}</p>
                            {goal.description && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{goal.description}</p>}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="secondary" className="text-xs">{goal.category}</Badge>
                            <Badge variant={goalStatusVariant[goal.status] ?? "secondary"} className="text-xs">
                              {goal.status.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={goal.progress} className="h-2 flex-1" />
                          <span className="text-xs font-semibold text-purple-600 w-8 text-right">{goal.progress}%</span>
                        </div>
                        {goal.targetDate && (
                          <p className="text-xs text-gray-400 mt-2">Target: {formatDate(goal.targetDate)}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">My Performance Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="font-medium">No reviews yet</p>
                    <p className="text-sm mt-1">Your performance reviews will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => {
                      let ratings: Record<string, number> = {};
                      try { ratings = JSON.parse(review.ratings); } catch {}
                      return (
                        <div key={review.id} className="p-4 rounded-xl border border-gray-100 hover:border-purple-100 transition-all">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{review.period} {review.year}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                Reviewed by: {review.reviewer.firstName} {review.reviewer.lastName}
                              </p>
                            </div>
                            <Badge variant={reviewStatusVariant[review.status] ?? "secondary"} className="text-xs shrink-0">
                              {review.status}
                            </Badge>
                          </div>
                          {ratings.overall !== undefined && (
                            <div className="flex items-center gap-1 mt-3">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < ratings.overall ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                              ))}
                              <span className="text-xs text-gray-500 ml-1">{ratings.overall}/5 overall</span>
                            </div>
                          )}
                          {review.strengths && (
                            <div className="mt-3">
                              <p className="text-xs font-medium text-green-700">Strengths</p>
                              <p className="text-xs text-gray-600 mt-0.5">{review.strengths}</p>
                            </div>
                          )}
                          {review.improvements && (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-orange-600">Areas to Improve</p>
                              <p className="text-xs text-gray-600 mt-0.5">{review.improvements}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // ── ADMIN VIEW ─────────────────────────────────────────────────────────────
  const [goals, reviews] = await Promise.all([
    db.goal.findMany({ include: { employee: true }, orderBy: { createdAt: "desc" } }),
    db.review.findMany({ include: { employee: true, reviewer: true }, orderBy: { createdAt: "desc" } }),
  ]);

  const stats = [
    { label: "Total Goals", value: goals.length, color: "text-blue-600" },
    { label: "Completed", value: goals.filter((g) => g.status === "COMPLETED").length, color: "text-green-600" },
    { label: "In Progress", value: goals.filter((g) => g.status === "IN_PROGRESS").length, color: "text-orange-600" },
    { label: "Pending Reviews", value: reviews.filter((r) => r.status === "PENDING").length, color: "text-purple-600" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Management</h1>
          <p className="text-gray-500 mt-1">Track goals and performance reviews</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-2" />Add Goal</Button>
          <Button size="sm"><ClipboardList className="w-4 h-4 mr-2" />Start Review</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="goals">
        <TabsList>
          <TabsTrigger value="goals"><Target className="w-4 h-4 mr-2" />Goals</TabsTrigger>
          <TabsTrigger value="reviews"><Star className="w-4 h-4 mr-2" />Reviews</TabsTrigger>
        </TabsList>

        <TabsContent value="goals">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Employee Goals</CardTitle></CardHeader>
            <CardContent>
              {goals.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No goals set yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-3 font-medium text-gray-500">Employee</th>
                        <th className="text-left pb-3 font-medium text-gray-500">Title</th>
                        <th className="text-left pb-3 font-medium text-gray-500">Category</th>
                        <th className="text-left pb-3 font-medium text-gray-500 min-w-[150px]">Progress</th>
                        <th className="text-left pb-3 font-medium text-gray-500">Target Date</th>
                        <th className="text-left pb-3 font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {goals.map((goal) => (
                        <tr key={goal.id} className="hover:bg-gray-50 transition-colors">
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                {goal.employee.firstName[0]}{goal.employee.lastName[0]}
                              </div>
                              <span className="font-medium text-gray-900">{goal.employee.firstName} {goal.employee.lastName}</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-gray-700">{goal.title}</td>
                          <td className="py-3 pr-4"><Badge variant="secondary" className="text-xs">{goal.category}</Badge></td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <Progress value={goal.progress} className="h-2 w-24" />
                              <span className="text-xs text-gray-500 shrink-0">{goal.progress}%</span>
                            </div>
                          </td>
                          <td className="py-3 pr-4 text-gray-500 text-xs">{goal.targetDate ? formatDate(goal.targetDate) : "—"}</td>
                          <td className="py-3"><Badge variant={goalStatusVariant[goal.status] ?? "secondary"} className="text-xs">{goal.status.replace("_", " ")}</Badge></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">Performance Reviews</CardTitle></CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Star className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No reviews yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-3 font-medium text-gray-500">Employee</th>
                        <th className="text-left pb-3 font-medium text-gray-500">Reviewer</th>
                        <th className="text-left pb-3 font-medium text-gray-500">Period</th>
                        <th className="text-left pb-3 font-medium text-gray-500">Overall Rating</th>
                        <th className="text-left pb-3 font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {reviews.map((review) => {
                        let overallRating: number | null = null;
                        try { const p = JSON.parse(review.ratings); overallRating = p?.overall ?? null; } catch {}
                        return (
                          <tr key={review.id} className="hover:bg-gray-50 transition-colors">
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {review.employee.firstName[0]}{review.employee.lastName[0]}
                                </div>
                                <span className="font-medium text-gray-900">{review.employee.firstName} {review.employee.lastName}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-4 text-gray-600">{review.reviewer.firstName} {review.reviewer.lastName}</td>
                            <td className="py-3 pr-4 text-gray-600">{review.period} {review.year}</td>
                            <td className="py-3 pr-4">
                              {overallRating !== null ? (
                                <div className="flex items-center gap-1">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <Star key={i} className={`w-3.5 h-3.5 ${i < overallRating! ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                                  ))}
                                  <span className="text-xs text-gray-500 ml-1">{overallRating}/5</span>
                                </div>
                              ) : <span className="text-gray-400 text-xs">Not rated</span>}
                            </td>
                            <td className="py-3"><Badge variant={reviewStatusVariant[review.status] ?? "secondary"} className="text-xs">{review.status}</Badge></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
