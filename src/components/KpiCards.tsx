import { useMemo } from "react";
import { ClipboardList, Flame, Trophy, XCircle, Clock } from "lucide-react";
import type { NewPlacement, Replacement } from "@/types/leads";

interface KpiCardsProps {
  data: (NewPlacement | Replacement)[];
  label: string;
}

const KpiCards = ({ data, label }: KpiCardsProps) => {
  const stats = useMemo(() => {
    const total = data.length;
    const hot = data.filter((d) => d.lead_priority === "Hot").length;
    const inProgress = data.filter((d) => d.lead_status === "In-progress").length;
    const won = data.filter((d) => d.lead_status === "Won").length;
    const lost = data.filter((d) => d.lead_status === "Lost").length;
    return { total, hot, inProgress, won, lost };
  }, [data]);

  const cards = [
    { label: `Total ${label}`, value: stats.total, icon: ClipboardList, iconBg: "bg-primary/15 text-primary", gradient: "from-primary/10 to-primary/5" },
    { label: "Hot Leads", value: stats.hot, icon: Flame, iconBg: "bg-destructive/15 text-destructive", gradient: "from-destructive/10 to-destructive/5" },
    { label: "In-progress", value: stats.inProgress, icon: Clock, iconBg: "bg-orange-500/15 text-orange-600", gradient: "from-orange-500/10 to-orange-500/5" },
    { label: "Won", value: stats.won, icon: Trophy, iconBg: "bg-emerald-500/15 text-emerald-600", gradient: "from-emerald-500/10 to-emerald-500/5" },
    { label: "Lost", value: stats.lost, icon: XCircle, iconBg: "bg-muted text-muted-foreground", gradient: "from-muted/50 to-muted/20" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className={`kpi-card bg-gradient-to-br ${c.gradient}`}>
          <div className={`inline-flex items-center justify-center rounded-lg p-2 mb-2 ${c.iconBg}`}>
            <c.icon className="h-4 w-4" />
          </div>
          <p className="text-2xl font-bold tracking-tight leading-none">{c.value}</p>
          <p className="text-[11px] text-muted-foreground mt-1 font-medium">{c.label}</p>
        </div>
      ))}
    </div>
  );
};

export default KpiCards;
