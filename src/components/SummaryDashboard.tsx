import { useRef, useMemo, useState, useCallback } from "react";
import { differenceInDays, format, parseISO, startOfDay, subDays } from "date-fns";
import { toPng } from "html-to-image";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, ReferenceLine,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  ClipboardList, Flame, Trophy, XCircle, Clock, Users, TrendingUp,
  AlertTriangle, Camera, Bell, BellOff, HelpCircle, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import useDashboardTour from "@/hooks/use-dashboard-tour";
import type { NewPlacement, Replacement } from "@/types/leads";

interface SummaryDashboardProps {
  placements: NewPlacement[];
  replacements: Replacement[];
}

const COLORS = {
  hot: "hsl(0, 72%, 51%)",
  warm: "hsl(38, 92%, 50%)",
  cold: "hsl(210, 100%, 52%)",
  inProgress: "hsl(38, 92%, 50%)",
  won: "hsl(160, 60%, 40%)",
  lost: "hsl(210, 12%, 60%)",
  green: "hsl(160, 60%, 40%)",
  amber: "hsl(38, 92%, 50%)",
  red: "hsl(0, 72%, 51%)",
  placement: "hsl(192, 70%, 42%)",
  replacement: "hsl(210, 100%, 52%)",
  target: "hsl(0, 72%, 51%)",
  totalLine: "hsl(192, 70%, 32%)",
};

type AccentVariant = "primary" | "info" | "success" | "warning" | "destructive" | "muted";

const KPI_CONFIG: { label: string; accent: AccentVariant; iconBg: string }[] = [
  { label: "Total Leads",     accent: "primary",     iconBg: "bg-primary/15 text-primary" },
  { label: "New Placements",  accent: "info",        iconBg: "bg-info/15 text-info" },
  { label: "Replacements",    accent: "primary",     iconBg: "bg-primary/15 text-primary" },
  { label: "Hot Leads",       accent: "destructive", iconBg: "bg-destructive/15 text-destructive" },
  { label: "In-progress",     accent: "warning",     iconBg: "bg-warning/15 text-warning" },
  { label: "Won",             accent: "success",     iconBg: "bg-success/15 text-success" },
  { label: "Lost",            accent: "muted",       iconBg: "bg-muted text-muted-foreground" },
  { label: "Conversion Rate", accent: "success",     iconBg: "bg-success/15 text-success" },
];

const KPI_ICONS = {
  "Total Leads": ClipboardList,
  "New Placements": Users,
  "Replacements": TrendingUp,
  "Hot Leads": Flame,
  "In-progress": Clock,
  "Won": Trophy,
  "Lost": XCircle,
  "Conversion Rate": TrendingUp,
};

const SummaryDashboard = ({ placements, replacements }: SummaryDashboardProps) => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [dailyTarget, setDailyTarget] = useState(() => {
    const saved = localStorage.getItem("ezyhelpers_daily_target");
    return saved ? Number(saved) : 5;
  });
  const [targetInput, setTargetInput] = useState(String(dailyTarget));
  const [alertsEnabled, setAlertsEnabled] = useState(() => {
    return localStorage.getItem("ezyhelpers_alerts_enabled") !== "false";
  });
  const [exporting, setExporting] = useState(false);

  useDashboardTour();

  const allLeads = useMemo(() => [...placements, ...replacements], [placements, replacements]);

  const stats = useMemo(() => {
    const total = allLeads.length;
    const totalPlacements = placements.length;
    const totalReplacements = replacements.length;
    const hot = allLeads.filter((d) => d.lead_priority === "Hot").length;
    const inProgress = allLeads.filter((d) => d.lead_status === "In-progress").length;
    const won = allLeads.filter((d) => d.lead_status === "Won").length;
    const lost = allLeads.filter((d) => d.lead_status === "Lost").length;
    const conversionRate = total > 0 ? Math.round((won / total) * 100) : 0;
    const ageing = allLeads.reduce(
      (acc, d) => {
        const age = differenceInDays(new Date(), new Date(d.lead_in_date));
        if (age <= 3) acc.green++;
        else if (age <= 7) acc.amber++;
        else acc.red++;
        return acc;
      },
      { green: 0, amber: 0, red: 0 }
    );
    return { total, totalPlacements, totalReplacements, hot, inProgress, won, lost, conversionRate, ageing };
  }, [allLeads, placements, replacements]);

  const statusData = useMemo(
    () => [
      { name: "In-progress", value: stats.inProgress, fill: COLORS.inProgress },
      { name: "Won", value: stats.won, fill: COLORS.won },
      { name: "Lost", value: stats.lost, fill: COLORS.lost },
    ],
    [stats]
  );

  const priorityData = useMemo(
    () => [
      { name: "Hot", value: allLeads.filter((d) => d.lead_priority === "Hot").length, fill: COLORS.hot },
      { name: "Warm", value: allLeads.filter((d) => d.lead_priority === "Warm").length, fill: COLORS.warm },
      { name: "Cold", value: allLeads.filter((d) => d.lead_priority === "Cold").length, fill: COLORS.cold },
    ],
    [allLeads]
  );

  const ageingData = useMemo(
    () => [
      { name: "0–3d", value: stats.ageing.green, fill: COLORS.green },
      { name: "4–7d", value: stats.ageing.amber, fill: COLORS.amber },
      { name: "8+d", value: stats.ageing.red, fill: COLORS.red },
    ],
    [stats.ageing]
  );

  const salesData = useMemo(() => {
    const map: Record<string, { name: string; total: number; won: number; inProgress: number }> = {};
    allLeads.forEach((d) => {
      if (!map[d.sales_person]) map[d.sales_person] = { name: d.sales_person, total: 0, won: 0, inProgress: 0 };
      map[d.sales_person].total++;
      if (d.lead_status === "Won") map[d.sales_person].won++;
      if (d.lead_status === "In-progress") map[d.sales_person].inProgress++;
    });
    return Object.values(map).sort((a, b) => b.total - a.total);
  }, [allLeads]);

  const trendData = useMemo(() => {
    const days: { date: string; placements: number; replacements: number; total: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const dateStr = format(day, "yyyy-MM-dd");
      const p = placements.filter((pl) => format(parseISO(pl.created_at), "yyyy-MM-dd") === dateStr).length;
      const r = replacements.filter((rl) => format(parseISO(rl.created_at), "yyyy-MM-dd") === dateStr).length;
      days.push({ date: format(day, "dd MMM"), placements: p, replacements: r, total: p + r });
    }
    return days;
  }, [placements, replacements]);

  const driftAlerts = useMemo(() => {
    if (!alertsEnabled) return [];
    const alerts: { date: string; actual: number; target: number }[] = [];
    for (let i = 1; i <= 7; i++) {
      const day = startOfDay(subDays(new Date(), i));
      const dateStr = format(day, "yyyy-MM-dd");
      const p = placements.filter((pl) => format(parseISO(pl.created_at), "yyyy-MM-dd") === dateStr).length;
      const r = replacements.filter((rl) => format(parseISO(rl.created_at), "yyyy-MM-dd") === dateStr).length;
      if (p + r < dailyTarget) alerts.push({ date: format(day, "dd MMM"), actual: p + r, target: dailyTarget });
    }
    return alerts;
  }, [placements, replacements, dailyTarget, alertsEnabled]);

  const todayVsYesterday = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const yestStr = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const todayCount = allLeads.filter((l) => format(parseISO(l.created_at), "yyyy-MM-dd") === todayStr).length;
    const yestCount = allLeads.filter((l) => format(parseISO(l.created_at), "yyyy-MM-dd") === yestStr).length;
    return { today: todayCount, yesterday: yestCount, diff: todayCount - yestCount };
  }, [allLeads]);

  const handleSetTarget = () => {
    const val = Math.max(1, Number(targetInput) || 1);
    setDailyTarget(val);
    setTargetInput(String(val));
    localStorage.setItem("ezyhelpers_daily_target", String(val));
    toast({ title: "Target Updated", description: `Daily lead target set to ${val}` });
  };

  const toggleAlerts = () => {
    const next = !alertsEnabled;
    setAlertsEnabled(next);
    localStorage.setItem("ezyhelpers_alerts_enabled", String(next));
    toast({ title: next ? "Alerts Enabled" : "Alerts Disabled" });
  };

  const handleExportPng = useCallback(async () => {
    if (!dashboardRef.current) return;
    setExporting(true);
    try {
      const dataUrl = await toPng(dashboardRef.current, {
        backgroundColor: "hsl(210, 20%, 96%)",
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `dashboard_${format(new Date(), "yyyyMMdd_HHmm")}.png`;
      link.href = dataUrl;
      link.click();
      toast({ title: "Exported", description: "Dashboard PNG saved." });
    } catch {
      toast({ title: "Export failed", description: "Could not generate PNG.", variant: "destructive" });
    } finally {
      setExporting(false);
    }
  }, []);

  const resetTour = () => {
    localStorage.removeItem("ezyhelpers_dashboard_tour_done");
    window.location.reload();
  };

  const kpiValues: Record<string, string | number> = {
    "Total Leads": stats.total,
    "New Placements": stats.totalPlacements,
    "Replacements": stats.totalReplacements,
    "Hot Leads": stats.hot,
    "In-progress": stats.inProgress,
    "Won": stats.won,
    "Lost": stats.lost,
    "Conversion Rate": `${stats.conversionRate}%`,
  };

  const tooltipStyle = {
    backgroundColor: "hsl(0, 0%, 100%)",
    border: "1px solid hsl(210, 18%, 89%)",
    borderRadius: "10px",
    fontSize: "12px",
    boxShadow: "0 4px 12px hsl(210 18% 50% / 0.1)",
    padding: "8px 12px",
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-foreground sm:text-xl truncate">Dashboard</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Today: <span className="font-semibold text-foreground">{todayVsYesterday.today}</span> leads
            {todayVsYesterday.diff !== 0 && (
              <span className={`inline-flex items-center ml-1 text-[11px] font-medium ${todayVsYesterday.diff > 0 ? "text-success" : "text-destructive"}`}>
                {todayVsYesterday.diff > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(todayVsYesterday.diff)} vs yesterday
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={resetTour} className="gap-1 text-xs h-8 hidden sm:flex">
            <HelpCircle className="h-3.5 w-3.5" /> Tour
          </Button>
          <Button
            id="export-png-btn"
            variant="outline"
            size="sm"
            onClick={handleExportPng}
            disabled={exporting}
            className="gap-1.5 h-8 text-xs"
          >
            <Camera className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{exporting ? "Exporting…" : "Export PNG"}</span>
          </Button>
        </div>
      </div>

      <div ref={dashboardRef} className="space-y-4 sm:space-y-5 bg-background rounded-xl">
        {/* KPI grid — 2 cols mobile, 4 cols tablet, 8 cols desktop */}
        <div id="kpi-cards" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-8 sm:gap-3">
          {KPI_CONFIG.map((c) => {
            const Icon = KPI_ICONS[c.label as keyof typeof KPI_ICONS];
            return (
              <div key={c.label} className={`kpi-card kpi-card--${c.accent}`}>
                <div className={`inline-flex items-center justify-center rounded-lg p-1.5 sm:p-2 mb-1.5 sm:mb-2 ${c.iconBg}`}>
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
                <p className="text-xl sm:text-2xl font-bold tracking-tight leading-none">{kpiValues[c.label]}</p>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 font-medium leading-tight">{c.label}</p>
              </div>
            );
          })}
        </div>

        {/* Drift Alerts */}
        <div id="drift-alerts">
          <div className="chart-card">
            <CardHeader className="px-3 py-2.5 sm:px-5 sm:py-3.5">
              <CardTitle className="text-xs sm:text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="inline-flex items-center justify-center rounded-lg bg-warning/15 text-warning p-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <span className="hidden sm:inline">Daily Lead Target & Alerts</span>
                  <span className="sm:hidden">Target & Alerts</span>
                </span>
                <Button variant="ghost" size="sm" onClick={toggleAlerts} className="gap-1 text-[11px] h-7 rounded-full px-2">
                  {alertsEnabled ? <Bell className="h-3 w-3" /> : <BellOff className="h-3 w-3" />}
                  {alertsEnabled ? "On" : "Off"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:px-5 sm:pb-4">
              <div className="flex flex-wrap items-end gap-2 mb-3">
                <div className="space-y-1">
                  <Label className="text-[11px] font-medium">Daily target</Label>
                  <Input
                    type="number"
                    min={1}
                    className="h-8 w-20 text-xs"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSetTarget()}
                  />
                </div>
                <Button size="sm" onClick={handleSetTarget} className="h-8 text-xs rounded-lg">Set</Button>
              </div>
              {alertsEnabled && driftAlerts.length > 0 && (
                <div className="space-y-1.5">
                  {driftAlerts.slice(0, 3).map((a) => (
                    <Alert key={a.date} variant="destructive" className="py-1.5 rounded-lg">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      <AlertTitle className="text-[11px] font-semibold">Below target on {a.date}</AlertTitle>
                      <AlertDescription className="text-[11px]">
                        {a.actual} lead(s) vs target {a.target} — shortfall of {a.target - a.actual}
                      </AlertDescription>
                    </Alert>
                  ))}
                  {driftAlerts.length > 3 && (
                    <p className="text-[11px] text-muted-foreground">+ {driftAlerts.length - 3} more day(s) below target</p>
                  )}
                </div>
              )}
              {alertsEnabled && driftAlerts.length === 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-success/10 px-3 py-2">
                  <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                  <p className="text-[11px] text-success font-medium">All days met the daily target ✓</p>
                </div>
              )}
            </CardContent>
          </div>
        </div>

        {/* Charts row 1 — stacks fully on mobile */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div id="chart-status" className="chart-card">
            <CardHeader className="px-3 py-2.5 sm:px-5 sm:py-3.5">
              <CardTitle className="text-xs sm:text-sm font-semibold">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="px-1 pb-2 sm:px-3 sm:pb-3">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 10 }}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </div>

          <div id="chart-priority" className="chart-card">
            <CardHeader className="px-3 py-2.5 sm:px-5 sm:py-3.5">
              <CardTitle className="text-xs sm:text-sm font-semibold">Priority Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="px-1 pb-2 sm:px-3 sm:pb-3">
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={68} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 10 }}>
                    {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </div>

          <div id="chart-ageing" className="chart-card sm:col-span-2 lg:col-span-1">
            <CardHeader className="px-3 py-2.5 sm:px-5 sm:py-3.5">
              <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
                <div className="inline-flex items-center justify-center rounded-md bg-warning/15 text-warning p-1">
                  <AlertTriangle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                </div>
                Lead Ageing
              </CardTitle>
            </CardHeader>
            <CardContent className="px-1 pb-2 sm:px-3 sm:pb-3">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ageingData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" name="Leads" radius={[6, 6, 0, 0]}>
                    {ageingData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </div>
        </div>

        {/* Charts row 2 — stacks on mobile */}
        <div className="grid gap-3 sm:gap-4 grid-cols-1 lg:grid-cols-2">
          <div id="chart-sales" className="chart-card">
            <CardHeader className="px-3 py-2.5 sm:px-5 sm:py-3.5">
              <CardTitle className="text-xs sm:text-sm font-semibold">Sales Person Performance</CardTitle>
            </CardHeader>
            <CardContent className="px-1 pb-2 sm:px-3 sm:pb-3">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={salesData} layout="vertical" barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={50} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="won" name="Won" fill={COLORS.won} stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="inProgress" name="In-progress" fill={COLORS.inProgress} stackId="a" />
                  <Bar dataKey="total" name="Total" fill={COLORS.cold} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </div>

          <div id="chart-trend" className="chart-card">
            <CardHeader className="px-3 py-2.5 sm:px-5 sm:py-3.5">
              <CardTitle className="text-xs sm:text-sm font-semibold">Daily Lead Intake (14 Days)</CardTitle>
            </CardHeader>
            <CardContent className="px-1 pb-2 sm:px-3 sm:pb-3">
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 8 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <ReferenceLine y={dailyTarget} stroke={COLORS.target} strokeDasharray="6 3" label={{ value: `Target: ${dailyTarget}`, position: "right", fontSize: 9, fill: COLORS.target }} />
                  <Line type="monotone" dataKey="total" name="Total" stroke={COLORS.totalLine} strokeWidth={2.5} dot={{ r: 2.5, strokeWidth: 0, fill: COLORS.totalLine }} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="placements" name="Placements" stroke={COLORS.placement} strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 1.5 }} />
                  <Line type="monotone" dataKey="replacements" name="Replacements" stroke={COLORS.replacement} strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 1.5 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryDashboard;
