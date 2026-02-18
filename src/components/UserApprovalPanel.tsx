import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Check, X } from "lucide-react";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  approved: boolean;
}

const UserApprovalPanel = () => {
  const [users, setUsers] = useState<(UserRole & { email?: string })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("user_roles").select("*");
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }
    setUsers((data as UserRole[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (id: string) => {
    const { error } = await supabase.from("user_roles").update({ approved: true }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Approved", description: "User has been approved." });
    fetchUsers();
  };

  const handleRevoke = async (id: string) => {
    const { error } = await supabase.from("user_roles").update({ approved: false }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Revoked", description: "User access has been revoked." });
    fetchUsers();
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    const { error } = await supabase.from("user_roles").update({ role: newRole as "admin" | "manager" | "staff" }).eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Updated", description: `Role changed to ${newRole}.` });
    fetchUsers();
  };

  if (loading) return <p className="text-sm text-muted-foreground py-4">Loading users...</p>;

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User ID</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No users found.</TableCell>
            </TableRow>
          )}
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="text-xs font-mono truncate max-w-[200px]">{u.user_id}</TableCell>
              <TableCell>
                <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v)}>
                  <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Badge variant={u.approved ? "default" : "secondary"}>
                  {u.approved ? "Approved" : "Pending"}
                </Badge>
              </TableCell>
              <TableCell>
                {u.approved ? (
                  <Button variant="outline" size="sm" onClick={() => handleRevoke(u.id)} className="gap-1 text-destructive">
                    <X className="h-3 w-3" /> Revoke
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => handleApprove(u.id)} className="gap-1">
                    <Check className="h-3 w-3" /> Approve
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default UserApprovalPanel;
