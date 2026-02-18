import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import LeadForm from "@/components/LeadForm";
import LeadTable from "@/components/LeadTable";
import type { NewPlacement, Replacement } from "@/types/leads";
import { LogOut } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [placements, setPlacements] = useState<NewPlacement[]>([]);
  const [replacements, setReplacements] = useState<Replacement[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) navigate("/auth");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchPlacements();
      fetchReplacements();
    }
  }, [user]);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-card px-4 py-3 shadow-sm">
        <h1 className="text-lg font-bold text-foreground">EzyHelpers Ops</h1>
        <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-2">
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </header>

      <main className="mx-auto max-w-7xl p-4">
        <Tabs defaultValue="placements">
          <TabsList className="mb-4">
            <TabsTrigger value="placements">New Placements</TabsTrigger>
            <TabsTrigger value="replacements">Replacements</TabsTrigger>
          </TabsList>

          <TabsContent value="placements">
            <LeadForm onSubmit={addPlacement} loading={loading} />
            <LeadTable data={placements} onUpdate={updatePlacement} />
          </TabsContent>

          <TabsContent value="replacements">
            <LeadForm isReplacement onSubmit={addReplacement} loading={loading} />
            <LeadTable data={replacements} isReplacement onUpdate={updateReplacement} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
