import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Megaphone, Plus } from "lucide-react";

async function getAnnouncements() {
  return db.announcement.findMany({
    orderBy: { createdAt: "desc" },
  });
}

type PriorityVariant = "destructive" | "default" | "secondary";

const priorityVariant: Record<string, PriorityVariant> = {
  HIGH: "destructive",
  NORMAL: "default",
  LOW: "secondary",
};

const priorityLabel: Record<string, string> = {
  HIGH: "High Priority",
  NORMAL: "Normal",
  LOW: "Low Priority",
};

export default async function AnnouncementsPage() {
  const announcements = await getAnnouncements();

  const stats = [
    { label: "Total", value: announcements.length, color: "text-blue-600" },
    { label: "High Priority", value: announcements.filter((a) => a.priority === "HIGH").length, color: "text-red-600" },
    { label: "Normal", value: announcements.filter((a) => a.priority === "NORMAL").length, color: "text-green-600" },
    { label: "Low Priority", value: announcements.filter((a) => a.priority === "LOW").length, color: "text-gray-600" },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Announcements</h1>
          <p className="text-gray-500 mt-1">Company-wide and role-specific announcements</p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      {/* Stats */}
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

      {/* Announcements List */}
      {announcements.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center text-gray-400">
            <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No announcements yet</p>
            <p className="text-sm mt-1">Create your first announcement to notify your team</p>
            <Button className="mt-4" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Create Announcement
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={priorityVariant[announcement.priority] ?? "secondary"} className="text-xs">
                        {priorityLabel[announcement.priority] ?? announcement.priority}
                      </Badge>
                      {announcement.targetRole && (
                        <Badge variant="secondary" className="text-xs">
                          {announcement.targetRole}
                        </Badge>
                      )}
                      {!announcement.targetRole && (
                        <Badge variant="secondary" className="text-xs">
                          All Employees
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-base mb-1">{announcement.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{announcement.content}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="text-xs text-gray-400">{formatDate(announcement.createdAt)}</div>
                    <div className="text-xs text-gray-500 mt-0.5">by {announcement.createdBy}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
