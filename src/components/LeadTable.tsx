import { useState } from "react";
import { format, differenceInDays } from "date-fns";
import { Download } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PriorityBadge from "./PriorityBadge";
import AgeBadge from "./AgeBadge";
import ConfirmDialog from "./ConfirmDialog";
import { PRIORITIES, STATUSES, SALES_PERSONS } from "@/types/leads";
import type { NewPlacement, Replacement, LeadPriority } from "@/types/leads";

interface LeadTableProps {
  data: (NewPlacement | Replacement)[];
  isReplacement?: boolean;
  onUpdate: (id: string, field: string, value: string) => void;
  userRole?: string;
}

const LeadTable = ({ data, isReplacement = false, onUpdate, userRole }: LeadTableProps) => {
  const [confirm, setConfirm] = useState<{ id: string; field: string; value: string; label: string } | null>(null);
  const [editingAssign, setEditingAssign] = useState<{ id: string; value: string } | null>(null);

  const canEdit = userRole === "admin" || userRole === "manager";

  const handleInlineChange = (id: string, field: string, value: string, label: string) => {
    setConfirm({ id, field, value, label });
  };

  const exportCSV = () => {
    if (data.length === 0) return;
    const headers = [
      "Lead-in Date",
      ...(isReplacement ? ["Age (days)"] : ["Age (days)"]),
      "Area", "Apartment", "Job Type", "Tasks", "Language", "Salary",
      "Priority", "Status", "Sales Person",
      ...(isReplacement ? ["Assign To"] : []),
    ];
    const rows = data.map((row) => [
      format(new Date(row.lead_in_date), "dd/MM/yyyy"),
      String(differenceInDays(new Date(), new Date(row.lead_in_date))),
      row.area, row.apartment, row.job_type,
      row.tasks.join("; "), row.language.join("; "), row.salary,
      row.lead_priority, row.lead_status, row.sales_person,
      ...(isReplacement ? [(row as Replacement).assign_to] : []),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${isReplacement ? "replacements" : "new_placements"}_${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="mb-2 flex justify-end">
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={data.length === 0} className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>
      <div className="rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 bg-muted">
            <TableRow>
              <TableHead>Lead-in Date</TableHead>
              <TableHead>Age</TableHead>
              {isReplacement && <TableHead>Assign To</TableHead>}
              <TableHead>Area</TableHead>
              <TableHead>Apartment</TableHead>
              <TableHead>Job Type</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sales Person</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={isReplacement ? 12 : 11} className="text-center text-muted-foreground py-8">
                  No leads yet. Add one above.
                </TableCell>
              </TableRow>
            )}
            {data.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/50">
                <TableCell className="whitespace-nowrap">{format(new Date(row.lead_in_date), "dd/MM/yyyy")}</TableCell>
                <TableCell><AgeBadge leadInDate={row.lead_in_date} /></TableCell>
                {isReplacement && (
                  <TableCell>
                    {canEdit ? (
                      editingAssign?.id === row.id ? (
                        <Input
                          className="h-8 w-28 text-xs"
                          value={editingAssign.value}
                          onChange={(e) => setEditingAssign({ id: row.id, value: e.target.value })}
                          onBlur={() => {
                            if (editingAssign.value !== (row as Replacement).assign_to) {
                              handleInlineChange(row.id, "assign_to", editingAssign.value, `Confirm assignment to "${editingAssign.value}"?`);
                            }
                            setEditingAssign(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                            if (e.key === "Escape") setEditingAssign(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <span
                          className="cursor-pointer rounded px-1 py-0.5 text-xs hover:bg-accent"
                          onClick={() => setEditingAssign({ id: row.id, value: (row as Replacement).assign_to })}
                        >
                          {(row as Replacement).assign_to}
                        </span>
                      )
                    ) : (
                      <span className="text-xs">{(row as Replacement).assign_to}</span>
                    )}
                  </TableCell>
                )}
                <TableCell>{row.area}</TableCell>
                <TableCell>{row.apartment}</TableCell>
                <TableCell>{row.job_type}</TableCell>
                <TableCell>{row.tasks.join(", ")}</TableCell>
                <TableCell>{row.language.join(", ")}</TableCell>
                <TableCell>{row.salary}</TableCell>
                <TableCell>
                  {canEdit ? (
                    <Select
                      value={row.lead_priority}
                      onValueChange={(v) => handleInlineChange(row.id, "lead_priority", v, `Confirm lead priority as "${v}"?`)}
                    >
                      <SelectTrigger className="h-8 w-24 border-none p-0">
                        <PriorityBadge priority={row.lead_priority as LeadPriority} />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <PriorityBadge priority={row.lead_priority as LeadPriority} />
                  )}
                </TableCell>
                <TableCell>
                  {canEdit ? (
                    <Select
                      value={row.lead_status}
                      onValueChange={(v) => handleInlineChange(row.id, "lead_status", v, `Are you sure you want to mark this lead as "${v}"?`)}
                    >
                      <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-xs">{row.lead_status}</span>
                  )}
                </TableCell>
                <TableCell>
                  {canEdit ? (
                    <Select
                      value={row.sales_person}
                      onValueChange={(v) => handleInlineChange(row.id, "sales_person", v, `Confirm assignment to "${v}"?`)}
                    >
                      <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SALES_PERSONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-xs">{row.sales_person}</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!confirm}
        title="Confirm Change"
        description={confirm?.label || ""}
        onConfirm={() => {
          if (confirm) onUpdate(confirm.id, confirm.field, confirm.value);
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
};

export default LeadTable;
