"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BookOpen, Plus, Users, ChevronDown, ChevronRight, Trash2,
  CheckCircle2, Circle, GraduationCap, ListTodo, TrendingUp,
  ClipboardList, X, UserPlus,
} from "lucide-react";
import { nameInitials } from "@/lib/utils";

type Task = {
  id: string; title: string; description?: string | null;
  type: string; content?: string | null; dueInDays?: number | null; order: number;
};
type Module = { id: string; title: string; description?: string | null; order: number; tasks: Task[] };
type Enrollment = {
  id: string; employeeId: string; status: string; enrolledAt: string; completedAt?: string | null;
  employee: { id: string; firstName: string; lastName: string; employeeCode: string };
};
type Course = {
  id: string; title: string; description?: string | null; category: string; status: string;
  createdAt: string; modules: Module[]; enrollments: Enrollment[];
};
type Intern = { id: string; firstName: string; lastName: string; employeeCode: string; designation?: string | null };

const CATEGORIES = ["GENERAL", "TECHNICAL", "SOFT_SKILLS", "COMPLIANCE", "ONBOARDING"];
const TASK_TYPES = ["READING", "VIDEO", "TASK", "ASSIGNMENT"];
const catColors: Record<string, string> = {
  TECHNICAL: "bg-blue-100 text-blue-700",
  SOFT_SKILLS: "bg-purple-100 text-purple-700",
  COMPLIANCE: "bg-red-100 text-red-700",
  ONBOARDING: "bg-green-100 text-green-700",
  GENERAL: "bg-gray-100 text-gray-700",
};

export default function LmsManager({ courses: init, interns }: { courses: Course[]; interns: Intern[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [courses, setCourses] = useState<Course[]>(init);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  // ── Create Course ────────────────────────────────────────────────────────
  const [showCreateCourse, setShowCreateCourse] = useState(false);
  const [newCourse, setNewCourse] = useState({ title: "", description: "", category: "GENERAL" });
  const [saving, setSaving] = useState(false);

  async function createCourse() {
    if (!newCourse.title.trim()) return;
    setSaving(true);
    const res = await fetch("/api/lms/courses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newCourse),
    });
    if (res.ok) {
      const created = await res.json();
      setCourses((p) => [{ ...created, modules: [], enrollments: [] }, ...p]);
      setShowCreateCourse(false);
      setNewCourse({ title: "", description: "", category: "GENERAL" });
    }
    setSaving(false);
  }

  // ── Add Module ───────────────────────────────────────────────────────────
  const [showAddModule, setShowAddModule] = useState<string | null>(null);
  const [newModule, setNewModule] = useState({ title: "", description: "" });
  const [newTasks, setNewTasks] = useState<{ title: string; type: string; description: string; content: string }[]>([
    { title: "", type: "READING", description: "", content: "" },
  ]);

  async function addModule(courseId: string) {
    if (!newModule.title.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/lms/courses/${courseId}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newModule, tasks: newTasks.filter((t) => t.title.trim()) }),
    });
    if (res.ok) {
      const mod = await res.json();
      setCourses((p) =>
        p.map((c) => c.id === courseId ? { ...c, modules: [...c.modules, mod] } : c)
      );
      setShowAddModule(null);
      setNewModule({ title: "", description: "" });
      setNewTasks([{ title: "", type: "READING", description: "", content: "" }]);
    }
    setSaving(false);
  }

  // ── Enroll ───────────────────────────────────────────────────────────────
  const [enrollDialog, setEnrollDialog] = useState<string | null>(null);
  const [selectedInterns, setSelectedInterns] = useState<string[]>([]);

  async function enrollInterns(courseId: string) {
    if (!selectedInterns.length) return;
    setSaving(true);
    const res = await fetch("/api/lms/enroll", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, employeeIds: selectedInterns }),
    });
    if (res.ok) {
      setEnrollDialog(null);
      setSelectedInterns([]);
      // Refresh server component data so both manager and employee views are up-to-date
      router.refresh();
    }
    setSaving(false);
  }

  async function removeEnrollment(courseId: string, employeeId: string) {
    await fetch("/api/lms/enroll", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, employeeId }),
    });
    setCourses((p) =>
      p.map((c) =>
        c.id === courseId
          ? { ...c, enrollments: c.enrollments.filter((e) => e.employeeId !== employeeId) }
          : c
      )
    );
  }

  // ── Stats ────────────────────────────────────────────────────────────────
  const totalCourses = courses.length;
  const totalEnrollments = courses.reduce((s, c) => s + c.enrollments.length, 0);
  const completedEnrollments = courses.reduce(
    (s, c) => s + c.enrollments.filter((e) => e.status === "COMPLETED").length, 0
  );
  const totalTasks = courses.reduce(
    (s, c) => s + c.modules.reduce((ms, m) => ms + m.tasks.length, 0), 0
  );

  // ── Progress tracker view ─────────────────────────────────────────────
  const internProgress = interns
    .map((intern) => {
      const enrolled = courses.flatMap((c) =>
        c.enrollments
          .filter((e) => e.employeeId === intern.id)
          .map((e) => ({ course: c, enrollment: e }))
      );
      return { intern, enrolled };
    })
    .filter((r) => r.enrolled.length > 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Learning Management</h1>
          <p className="text-gray-500 mt-1">Create courses, assign to interns, and track progress</p>
        </div>
        <Button onClick={() => setShowCreateCourse(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Course
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Courses", value: totalCourses, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Enrollments", value: totalEnrollments, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Completed", value: completedEnrollments, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Tasks", value: totalTasks, icon: ListTodo, color: "text-orange-600", bg: "bg-orange-50" },
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

      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses"><BookOpen className="w-4 h-4 mr-2" />Courses</TabsTrigger>
          <TabsTrigger value="progress"><TrendingUp className="w-4 h-4 mr-2" />Intern Progress</TabsTrigger>
        </TabsList>

        {/* ── COURSES TAB ── */}
        <TabsContent value="courses" className="space-y-4">
          {courses.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="py-16 text-center">
                <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-500">No courses yet</p>
                <p className="text-sm text-gray-400 mt-1">Create your first course to get started</p>
                <Button className="mt-4 gap-2" onClick={() => setShowCreateCourse(true)}>
                  <Plus className="w-4 h-4" /> New Course
                </Button>
              </CardContent>
            </Card>
          ) : (
            courses.map((course) => {
              const isExpanded = expandedCourse === course.id;
              const totalCourseTasks = course.modules.reduce((s, m) => s + m.tasks.length, 0);

              return (
                <Card key={course.id} className="border-0 shadow-sm overflow-hidden">
                  <div
                    className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedCourse(isExpanded ? null : course.id)}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-gray-900">{course.title}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${catColors[course.category] ?? catColors.GENERAL}`}>
                            {course.category.replace("_", " ")}
                          </span>
                        </div>
                        {course.description && (
                          <p className="text-sm text-gray-500 mt-0.5 truncate">{course.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400">{course.modules.length} modules · {totalCourseTasks} tasks</span>
                          <span className="text-xs text-gray-400">{course.enrollments.length} enrolled</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={(e) => { e.stopPropagation(); setEnrollDialog(course.id); setSelectedInterns([]); }}
                      >
                        <UserPlus className="w-3.5 h-3.5" /> Assign
                      </Button>
                      {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronRight className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50">
                      {/* Enrolled interns */}
                      {course.enrollments.length > 0 && (
                        <div className="px-5 py-3 border-b border-gray-100">
                          <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Assigned Interns</p>
                          <div className="flex flex-wrap gap-2">
                            {course.enrollments.map((e) => (
                              <div key={e.id} className="flex items-center gap-1.5 bg-white rounded-full px-3 py-1 border text-sm">
                                <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold">
                                  {nameInitials(e.employee.firstName, e.employee.lastName)}
                                </div>
                                <span className="text-gray-700">{e.employee.firstName} {e.employee.lastName}</span>
                                <button
                                  onClick={() => removeEnrollment(course.id, e.employeeId)}
                                  className="text-gray-400 hover:text-red-500 ml-1"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Modules */}
                      <div className="p-5 space-y-3">
                        {course.modules.length === 0 && (
                          <p className="text-sm text-gray-400 text-center py-4">No modules yet. Add your first module below.</p>
                        )}
                        {course.modules.map((mod, mi) => (
                          <div key={mod.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="flex items-center gap-3 px-4 py-3 bg-white">
                              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-bold shrink-0">
                                {mi + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-800 text-sm">{mod.title}</p>
                                {mod.description && <p className="text-xs text-gray-500">{mod.description}</p>}
                              </div>
                              <span className="text-xs text-gray-400 shrink-0">{mod.tasks.length} tasks</span>
                            </div>
                            {mod.tasks.length > 0 && (
                              <div className="border-t border-gray-100">
                                {mod.tasks.map((task, ti) => (
                                  <div key={task.id} className="flex items-start gap-3 px-4 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                                    <span className="text-xs text-gray-400 w-5 text-right shrink-0 mt-0.5">{ti + 1}.</span>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-gray-700">{task.title}</p>
                                      {task.description && <p className="text-xs text-gray-400 mt-0.5">{task.description}</p>}
                                    </div>
                                    <Badge variant="secondary" className="text-xs shrink-0">{task.type}</Badge>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs w-full"
                          onClick={() => { setShowAddModule(course.id); setNewModule({ title: "", description: "" }); setNewTasks([{ title: "", type: "READING", description: "", content: "" }]); }}
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Module
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* ── PROGRESS TAB ── */}
        <TabsContent value="progress">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-blue-600" /> Intern Learning Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              {internProgress.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No interns enrolled yet</p>
                  <p className="text-sm mt-1">Assign courses to interns to track progress here</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {internProgress.map(({ intern, enrolled }) => (
                    <div key={intern.id} className="p-4 rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {nameInitials(intern.firstName, intern.lastName)}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{intern.firstName} {intern.lastName}</p>
                          <p className="text-xs text-gray-400">{intern.employeeCode}{intern.designation ? ` · ${intern.designation}` : ""}</p>
                        </div>
                        <div className="ml-auto">
                          <Badge variant={enrolled.every((e) => e.enrollment.status === "COMPLETED") ? "success" : "warning"} className="text-xs">
                            {enrolled.filter((e) => e.enrollment.status === "COMPLETED").length}/{enrolled.length} done
                          </Badge>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {enrolled.map(({ course, enrollment }) => {
                          const totalT = course.modules.reduce((s, m) => s + m.tasks.length, 0);
                          return (
                            <div key={course.id} className="flex items-center gap-3">
                              <span className="text-sm text-gray-600 flex-1 truncate">{course.title}</span>
                              <Badge
                                variant={enrollment.status === "COMPLETED" ? "success" : "secondary"}
                                className="text-xs shrink-0"
                              >
                                {enrollment.status === "COMPLETED" ? "Done" : "In Progress"}
                              </Badge>
                              <span className="text-xs text-gray-400 shrink-0 w-14 text-right">{totalT} tasks</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── Create Course Modal ── */}
      <Dialog open={showCreateCourse} onOpenChange={setShowCreateCourse}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>New Learning Course</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="ct">Course Title *</Label>
              <Input id="ct" className="mt-1" placeholder="e.g. Onboarding Essentials" value={newCourse.title} onChange={(e) => setNewCourse((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="cd">Description</Label>
              <Input id="cd" className="mt-1" placeholder="Brief description" value={newCourse.description} onChange={(e) => setNewCourse((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <Label>Category</Label>
              <Select value={newCourse.category} onValueChange={(v) => setNewCourse((p) => ({ ...p, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateCourse(false)}>Cancel</Button>
            <Button onClick={createCourse} disabled={saving || !newCourse.title.trim()}>
              {saving ? "Creating..." : "Create Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Module Modal ── */}
      <Dialog open={!!showAddModule} onOpenChange={(o) => !o && setShowAddModule(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Module</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Module Title *</Label>
              <Input className="mt-1" placeholder="e.g. Week 1: Introduction" value={newModule.title} onChange={(e) => setNewModule((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div>
              <Label>Description</Label>
              <Input className="mt-1" placeholder="What will learners cover?" value={newModule.description} onChange={(e) => setNewModule((p) => ({ ...p, description: e.target.value }))} />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Tasks</Label>
                <Button size="sm" variant="ghost" className="text-xs h-7 gap-1" onClick={() => setNewTasks((p) => [...p, { title: "", type: "READING", description: "", content: "" }])}>
                  <Plus className="w-3 h-3" /> Add Task
                </Button>
              </div>
              <div className="space-y-3">
                {newTasks.map((task, i) => (
                  <div key={i} className="flex gap-2 items-start bg-gray-50 rounded-lg p-3">
                    <div className="flex-1 space-y-2 min-w-0">
                      <Input placeholder={`Task ${i + 1} title`} className="text-sm" value={task.title} onChange={(e) => setNewTasks((p) => p.map((t, ti) => ti === i ? { ...t, title: e.target.value } : t))} />
                      <div className="flex gap-2">
                        <Select value={task.type} onValueChange={(v) => setNewTasks((p) => p.map((t, ti) => ti === i ? { ...t, type: v } : t))}>
                          <SelectTrigger className="text-xs h-8 w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>{TASK_TYPES.map((t) => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}</SelectContent>
                        </Select>
                        <Input placeholder="Description (optional)" className="text-xs h-8 flex-1" value={task.description} onChange={(e) => setNewTasks((p) => p.map((t, ti) => ti === i ? { ...t, description: e.target.value } : t))} />
                      </div>
                      <Input placeholder="Content / URL / Instructions (optional)" className="text-xs h-8" value={task.content} onChange={(e) => setNewTasks((p) => p.map((t, ti) => ti === i ? { ...t, content: e.target.value } : t))} />
                    </div>
                    {newTasks.length > 1 && (
                      <button onClick={() => setNewTasks((p) => p.filter((_, ti) => ti !== i))} className="text-gray-400 hover:text-red-500 mt-1 shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModule(null)}>Cancel</Button>
            <Button onClick={() => addModule(showAddModule!)} disabled={saving || !newModule.title.trim()}>
              {saving ? "Adding..." : "Add Module"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Enroll Modal ── */}
      <Dialog open={!!enrollDialog} onOpenChange={(o) => !o && setEnrollDialog(null)}>
        <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader><DialogTitle>Assign Interns to Course</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-y-auto py-2">
            {interns.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No interns found in the system.</p>
            ) : (
              <div className="space-y-2">
                {interns.map((intern) => {
                  const alreadyEnrolled = courses
                    .find((c) => c.id === enrollDialog)
                    ?.enrollments.some((e) => e.employeeId === intern.id);
                  const isSelected = selectedInterns.includes(intern.id);
                  return (
                    <button
                      key={intern.id}
                      onClick={() => !alreadyEnrolled && setSelectedInterns((p) =>
                        p.includes(intern.id) ? p.filter((id) => id !== intern.id) : [...p, intern.id]
                      )}
                      disabled={alreadyEnrolled}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${
                        alreadyEnrolled ? "opacity-50 cursor-not-allowed bg-gray-50" :
                        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {nameInitials(intern.firstName, intern.lastName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">{intern.firstName} {intern.lastName}</p>
                        <p className="text-xs text-gray-400">{intern.employeeCode}{intern.designation ? ` · ${intern.designation}` : ""}</p>
                      </div>
                      {alreadyEnrolled ? (
                        <Badge variant="secondary" className="text-xs shrink-0">Enrolled</Badge>
                      ) : isSelected ? (
                        <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-gray-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter className="border-t pt-4 mt-2">
            <Button variant="outline" onClick={() => setEnrollDialog(null)}>Cancel</Button>
            <Button onClick={() => enrollInterns(enrollDialog!)} disabled={saving || !selectedInterns.length}>
              {saving ? "Enrolling..." : `Enroll ${selectedInterns.length || ""} Intern${selectedInterns.length !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
