import { useState } from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PriorityBadge from "./PriorityBadge";
import AgeBadge from "./AgeBadge";
import ConfirmDialog from "./ConfirmDialog";
import { PRIORITIES, STATUSES, SALES_PERSONS } from "@/types/leads";
import type { NewPlacement, Replacement, LeadPriority, LeadStatus, SalesPerson } from "@/types/leads";

interface LeadTableProps {
  data: (NewPlacement | Replacement)[];
  isReplacement?: boolean;
  onUpdate: (id: string, field: string, value: string) => void;
}

const LeadTable = ({ data, isReplacement = false, onUpdate }: LeadTableProps) => {
  const [confirm, setConfirm] = useState<{ id: string; field: string; value: string; label: string } | null>(null);

  const handleInlineChange = (id: string, field: string, value: string, label: string) => {
    setConfirm({ id, field, value, label });
  };

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 bg-muted">
            <TableRow>
              <TableHead>Lead-in Date</TableHead>
              {isReplacement && <TableHead>Age</TableHead>}
              <TableHead>Area</TableHead>
              <TableHead>Apartment</TableHead>
              <TableHead>Job Type</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Salary</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Sales Person</TableHead>
              {isReplacement && <TableHead>Assign To</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={isReplacement ? 12 : 10} className="text-center text-muted-foreground py-8">
                  No leads yet. Add one above.
                </TableCell>
              </TableRow>
            )}
            {data.map((row) => (
              <TableRow key={row.id} className="hover:bg-muted/50">
                <TableCell className="whitespace-nowrap">{format(new Date(row.lead_in_date), "dd/MM/yyyy")}</TableCell>
                {isReplacement && (
                  <TableCell><AgeBadge leadInDate={row.lead_in_date} /></TableCell>
                )}
                <TableCell>{row.area}</TableCell>
                <TableCell>{row.apartment}</TableCell>
                <TableCell>{row.job_type}</TableCell>
                <TableCell>{row.tasks.join(", ")}</TableCell>
                <TableCell>{row.language.join(", ")}</TableCell>
                <TableCell>{row.salary}</TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell>
                  <Select
                    value={row.lead_status}
                    onValueChange={(v) => handleInlineChange(row.id, "lead_status", v, `Are you sure you want to mark this lead as "${v}"?`)}
                  >
                    <SelectTrigger className="h-8 w-28 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={row.sales_person}
                    onValueChange={(v) => handleInlineChange(row.id, "sales_person", v, `Confirm assignment to "${v}"?`)}
                  >
                    <SelectTrigger className="h-8 w-24 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SALES_PERSONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                {isReplacement && (
                  <TableCell>{(row as Replacement).assign_to}</TableCell>
                )}
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
