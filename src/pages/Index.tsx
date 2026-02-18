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
import type { NewPlacement, Replacement } from "@/types/leads";
import { LogOut, ShieldAlert, LayoutDashboard } from "lucide-react";

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
      else fetchRoleAndApproval(session.user.id);
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
    fetchPlacements();
  };

  const addReplacement = async (formData: any) => {
    setLoading(true);
    const { error } = await supabase.from("replacements").insert({ ...formData, created_by: user.id });
    setLoading(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Success", description: "Replacement lead added successfully" });
    fetchReplacements();
  };

  const updatePlacement = async (id: string, field: string, value: string) => {
    const { error } = await supabase.from("new_placements").update({ [field]: value }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Updated", description: `${field.replace("_", " ")} updated successfully` });
    fetchPlacements();
  };

  const updateReplacement = async (id: string, field: string, value: string) => {
    const { error } = await supabase.from("replacements").update({ [field]: value }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Updated", description: `${field.replace("_", " ")} updated successfully` });
    fetchReplacements();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (!user) return null;

  // Pending approval screen
  if (approved === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm text-center">
          <ShieldAlert className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
          <h1 className="text-lg font-semibold text-card-foreground mb-1">Approval Pending</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Your account is awaiting admin approval. Please contact <strong>suraj@ezyhelpers.com</strong> to get approved.
          </p>
          <Button variant="outline" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>
    );
  }

  if (approved === null) return null; // still loading

  const roleLabel = userRole.charAt(0).toUpperCase() + userRole.slice(1);
  const isAdmin = userRole === "admin";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card px-4 py-3 shadow-sm">
        <h1 className="text-lg font-bold text-foreground">EzyHelpers Ops</h1>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-xs">{roleLabel}</Badge>
          <span className="text-xs text-muted-foreground">{user.email}</span>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-4">
            <TabsTrigger value="dashboard" className="gap-1"><LayoutDashboard className="h-3.5 w-3.5" /> Dashboard</TabsTrigger>
            <TabsTrigger value="placements">New Placements</TabsTrigger>
            <TabsTrigger value="replacements">Replacements</TabsTrigger>
            {isAdmin && <TabsTrigger value="users">User Management</TabsTrigger>}
          </TabsList>

          <TabsContent value="dashboard">
            <SummaryDashboard placements={placements} replacements={replacements} />
          </TabsContent>

          <TabsContent value="placements">
            <KpiCards data={placements} label="Placements" />
            <LeadForm onSubmit={addPlacement} loading={loading} />
            <LeadTable data={placements} onUpdate={updatePlacement} userRole={userRole} />
          </TabsContent>

          <TabsContent value="replacements">
            <KpiCards data={replacements} label="Replacements" />
            <LeadForm isReplacement onSubmit={addReplacement} loading={loading} />
            <LeadTable data={replacements} isReplacement onUpdate={updateReplacement} userRole={userRole} />
          </TabsContent>

          {isAdmin && (
            <TabsContent value="users">
              <h2 className="text-lg font-semibold mb-3">User Approval & Role Management</h2>
              <UserApprovalPanel />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
