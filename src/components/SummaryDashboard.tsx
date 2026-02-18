import { useRef, useMemo, useState, useCallback } from "react";
import { differenceInDays, format, parseISO, startOfDay, subDays } from "date-fns";
import { toPng } from "html-to-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  won: "hsl(152, 60%, 42%)",
  lost: "hsl(220, 10%, 60%)",
  green: "hsl(152, 60%, 42%)",
  amber: "hsl(38, 92%, 50%)",
  red: "hsl(0, 72%, 51%)",
  placement: "hsl(230, 65%, 52%)",
  replacement: "hsl(210, 100%, 52%)",
  target: "hsl(0, 72%, 51%)",
  totalLine: "hsl(222, 47%, 20%)",
};

const KPI_GRADIENTS: Record<string, string> = {
  "Total Leads": "from-primary/10 to-primary/5",
  "New Placements": "from-blue-500/10 to-blue-500/5",
  "Replacements": "from-indigo-500/10 to-indigo-500/5",
  "Hot Leads": "from-destructive/10 to-destructive/5",
  "In-progress": "from-orange-500/10 to-orange-500/5",
  "Won": "from-emerald-500/10 to-emerald-500/5",
  "Lost": "from-muted-foreground/10 to-muted/5",
  "Conversion Rate": "from-emerald-500/10 to-emerald-500/5",
};

const KPI_ICON_BG: Record<string, string> = {
  "Total Leads": "bg-primary/15 text-primary",
  "New Placements": "bg-blue-500/15 text-blue-600",
  "Replacements": "bg-indigo-500/15 text-indigo-600",
  "Hot Leads": "bg-destructive/15 text-destructive",
  "In-progress": "bg-orange-500/15 text-orange-600",
  "Won": "bg-emerald-500/15 text-emerald-600",
  "Lost": "bg-muted text-muted-foreground",
  "Conversion Rate": "bg-emerald-500/15 text-emerald-600",
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

  // Today vs yesterday comparison
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
        backgroundColor: "hsl(220, 20%, 97%)",
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

  const kpiCards = [
    { label: "Total Leads", value: stats.total, icon: ClipboardList },
    { label: "New Placements", value: stats.totalPlacements, icon: Users },
    { label: "Replacements", value: stats.totalReplacements, icon: TrendingUp },
    { label: "Hot Leads", value: stats.hot, icon: Flame },
    { label: "In-progress", value: stats.inProgress, icon: Clock },
    { label: "Won", value: stats.won, icon: Trophy },
    { label: "Lost", value: stats.lost, icon: XCircle },
    { label: "Conversion Rate", value: `${stats.conversionRate}%`, icon: TrendingUp },
  ];

  const customTooltipStyle = {
    backgroundColor: "hsl(0, 0%, 100%)",
    border: "1px solid hsl(220, 16%, 90%)",
    borderRadius: "8px",
    fontSize: "12px",
    boxShadow: "0 4px 12px hsl(220 16% 90% / 0.5)",
  };

  return (
    <div className="space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground sm:text-2xl">Dashboard Overview</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Today: <span className="font-semibold text-foreground">{todayVsYesterday.today}</span> leads
            {todayVsYesterday.diff !== 0 && (
              <span className={`inline-flex items-center ml-1.5 text-xs font-medium ${todayVsYesterday.diff > 0 ? "text-emerald-600" : "text-destructive"}`}>
                {todayVsYesterday.diff > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(todayVsYesterday.diff)} vs yesterday
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={resetTour} className="gap-1.5 text-xs hidden sm:flex">
            <HelpCircle className="h-3.5 w-3.5" /> Tour
          </Button>
          <Button
            id="export-png-btn"
            variant="outline"
            size="sm"
            onClick={handleExportPng}
            disabled={exporting}
            className="gap-2 shadow-sm"
          >
            <Camera className="h-4 w-4" />
            <span className="hidden sm:inline">{exporting ? "Exporting…" : "Export PNG"}</span>
          </Button>
        </div>
      </div>

      <div ref={dashboardRef} className="space-y-5 bg-background rounded-lg">
        {/* KPI row */}
        <div id="kpi-cards" className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          {kpiCards.map((c) => (
            <div key={c.label} className={`kpi-card bg-gradient-to-br ${KPI_GRADIENTS[c.label] || ""}`}>
              <div className={`inline-flex items-center justify-center rounded-lg p-2 mb-2 ${KPI_ICON_BG[c.label] || "bg-muted text-muted-foreground"}`}>
                <c.icon className="h-4 w-4" />
              </div>
              <p className="text-2xl font-bold tracking-tight leading-none">{c.value}</p>
              <p className="text-[11px] text-muted-foreground mt-1 font-medium">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Drift Alerts */}
        <div id="drift-alerts">
          <div className="chart-card">
            <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="text-sm font-semibold flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <div className="inline-flex items-center justify-center rounded-lg bg-orange-500/15 text-orange-600 p-1.5">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  Daily Lead Target & Alerts
                </span>
                <Button variant="ghost" size="sm" onClick={toggleAlerts} className="gap-1.5 text-xs h-7 rounded-full">
                  {alertsEnabled ? <Bell className="h-3.5 w-3.5" /> : <BellOff className="h-3.5 w-3.5" />}
                  {alertsEnabled ? "On" : "Off"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 sm:px-6 sm:pb-5">
              <div className="flex flex-wrap items-end gap-3 mb-3">
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Daily target (leads/day)</Label>
                  <Input
                    type="number"
                    min={1}
                    className="h-8 w-24 text-xs"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSetTarget()}
                  />
                </div>
                <Button size="sm" onClick={handleSetTarget} className="h-8 text-xs rounded-lg">Set Target</Button>
              </div>
              {alertsEnabled && driftAlerts.length > 0 && (
                <div className="space-y-2">
                  {driftAlerts.slice(0, 3).map((a) => (
                    <Alert key={a.date} variant="destructive" className="py-2 rounded-lg">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="text-xs font-semibold">Below target on {a.date}</AlertTitle>
                      <AlertDescription className="text-xs">
                        {a.actual} lead(s) vs target {a.target} — shortfall of {a.target - a.actual}
                      </AlertDescription>
                    </Alert>
                  ))}
                  {driftAlerts.length > 3 && (
                    <p className="text-xs text-muted-foreground">+ {driftAlerts.length - 3} more day(s) below target</p>
                  )}
                </div>
              )}
              {alertsEnabled && driftAlerts.length === 0 && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs text-emerald-700 font-medium">All days this week met the daily target</p>
                </div>
              )}
            </CardContent>
          </div>
        </div>

        {/* Charts row 1 — stacks on mobile */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div id="chart-status" className="chart-card">
            <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="text-sm font-semibold">Status Distribution</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3 sm:px-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 11 }}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={customTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </div>

          <div id="chart-priority" className="chart-card">
            <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="text-sm font-semibold">Priority Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3 sm:px-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} label={({ name, value }) => `${name}: ${value}`} labelLine={false} style={{ fontSize: 11 }}>
                    {priorityData.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={customTooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </div>

          <div id="chart-ageing" className="chart-card sm:col-span-2 lg:col-span-1">
            <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <div className="inline-flex items-center justify-center rounded-md bg-orange-500/15 text-orange-600 p-1">
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                Lead Ageing
              </CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3 sm:px-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={ageingData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Bar dataKey="value" name="Leads" radius={[6, 6, 0, 0]}>
                    {ageingData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </div>
        </div>

        {/* Charts row 2 */}
        <div className="grid gap-4 lg:grid-cols-2">
          <div id="chart-sales" className="chart-card">
            <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="text-sm font-semibold">Sales Person Performance</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3 sm:px-4">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={salesData} layout="vertical" barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={55} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="won" name="Won" fill={COLORS.won} stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="inProgress" name="In-progress" fill={COLORS.inProgress} stackId="a" />
                  <Bar dataKey="total" name="Total" fill={COLORS.cold} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </div>

          <div id="chart-trend" className="chart-card">
            <CardHeader className="px-4 py-3 sm:px-6 sm:py-4">
              <CardTitle className="text-sm font-semibold">Daily Lead Intake (14 Days)</CardTitle>
            </CardHeader>
            <CardContent className="px-2 pb-3 sm:px-4">
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={customTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={dailyTarget} stroke={COLORS.target} strokeDasharray="6 3" label={{ value: `Target: ${dailyTarget}`, position: "right", fontSize: 10, fill: COLORS.target }} />
                  <Line type="monotone" dataKey="total" name="Total" stroke={COLORS.totalLine} strokeWidth={2.5} dot={{ r: 3, strokeWidth: 0, fill: COLORS.totalLine }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="placements" name="Placements" stroke={COLORS.placement} strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 2 }} />
                  <Line type="monotone" dataKey="replacements" name="Replacements" stroke={COLORS.replacement} strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 2 }} />
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
