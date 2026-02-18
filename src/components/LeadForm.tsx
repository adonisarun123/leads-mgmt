import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import MultiSelect from "./MultiSelect";
import ConfirmDialog from "./ConfirmDialog";
import { JOB_TYPES, PRIORITIES, STATUSES, SALES_PERSONS, TASK_OPTIONS, LANGUAGE_OPTIONS } from "@/types/leads";
import type { JobType, LeadPriority, LeadStatus, SalesPerson } from "@/types/leads";

interface LeadFormProps {
  isReplacement?: boolean;
  onSubmit: (data: any) => void;
  loading?: boolean;
}

const LeadForm = ({ isReplacement = false, onSubmit, loading }: LeadFormProps) => {
  const [open, setOpen] = useState(true);
  const [date, setDate] = useState<Date>();
  const [area, setArea] = useState("");
  const [apartment, setApartment] = useState("");
  const [jobType, setJobType] = useState<JobType | "">("");
  const [tasks, setTasks] = useState<string[]>([]);
  const [language, setLanguage] = useState<string[]>([]);
  const [salary, setSalary] = useState("");
  const [priority, setPriority] = useState<LeadPriority | "">("");
  const [status, setStatus] = useState<LeadStatus | "">("");
  const [salesPerson, setSalesPerson] = useState<SalesPerson | "">("");
  const [assignTo, setAssignTo] = useState("");

  const [confirm, setConfirm] = useState<{ field: string; value: string; setter: (v: any) => void } | null>(null);

  const isValid =
    date && area && apartment && jobType && tasks.length > 0 && language.length > 0 && salary && priority && status && salesPerson &&
    (!isReplacement || assignTo);

  const handleConfirmField = (field: string, value: string, setter: (v: any) => void) => {
    setConfirm({ field, value, setter });
  };

  const reset = () => {
    setDate(undefined);
    setArea("");
    setApartment("");
    setJobType("");
    setTasks([]);
    setLanguage([]);
    setSalary("");
    setPriority("");
    setStatus("");
    setSalesPerson("");
    setAssignTo("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    const data: any = {
      lead_in_date: format(date!, "yyyy-MM-dd"),
      area,
      apartment,
      job_type: jobType,
      tasks,
      language,
      salary,
      lead_priority: priority,
      lead_status: status,
      sales_person: salesPerson,
    };
    if (isReplacement) data.assign_to = assignTo;
    onSubmit(data);
    reset();
  };

  const confirmLabels: Record<string, string> = {
    priority: "Confirm lead priority as",
    status: "Are you sure you want to mark this lead as",
    salesPerson: "Confirm assignment to",
    assignTo: "Confirm assignment to",
  };

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen} className="mb-4">
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="mb-2 gap-2">
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {isReplacement ? "New Replacement Entry" : "New Placement Entry"}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <form onSubmit={handleSubmit} className="grid gap-4 rounded-lg border bg-card p-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Lead-in Date */}
            <div className="space-y-1">
              <Label>Lead-in Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !date && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "dd/MM/yyyy") : "DD/MM/YYYY"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={date} onSelect={setDate} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>

            {/* Area */}
            <div className="space-y-1">
              <Label>Area of Requirement</Label>
              <Input placeholder="e.g. Haralur" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>

            {/* Apartment */}
            <div className="space-y-1">
              <Label>Apartment / Society</Label>
              <Input placeholder="e.g. SNN Raj Etternia" value={apartment} onChange={(e) => setApartment(e.target.value)} />
            </div>

            {/* Job Type */}
            <div className="space-y-1">
              <Label>Job Type</Label>
              <Select value={jobType} onValueChange={(v) => setJobType(v as JobType)}>
                <SelectTrigger><SelectValue placeholder="Select job type" /></SelectTrigger>
                <SelectContent>
                  {JOB_TYPES.map((j) => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Tasks */}
            <div className="space-y-1">
              <Label>Tasks</Label>
              <MultiSelect options={TASK_OPTIONS} selected={tasks} onChange={setTasks} placeholder="Select tasks" />
            </div>

            {/* Language */}
            <div className="space-y-1">
              <Label>Language</Label>
              <MultiSelect options={LANGUAGE_OPTIONS} selected={language} onChange={setLanguage} placeholder="Select language" />
            </div>

            {/* Salary */}
            <div className="space-y-1">
              <Label>Salary</Label>
              <Input placeholder="e.g. 22K" value={salary} onChange={(e) => setSalary(e.target.value)} />
            </div>

            {/* Priority */}
            <div className="space-y-1">
              <Label>Lead Priority</Label>
              <Select value={priority} onValueChange={(v) => handleConfirmField("priority", v, setPriority)}>
                <SelectTrigger><SelectValue placeholder="Select priority" /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-1">
              <Label>Lead Status</Label>
              <Select value={status} onValueChange={(v) => handleConfirmField("status", v, setStatus)}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Sales Person */}
            <div className="space-y-1">
              <Label>Sales Person</Label>
              <Select value={salesPerson} onValueChange={(v) => handleConfirmField("salesPerson", v, setSalesPerson)}>
                <SelectTrigger><SelectValue placeholder="Select person" /></SelectTrigger>
                <SelectContent>
                  {SALES_PERSONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Assign To (Replacements only) */}
            {isReplacement && (
              <div className="space-y-1">
                <Label>Assign To</Label>
                <Input placeholder="Ops exec / Field officer" value={assignTo} onChange={(e) => setAssignTo(e.target.value)} />
              </div>
            )}

            <div className="flex items-end md:col-span-2 lg:col-span-1">
              <Button type="submit" disabled={!isValid || loading} className="w-full">
                {loading ? "Saving..." : "Submit"}
              </Button>
            </div>
          </form>
        </CollapsibleContent>
      </Collapsible>

      <ConfirmDialog
        open={!!confirm}
        title="Confirm Selection"
        description={confirm ? `${confirmLabels[confirm.field]} "${confirm.value}"?` : ""}
        onConfirm={() => {
          if (confirm) confirm.setter(confirm.value);
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
};

export default LeadForm;
