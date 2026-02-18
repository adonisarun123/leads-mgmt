import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, LogIn, LogOut, Edit, Plus, Trash2, ShieldCheck, ShieldOff, UserCog } from "lucide-react";

interface ActivityLog {
  id: string;
  user_id: string;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

const ACTION_ICONS: Record<string, typeof Activity> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  login: LogIn,
  logout: LogOut,
  approve_user: ShieldCheck,
  revoke_user: ShieldOff,
  change_role: UserCog,
};

const ACTION_COLORS: Record<string, string> = {
  create: "bg-success/15 text-success",
  update: "bg-primary/15 text-primary",
  delete: "bg-destructive/15 text-destructive",
  login: "bg-info/15 text-info",
  logout: "bg-muted text-muted-foreground",
  approve_user: "bg-success/15 text-success",
  revoke_user: "bg-destructive/15 text-destructive",
  change_role: "bg-warning/15 text-warning",
};

const ALL = "__all__";

const ActivityLogPanel = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState(ALL);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    setLogs((data as ActivityLog[]) ?? []);
    setLoading(false);
  };

  const filtered = filterAction === ALL ? logs : logs.filter((l) => l.action === filterAction);

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Activity className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground">Filter:</span>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="h-8 w-36 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="login">Login</SelectItem>
            <SelectItem value="logout">Logout</SelectItem>
            <SelectItem value="approve_user">Approve</SelectItem>
            <SelectItem value="revoke_user">Revoke</SelectItem>
            <SelectItem value="change_role">Role Change</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="text-xs ml-auto">{filtered.length} entries</Badge>
      </div>

      <ScrollArea className="h-[500px] rounded-lg border bg-card">
        <div className="divide-y divide-border">
          {filtered.length === 0 && (
            <p className="text-center text-sm text-muted-foreground py-8">No activity logs found.</p>
          )}
          {filtered.map((log) => {
            const Icon = ACTION_ICONS[log.action] ?? Activity;
            const colorClass = ACTION_COLORS[log.action] ?? "bg-muted text-muted-foreground";
            return (
              <div key={log.id} className="flex items-start gap-3 px-3 py-2.5 hover:bg-muted/30 transition-colors">
                <div className={`mt-0.5 inline-flex items-center justify-center rounded-lg p-1.5 ${colorClass}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-foreground">
                    <span className="capitalize">{log.action.replace("_", " ")}</span>
                    {" · "}
                    <span className="text-muted-foreground">{log.entity_type.replace("_", " ")}</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {log.user_email ?? log.user_id.slice(0, 8)}
                    {log.details && Object.keys(log.details).length > 0 && (
                      <> — {JSON.stringify(log.details).slice(0, 80)}</>
                    )}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {format(new Date(log.created_at), "dd MMM HH:mm")}
                </span>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ActivityLogPanel;
