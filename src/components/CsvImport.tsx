import { useState, useRef } from "react";
import { Upload, FileSpreadsheet, AlertCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logActivity } from "@/lib/activity-logger";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface CsvImportProps {
  userId: string;
  onSuccess: () => void;
}

const REQUIRED_HEADERS = [
  "lead_in_date", "area", "apartment", "job_type", "tasks", "language",
  "salary", "lead_priority", "lead_status", "sales_person",
];

interface ParsedRow {
  data: Record<string, string>;
  errors: string[];
}

const CsvImport = ({ userId, onSuccess }: CsvImportProps) => {
  const [open, setOpen] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase().replace(/ /g, "_"));
    const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
    if (missing.length > 0) {
      toast({ title: "Missing columns", description: `Required: ${missing.join(", ")}`, variant: "destructive" });
      return [];
    }

    return lines.slice(1).filter((l) => l.trim()).map((line) => {
      const values = line.match(/("([^"]*)"|[^,]*)/g)?.map((v) => v.replace(/^"|"$/g, "").trim()) ?? [];
      const data: Record<string, string> = {};
      headers.forEach((h, i) => { data[h] = values[i] ?? ""; });

      const errors: string[] = [];
      REQUIRED_HEADERS.forEach((h) => { if (!data[h]) errors.push(`Missing ${h}`); });

      // Validate date format
      if (data.lead_in_date && isNaN(Date.parse(data.lead_in_date))) {
        errors.push("Invalid date format");
      }

      return { data, errors };
    });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      setParsedRows(rows);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => r.errors.length === 0);
    if (validRows.length === 0) {
      toast({ title: "No valid rows", description: "Fix errors before importing.", variant: "destructive" });
      return;
    }

    setImporting(true);
    const records = validRows.map((r) => ({
      lead_in_date: r.data.lead_in_date,
      area: r.data.area,
      apartment: r.data.apartment,
      job_type: r.data.job_type,
      tasks: r.data.tasks.split(";").map((t) => t.trim()).filter(Boolean),
      language: r.data.language.split(";").map((l) => l.trim()).filter(Boolean),
      salary: r.data.salary,
      lead_priority: r.data.lead_priority,
      lead_status: r.data.lead_status,
      sales_person: r.data.sales_person,
      created_by: userId,
    }));

    const { error } = await supabase.from("new_placements").insert(records);
    setImporting(false);

    if (error) {
      toast({ title: "Import failed", description: error.message, variant: "destructive" });
      return;
    }

    await logActivity({ action: "create", entityType: "new_placements", details: { source: "csv_import", count: records.length } });
    toast({ title: "Imported", description: `${records.length} placement(s) added successfully.` });
    setParsedRows([]);
    setFileName("");
    setOpen(false);
    onSuccess();
  };

  const validCount = parsedRows.filter((r) => r.errors.length === 0).length;
  const errorCount = parsedRows.filter((r) => r.errors.length > 0).length;

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setParsedRows([]); setFileName(""); } }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-xs">
          <Upload className="h-3.5 w-3.5" /> Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" /> Import Placements from CSV
          </DialogTitle>
          <DialogDescription>
            CSV must have headers: {REQUIRED_HEADERS.join(", ")}. Use semicolons for multi-values (tasks, language).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          <Button variant="outline" onClick={() => fileRef.current?.click()} className="gap-2 w-full">
            <Upload className="h-4 w-4" /> {fileName || "Choose CSV file"}
          </Button>

          {parsedRows.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="gap-1"><Check className="h-3 w-3" /> {validCount} valid</Badge>
                {errorCount > 0 && <Badge variant="destructive" className="gap-1"><AlertCircle className="h-3 w-3" /> {errorCount} errors</Badge>}
              </div>

              <ScrollArea className="h-60 rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Area</TableHead>
                      <TableHead>Apartment</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedRows.slice(0, 50).map((row, i) => (
                      <TableRow key={i} className={row.errors.length > 0 ? "bg-destructive/5" : ""}>
                        <TableCell className="text-xs">{i + 1}</TableCell>
                        <TableCell className="text-xs">{row.data.lead_in_date}</TableCell>
                        <TableCell className="text-xs">{row.data.area}</TableCell>
                        <TableCell className="text-xs">{row.data.apartment}</TableCell>
                        <TableCell className="text-xs">{row.data.lead_priority}</TableCell>
                        <TableCell className="text-xs">
                          {row.errors.length > 0 ? (
                            <span className="text-destructive">{row.errors.join(", ")}</span>
                          ) : row.data.lead_status}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleImport} disabled={importing || validCount === 0} className="gap-2">
            {importing ? "Importing..." : `Import ${validCount} Row(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CsvImport;
