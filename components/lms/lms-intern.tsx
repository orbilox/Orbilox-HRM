"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen, CheckCircle2, Circle, GraduationCap, ListTodo,
  Trophy, Clock, ChevronDown, ChevronRight, Video, FileText,
  ClipboardCheck, PenLine, RefreshCw,
} from "lucide-react";

type Task = {
  id: string; title: string; description?: string | null;
  type: string; content?: string | null; dueInDays?: number | null; order: number;
};
type Module = { id: string; title: string; description?: string | null; order: number; tasks: Task[] };
type Course = {
  id: string; title: string; description?: string | null; category: string;
  modules: Module[];
};
type Enrollment = {
  id: string; courseId: string; status: string; enrolledAt: string;
  course: Course;
};

const typeIcon: Record<string, React.ComponentType<{ className?: string }>> = {
  VIDEO: Video,
  READING: FileText,
  TASK: ClipboardCheck,
  ASSIGNMENT: PenLine,
};

const catColors: Record<string, string> = {
  TECHNICAL: "bg-blue-100 text-blue-700",
  SOFT_SKILLS: "bg-purple-100 text-purple-700",
  COMPLIANCE: "bg-red-100 text-red-700",
  ONBOARDING: "bg-green-100 text-green-700",
  GENERAL: "bg-gray-100 text-gray-700",
};

export default function LmsIntern({
  enrollments: init,
  completedTaskIds: initCompleted,
}: {
  enrollments: Enrollment[];
  completedTaskIds: string[];
}) {
  const router = useRouter();
  const [enrollments] = useState<Enrollment[]>(init);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set(initCompleted));
  const [loadingTask, setLoadingTask] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(
    enrollments[0]?.course.id ?? null
  );

  async function handleRefresh() {
    setRefreshing(true);
    router.refresh();
    setTimeout(() => setRefreshing(false), 1500);
  }

  async function toggleTask(taskId: string, done: boolean) {
    setLoadingTask(taskId);
    const method = done ? "DELETE" : "POST";
    const res = await fetch(`/api/lms/tasks/${taskId}`, { method });
    if (res.ok) {
      setCompletedIds((prev) => {
        const next = new Set(prev);
        if (done) next.delete(taskId);
        else next.add(taskId);
        return next;
      });
    }
    setLoadingTask(null);
  }

  const allTasks = enrollments.flatMap((e) =>
    e.course.modules.flatMap((m) => m.tasks)
  );
  const totalTasks = allTasks.length;
  const completedCount = allTasks.filter((t) => completedIds.has(t.id)).length;
  const overallPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const completedCourses = enrollments.filter((e) => {
    const tasks = e.course.modules.flatMap((m) => m.tasks);
    return tasks.length > 0 && tasks.every((t) => completedIds.has(t.id));
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Learning</h1>
          <p className="text-gray-500 mt-1">Track your assigned courses and complete tasks</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Enrolled Courses", value: enrollments.length, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Tasks Completed", value: completedCount, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: "Remaining Tasks", value: totalTasks - completedCount, icon: ListTodo, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Courses Done", value: completedCourses.length, icon: Trophy, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((s) => (
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

      {/* Overall progress */}
      {totalTasks > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-700">Overall Learning Progress</p>
                <p className="text-xs text-gray-500">{completedCount} of {totalTasks} tasks completed</p>
              </div>
              <span className="text-2xl font-bold text-blue-600">{overallPct}%</span>
            </div>
            <Progress value={overallPct} className="h-2.5" />
          </CardContent>
        </Card>
      )}

      {enrollments.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center">
            <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="font-medium text-gray-500">No courses assigned yet</p>
            <p className="text-sm text-gray-400 mt-1">Your manager will assign learning courses to you</p>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing} className="mt-4 gap-2">
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Checking..." : "Check for new courses"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {enrollments.map((enrollment) => {
            const course = enrollment.course;
            const courseTasks = course.modules.flatMap((m) => m.tasks);
            const courseCompleted = courseTasks.filter((t) => completedIds.has(t.id)).length;
            const coursePct = courseTasks.length > 0 ? Math.round((courseCompleted / courseTasks.length) * 100) : 0;
            const isExpanded = expandedCourse === course.id;
            const isDone = courseTasks.length > 0 && courseCompleted === courseTasks.length;

            return (
              <Card key={enrollment.id} className="border-0 shadow-sm overflow-hidden">
                <div
                  className="flex items-center gap-4 p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDone ? "bg-green-600" : "bg-blue-600"}`}>
                    {isDone ? <Trophy className="w-5 h-5 text-white" /> : <GraduationCap className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{course.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColors[course.category] ?? catColors.GENERAL}`}>
                        {course.category.replace("_", " ")}
                      </span>
                      {isDone && <Badge variant="success" className="text-xs">Completed</Badge>}
                    </div>
                    {course.description && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{course.description}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <Progress value={coursePct} className="h-1.5 flex-1 max-w-[200px]" />
                      <span className="text-xs font-semibold text-gray-600">{coursePct}%</span>
                      <span className="text-xs text-gray-400">{courseCompleted}/{courseTasks.length} tasks</span>
                    </div>
                  </div>
                  {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" /> : <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />}
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100">
                    {course.modules.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6">No content added yet.</p>
                    ) : (
                      course.modules.map((mod, mi) => {
                        const modTasks = mod.tasks;
                        const modDone = modTasks.filter((t) => completedIds.has(t.id)).length;
                        const allModDone = modTasks.length > 0 && modDone === modTasks.length;

                        return (
                          <div key={mod.id} className="border-b border-gray-100 last:border-0">
                            <div className={`flex items-center gap-3 px-5 py-3 ${allModDone ? "bg-green-50" : "bg-gray-50"}`}>
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${allModDone ? "bg-green-600 text-white" : "bg-blue-100 text-blue-700"}`}>
                                {allModDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : mi + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 text-sm">{mod.title}</p>
                                {mod.description && <p className="text-xs text-gray-500">{mod.description}</p>}
                              </div>
                              <span className="text-xs text-gray-400 shrink-0">{modDone}/{modTasks.length}</span>
                            </div>
                            {modTasks.map((task) => {
                              const done = completedIds.has(task.id);
                              const loading = loadingTask === task.id;
                              const Icon = typeIcon[task.type] ?? FileText;

                              return (
                                <div
                                  key={task.id}
                                  className={`flex items-start gap-3 px-5 py-3 border-t border-gray-50 transition-colors ${done ? "bg-green-50/40" : "hover:bg-gray-50"}`}
                                >
                                  <button
                                    onClick={() => !loading && toggleTask(task.id, done)}
                                    disabled={loading}
                                    className="mt-0.5 shrink-0 transition-all hover:scale-110"
                                  >
                                    {done ? (
                                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    ) : (
                                      <Circle className="w-5 h-5 text-gray-300 hover:text-blue-400" />
                                    )}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm ${done ? "line-through text-gray-400" : "text-gray-700"}`}>
                                      {task.title}
                                    </p>
                                    {task.description && (
                                      <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>
                                    )}
                                    {task.content && (
                                      <p className="text-xs text-blue-600 mt-0.5 truncate">{task.content}</p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <div className="flex items-center gap-1 text-xs text-gray-400">
                                      <Icon className="w-3.5 h-3.5" />
                                      <span>{task.type}</span>
                                    </div>
                                    {task.dueInDays && (
                                      <div className="flex items-center gap-1 text-xs text-gray-400">
                                        <Clock className="w-3 h-3" />
                                        <span>{task.dueInDays}d</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
