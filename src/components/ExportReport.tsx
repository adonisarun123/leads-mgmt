import { useState, useMemo } from "react";
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { Download, FileBarChart, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { JOB_TYPES } from "@/types/leads";
import type { NewPlacement, Replacement } from "@/types/leads";

interface ExportReportProps {
  placements: NewPlacement[];
  replacements: Replacement[];
}

const ALL = "__all__";

const ExportReport = ({ placements, replacements }: ExportReportProps) => {
  const [open, setOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState<Date>();
  const [dateTo, setDateTo] = useState<Date>();
  const [area, setArea] = useState(ALL);
  const [jobType, setJobType] = useState(ALL);
  const [dataType, setDataType] = useState<"placements" | "replacements" | "all">("all");

  const areas = useMemo(() => {
    const s = new Set([...placements.map((p) => p.area), ...replacements.map((r) => r.area)]);
    return Array.from(s).sort();
  }, [placements, replacements]);

  const filterData = <T extends NewPlacement>(data: T[]): T[] => {
    return data.filter((row) => {
      if (area !== ALL && row.area !== area) return false;
      if (jobType !== ALL && row.job_type !== jobType) return false;
      if (dateFrom && dateTo) {
        const d = parseISO(row.lead_in_date);
        if (!isWithinInterval(d, { start: startOfDay(dateFrom), end: endOfDay(dateTo) })) return false;
      } else if (dateFrom) {
        if (parseISO(row.lead_in_date) < startOfDay(dateFrom)) return false;
      } else if (dateTo) {
        if (parseISO(row.lead_in_date) > endOfDay(dateTo)) return false;
      }
      return true;
    });
  };

  const filteredPlacements = dataType !== "replacements" ? filterData(placements) : [];
  const filteredReplacements = dataType !== "placements" ? filterData(replacements) : [];
  const totalCount = filteredPlacements.length + filteredReplacements.length;

  const exportCSV = () => {
    const headers = [
      "Type", "Lead-in Date", "Area", "Apartment", "Job Type", "Tasks", "Language",
      "Salary", "Priority", "Status", "Sales Person", "Assign To",
    ];

    const rows = [
      ...filteredPlacements.map((r) => [
        "Placement", format(new Date(r.lead_in_date), "dd/MM/yyyy"),
        r.area, r.apartment, r.job_type, r.tasks.join("; "), r.language.join("; "),
        r.salary, r.lead_priority, r.lead_status, r.sales_person, "",
      ]),
      ...filteredReplacements.map((r) => [
        "Replacement", format(new Date(r.lead_in_date), "dd/MM/yyyy"),
        r.area, r.apartment, r.job_type, r.tasks.join("; "), r.language.join("; "),
        r.salary, r.lead_priority, r.lead_status, r.sales_person, r.assign_to,
      ]),
    ];

    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const suffix = dateFrom && dateTo
      ? `${format(dateFrom, "yyyyMMdd")}-${format(dateTo, "yyyyMMdd")}`
      : format(new Date(), "yyyyMMdd");
    a.download = `report_${dataType}_${suffix}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-xs">
          <FileBarChart className="h-3.5 w-3.5" /> Export Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-primary" /> Export Report
          </DialogTitle>
          <DialogDescription>Filter and export leads data as CSV.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Data Type</Label>
            <Select value={dataType} onValueChange={(v) => setDataType(v as any)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Leads</SelectItem>
                <SelectItem value="placements">Placements Only</SelectItem>
                <SelectItem value="replacements">Replacements Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left text-xs h-8", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Start"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left text-xs h-8", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-1 h-3 w-3" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy") : "End"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Area</Label>
            <Select value={area} onValueChange={setArea}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Areas</SelectItem>
                {areas.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs">Job Type</Label>
            <Select value={jobType} onValueChange={setJobType}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Job Types</SelectItem>
                {JOB_TYPES.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <Badge variant="secondary" className="text-xs">
            {totalCount} lead(s) match filters
          </Badge>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={exportCSV} disabled={totalCount === 0} className="gap-2">
            <Download className="h-4 w-4" /> Export {totalCount} Row(s)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportReport;
