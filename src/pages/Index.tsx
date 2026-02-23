import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import LeadForm from "@/components/LeadForm";
import LeadTable from "@/components/LeadTable";
import KpiCards from "@/components/KpiCards";
import SummaryDashboard from "@/components/SummaryDashboard";
import UserApprovalPanel from "@/components/UserApprovalPanel";
import ActivityLogPanel from "@/components/ActivityLogPanel";
import CsvImport from "@/components/CsvImport";
import ExportReport from "@/components/ExportReport";
import NotificationBell from "@/components/NotificationBell";
import { logActivity } from "@/lib/activity-logger";
import type { NewPlacement, Replacement } from "@/types/leads";
import { LogOut, ShieldAlert, LayoutDashboard, ClipboardList, RefreshCcw, Users, Activity } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [approved, setApproved] = useState<boolean | null>(null);
  const [placements, setPlacements] = useState<NewPlacement[]>([]);
  const [replacements, setReplacements] = useState<Replacement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
      else {
        fetchRoleAndApproval(session.user.id);
        if (_event === "SIGNED_IN") {
          logActivity({ action: "login", entityType: "auth" });
        }
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
      else fetchRoleAndApproval(session.user.id);
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchRoleAndApproval = async (userId: string) => {
    const { data } = await supabase.from("user_roles").select("role, approved").eq("user_id", userId).maybeSingle();
    if (data) {
      setUserRole(data.role || "staff");
      setApproved(data.approved ?? false);
    } else {
      setUserRole("staff");
      setApproved(false);
    }
  };

  useEffect(() => {
    if (user && approved) {
      fetchPlacements();
      fetchReplacements();
    }
  }, [user, approved]);

  const fetchPlacements = async () => {
    const { data, error } = await supabase.from("new_placements").select("*").order("created_at", { ascending: false });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setPlacements((data as any[]) || []);
  };

  const fetchReplacements = async () => {
    const { data, error } = await supabase.from("replacements").select("*").order("created_at", { ascending: false });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setReplacements((data as any[]) || []);
  };

  const addPlacement = async (formData: any) => {
    setLoading(true);
    const { error } = await supabase.from("new_placements").insert({ ...formData, created_by: user.id });
    setLoading(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Success", description: "New placement lead added successfully" });
    await logActivity({ action: "create", entityType: "new_placements", details: formData });
    fetchPlacements();
  };

  const addReplacement = async (formData: any) => {
    setLoading(true);
    const { error } = await supabase.from("replacements").insert({ ...formData, created_by: user.id });
    setLoading(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Success", description: "Replacement lead added successfully" });
    await logActivity({ action: "create", entityType: "replacements", details: formData });
    fetchReplacements();
  };

  const updatePlacement = async (id: string, field: string, value: string) => {
    const { error } = await supabase.from("new_placements").update({ [field]: value }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Updated", description: `${field.replace("_", " ")} updated successfully` });
    await logActivity({ action: "update", entityType: "new_placements", entityId: id, details: { field, value } });
    fetchPlacements();
  };

  const updateReplacement = async (id: string, field: string, value: string) => {
    const { error } = await supabase.from("replacements").update({ [field]: value }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Updated", description: `${field.replace("_", " ")} updated successfully` });
    await logActivity({ action: "update", entityType: "replacements", entityId: id, details: { field, value } });
    fetchReplacements();
  };

  const savePlacementComment = async (id: string, comment: string) => {
    const { error } = await supabase.from("new_placements").update({ comments: comment }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Saved", description: "Comment saved successfully" });
    await logActivity({ action: "update", entityType: "new_placements", entityId: id, details: { field: "comments", value: comment } });
    fetchPlacements();
  };

  const saveReplacementComment = async (id: string, comment: string) => {
    const { error } = await supabase.from("replacements").update({ comments: comment }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Saved", description: "Comment saved successfully" });
    await logActivity({ action: "update", entityType: "replacements", entityId: id, details: { field: "comments", value: comment } });
    fetchReplacements();
  };

  const handleLogout = async () => {
    await logActivity({ action: "logout", entityType: "auth" });
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!user) return null;

  if (approved === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm rounded-xl border bg-card p-8 shadow-lg text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/15">
            <ShieldAlert className="h-7 w-7 text-orange-600" />
          </div>
          <h1 className="text-lg font-bold text-card-foreground mb-1">Approval Pending</h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            Your account is awaiting admin approval. Please contact <strong className="text-foreground">suraj@ezyhelpers.com</strong> to get approved.
          </p>
          <Button variant="outline" onClick={handleLogout} className="gap-2 w-full rounded-lg">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>
    );
  }

  if (approved === null) return null;

  const roleLabel = userRole === "field_officer" ? "Field Officer" : userRole.charAt(0).toUpperCase() + userRole.slice(1);
  const isAdmin = userRole === "admin";
  const isFieldOfficer = userRole === "field_officer";

  return (
    <div className="min-h-screen bg-background">
      <header className="glass-header sticky top-0 z-30 px-3 py-2 sm:px-4 sm:py-2.5">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs sm:text-sm">
              E
            </div>
            <h1 className="text-sm font-bold text-foreground hidden sm:block">EzyHelpers Ops</h1>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            <ExportReport placements={placements} replacements={replacements} />
            <NotificationBell />
            <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0.5 rounded-full">{roleLabel}</Badge>
            <span className="text-[11px] text-muted-foreground hidden md:inline truncate max-w-[160px]">{user.email}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1 text-xs h-7 sm:h-8 rounded-lg px-2">
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-3 sm:px-4 sm:py-5">
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-4 sm:mb-5 h-9 sm:h-10 bg-card border border-border/40 shadow-sm rounded-xl p-0.5 sm:p-1 w-full sm:w-auto">
            <TabsTrigger value="dashboard" className="gap-1 rounded-lg text-[11px] sm:text-xs data-[state=active]:shadow-sm px-2.5 sm:px-3">
              <LayoutDashboard className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="placements" className="gap-1 rounded-lg text-[11px] sm:text-xs data-[state=active]:shadow-sm px-2.5 sm:px-3">
              <ClipboardList className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Placements</span>
            </TabsTrigger>
            <TabsTrigger value="replacements" className="gap-1 rounded-lg text-[11px] sm:text-xs data-[state=active]:shadow-sm px-2.5 sm:px-3">
              <RefreshCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Replacements</span>
            </TabsTrigger>
            {isAdmin && (
              <>
                <TabsTrigger value="users" className="gap-1 rounded-lg text-[11px] sm:text-xs data-[state=active]:shadow-sm px-2.5 sm:px-3">
                  <Users className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Users</span>
                </TabsTrigger>
                <TabsTrigger value="logs" className="gap-1 rounded-lg text-[11px] sm:text-xs data-[state=active]:shadow-sm px-2.5 sm:px-3">
                  <Activity className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Logs</span>
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="dashboard">
            <SummaryDashboard placements={placements} replacements={replacements} />
          </TabsContent>

          <TabsContent value="placements">
            <KpiCards data={placements} label="Placements" />
            {!isFieldOfficer && (
              <div className="flex items-center justify-between mb-3">
                <LeadForm onSubmit={addPlacement} loading={loading} />
                <CsvImport userId={user.id} onSuccess={fetchPlacements} />
              </div>
            )}
            <LeadTable data={placements} onUpdate={updatePlacement} onCommentSave={savePlacementComment} userRole={userRole} />
          </TabsContent>

          <TabsContent value="replacements">
            <KpiCards data={replacements} label="Replacements" />
            {!isFieldOfficer && (
              <LeadForm isReplacement onSubmit={addReplacement} loading={loading} />
            )}
            <LeadTable data={replacements} isReplacement onUpdate={updateReplacement} onCommentSave={saveReplacementComment} userRole={userRole} />
          </TabsContent>

          {isAdmin && (
            <>
              <TabsContent value="users">
                <h2 className="text-lg font-bold mb-4">User Approval & Role Management</h2>
                <UserApprovalPanel />
              </TabsContent>
              <TabsContent value="logs">
                <h2 className="text-lg font-bold mb-4">Activity Logs</h2>
                <ActivityLogPanel />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
