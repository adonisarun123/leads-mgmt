import { useMemo } from "react";
import { differenceInDays, format, parseISO, startOfDay, subDays } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  ClipboardList, Flame, Trophy, XCircle, Clock, Users, TrendingUp, AlertTriangle,
} from "lucide-react";
import type { NewPlacement, Replacement } from "@/types/leads";

interface SummaryDashboardProps {
  placements: NewPlacement[];
  replacements: Replacement[];
}

const COLORS = {
  hot: "hsl(0, 84%, 60%)",
  warm: "hsl(35, 92%, 55%)",
  cold: "hsl(210, 50%, 55%)",
  inProgress: "hsl(35, 92%, 55%)",
  won: "hsl(142, 60%, 45%)",
  lost: "hsl(0, 0%, 60%)",
  green: "hsl(142, 60%, 45%)",
  amber: "hsl(35, 92%, 55%)",
  red: "hsl(0, 84%, 60%)",
  placement: "hsl(222, 47%, 30%)",
  replacement: "hsl(210, 50%, 55%)",
};

const SummaryDashboard = ({ placements, replacements }: SummaryDashboardProps) => {
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

    // Ageing
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

  // Status distribution
  const statusData = useMemo(
    () => [
      { name: "In-progress", value: stats.inProgress, fill: COLORS.inProgress },
      { name: "Won", value: stats.won, fill: COLORS.won },
      { name: "Lost", value: stats.lost, fill: COLORS.lost },
    ],
    [stats]
  );

  // Priority breakdown
  const priorityData = useMemo(
    () => [
      { name: "Hot", value: allLeads.filter((d) => d.lead_priority === "Hot").length, fill: COLORS.hot },
      { name: "Warm", value: allLeads.filter((d) => d.lead_priority === "Warm").length, fill: COLORS.warm },
      { name: "Cold", value: allLeads.filter((d) => d.lead_priority === "Cold").length, fill: COLORS.cold },
    ],
    [allLeads]
  );

  // Ageing chart data
  const ageingData = useMemo(
    () => [
      { name: "0–3 days", value: stats.ageing.green, fill: COLORS.green },
      { name: "4–7 days", value: stats.ageing.amber, fill: COLORS.amber },
      { name: "8+ days", value: stats.ageing.red, fill: COLORS.red },
    ],
    [stats.ageing]
  );

  // Sales person performance
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

  // Daily trend (last 14 days)
  const trendData = useMemo(() => {
    const days: { date: string; placements: number; replacements: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const day = startOfDay(subDays(new Date(), i));
      const dateStr = format(day, "yyyy-MM-dd");
      days.push({
        date: format(day, "dd MMM"),
        placements: placements.filter((p) => format(parseISO(p.created_at), "yyyy-MM-dd") === dateStr).length,
        replacements: replacements.filter((r) => format(parseISO(r.created_at), "yyyy-MM-dd") === dateStr).length,
      });
    }
    return days;
  }, [placements, replacements]);

  const kpiCards = [
    { label: "Total Leads", value: stats.total, icon: ClipboardList, color: "text-primary" },
    { label: "New Placements", value: stats.totalPlacements, icon: Users, color: "text-blue-600" },
    { label: "Replacements", value: stats.totalReplacements, icon: TrendingUp, color: "text-indigo-600" },
    { label: "Hot Leads", value: stats.hot, icon: Flame, color: "text-destructive" },
    { label: "In-progress", value: stats.inProgress, icon: Clock, color: "text-orange-500" },
    { label: "Won", value: stats.won, icon: Trophy, color: "text-green-600" },
    { label: "Lost", value: stats.lost, icon: XCircle, color: "text-muted-foreground" },
    { label: "Conversion Rate", value: `${stats.conversionRate}%`, icon: TrendingUp, color: "text-green-600" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {kpiCards.map((c) => (
          <Card key={c.label} className="shadow-sm">
            <CardContent className="flex flex-col items-center p-3 text-center">
              <c.icon className={`h-6 w-6 mb-1 ${c.color}`} />
              <p className="text-xl font-bold leading-none">{c.value}</p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{c.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lead Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Priority Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {priorityData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Ageing */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-1">
              <AlertTriangle className="h-4 w-4 text-orange-500" /> Lead Ageing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={ageingData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" name="Leads" radius={[4, 4, 0, 0]}>
                  {ageingData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Sales Person Performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Sales Person Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={salesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                <Tooltip />
                <Legend />
                <Bar dataKey="won" name="Won" fill={COLORS.won} stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="inProgress" name="In-progress" fill={COLORS.inProgress} stackId="a" />
                <Bar dataKey="total" name="Total" fill={COLORS.cold} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Lead Intake (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="placements" name="Placements" stroke={COLORS.placement} strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="replacements" name="Replacements" stroke={COLORS.replacement} strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SummaryDashboard;
