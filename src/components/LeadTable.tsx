import { useState, useMemo } from "react";
import { format, differenceInDays } from "date-fns";
import { Download, ArrowRightLeft, Filter, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import PriorityBadge from "./PriorityBadge";
import AgeBadge from "./AgeBadge";
import ConfirmDialog from "./ConfirmDialog";
import { PRIORITIES, STATUSES, SALES_PERSONS } from "@/types/leads";
import type { NewPlacement, Replacement, LeadPriority } from "@/types/leads";

interface LeadTableProps {
  data: (NewPlacement | Replacement)[];
  isReplacement?: boolean;
  onUpdate: (id: string, field: string, value: string) => void;
  onBulkUpdate?: (ids: string[], field: string, value: string) => void;
  userRole?: string;
}

const ALL = "__all__";

const LeadTable = ({ data, isReplacement = false, onUpdate, onBulkUpdate, userRole }: LeadTableProps) => {
  const [confirm, setConfirm] = useState<{ id: string; field: string; value: string; label: string } | null>(null);
  const [editingAssign, setEditingAssign] = useState<{ id: string; value: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTransfer, setBulkTransfer] = useState<{ ids: string[]; value: string } | null>(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState(ALL);
  const [filterPriority, setFilterPriority] = useState(ALL);
  const [filterSalesPerson, setFilterSalesPerson] = useState(ALL);

  const hasFilters = filterStatus !== ALL || filterPriority !== ALL || filterSalesPerson !== ALL;

  const statusOrder: Record<string, number> = { "In-progress": 0, "Won": 1, "Lost": 2 };

  const filteredData = useMemo(() => {
    return data
      .filter((row) => {
        if (filterStatus !== ALL && row.lead_status !== filterStatus) return false;
        if (filterPriority !== ALL && row.lead_priority !== filterPriority) return false;
        if (filterSalesPerson !== ALL && row.sales_person !== filterSalesPerson) return false;
        return true;
      })
      .sort((a, b) => {
        const statusDiff = (statusOrder[a.lead_status] ?? 99) - (statusOrder[b.lead_status] ?? 99);
        if (statusDiff !== 0) return statusDiff;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [data, filterStatus, filterPriority, filterSalesPerson]);

  const canEdit = userRole === "admin";

  const handleInlineChange = (id: string, field: string, value: string, label: string) => {
    setConfirm({ id, field, value, label });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredData.map((r) => r.id)));
    }
  };

  const handleBulkTransfer = (salesPerson: string) => {
    const ids = Array.from(selectedIds);
    setBulkTransfer({ ids, value: salesPerson });
  };

  const confirmBulkTransfer = () => {
    if (!bulkTransfer) return;
    if (onBulkUpdate) {
      onBulkUpdate(bulkTransfer.ids, "sales_person", bulkTransfer.value);
    } else {
      bulkTransfer.ids.forEach((id) => onUpdate(id, "sales_person", bulkTransfer.value));
    }
    setSelectedIds(new Set());
    setBulkTransfer(null);
  };

  const clearFilters = () => {
    setFilterStatus(ALL);
    setFilterPriority(ALL);
    setFilterSalesPerson(ALL);
  };

  const exportCSV = (scope: "all" | "filtered" | "selected") => {
    let exportData: (NewPlacement | Replacement)[];
    if (scope === "selected" && selectedIds.size > 0) {
      exportData = filteredData.filter((r) => selectedIds.has(r.id));
    } else if (scope === "filtered") {
      exportData = filteredData;
    } else {
      exportData = data;
    }
    if (exportData.length === 0) return;

    const headers = [
      "Lead-in Date", "Age (days)", "Area", "Apartment", "Job Type", "Tasks", "Language", "Salary",
      "Priority", "Status", "Sales Person",
      ...(isReplacement ? ["Assign To"] : []),
    ];
    const rows = exportData.map((row) => [
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
    a.download = `${isReplacement ? "replacements" : "new_placements"}_${scope}_${format(new Date(), "yyyyMMdd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Filter bar */}
      <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border bg-card p-3">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs font-medium text-muted-foreground mr-1">Filters:</span>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Priority" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Priorities</SelectItem>
            {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterSalesPerson} onValueChange={setFilterSalesPerson}>
          <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Sales Person" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Sales Persons</SelectItem>
            {SALES_PERSONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs">
            <X className="h-3 w-3" /> Clear
          </Button>
        )}
        {hasFilters && (
          <Badge variant="secondary" className="text-xs ml-1">
            {filteredData.length} of {data.length} shown
          </Badge>
        )}
      </div>

      {/* Action bar */}
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        {canEdit && selectedIds.size > 0 && (
          <div className="flex items-center gap-2 rounded-md border bg-muted px-3 py-1.5">
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium">{selectedIds.size} selected — Transfer to:</span>
            <Select onValueChange={handleBulkTransfer}>
              <SelectTrigger className="h-7 w-28 text-xs"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {SALES_PERSONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setSelectedIds(new Set())}>Clear</Button>
          </div>
        )}
        <div className="ml-auto flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button variant="outline" size="sm" onClick={() => exportCSV("selected")} className="gap-2 text-xs">
              <Download className="h-4 w-4" /> Export Selected ({selectedIds.size})
            </Button>
          )}
          {hasFilters && (
            <Button variant="outline" size="sm" onClick={() => exportCSV("filtered")} className="gap-2 text-xs">
              <Download className="h-4 w-4" /> Export Filtered ({filteredData.length})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => exportCSV("all")} disabled={data.length === 0} className="gap-2 text-xs">
            <Download className="h-4 w-4" /> Export All
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 bg-muted z-10">
            <TableRow>
              {canEdit && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
                    onCheckedChange={toggleAll}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
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
            {filteredData.length === 0 && (
              <TableRow>
                <TableCell colSpan={(isReplacement ? 12 : 11) + (canEdit ? 1 : 0)} className="text-center text-muted-foreground py-8">
                  {data.length === 0 ? "No leads yet. Add one above." : "No leads match the current filters."}
                </TableCell>
              </TableRow>
            )}
            {filteredData.map((row) => (
              <TableRow key={row.id} className={`hover:bg-muted/50 ${selectedIds.has(row.id) ? "bg-accent/30" : ""}`}>
                {canEdit && (
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(row.id)}
                      onCheckedChange={() => toggleSelect(row.id)}
                      aria-label={`Select lead ${row.id}`}
                    />
                  </TableCell>
                )}
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

      <ConfirmDialog
        open={!!bulkTransfer}
        title="Confirm Bulk Transfer"
        description={bulkTransfer ? `Transfer ${bulkTransfer.ids.length} lead(s) to "${bulkTransfer.value}"?` : ""}
        onConfirm={confirmBulkTransfer}
        onCancel={() => setBulkTransfer(null)}
      />
    </>
  );
};

export default LeadTable;
