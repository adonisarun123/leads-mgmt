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
    { label: `Total ${label}`, value: stats.total, icon: ClipboardList, accent: "primary" as const, iconBg: "bg-primary/15 text-primary" },
    { label: "Hot Leads", value: stats.hot, icon: Flame, accent: "destructive" as const, iconBg: "bg-destructive/15 text-destructive" },
    { label: "In-progress", value: stats.inProgress, icon: Clock, accent: "warning" as const, iconBg: "bg-warning/15 text-warning" },
    { label: "Won", value: stats.won, icon: Trophy, accent: "success" as const, iconBg: "bg-success/15 text-success" },
    { label: "Lost", value: stats.lost, icon: XCircle, accent: "muted" as const, iconBg: "bg-muted text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 gap-2.5 mb-4 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div key={c.label} className={`kpi-card kpi-card--${c.accent}`}>
          <div className={`inline-flex items-center justify-center rounded-lg p-1.5 sm:p-2 mb-1.5 sm:mb-2 ${c.iconBg}`}>
            <c.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </div>
          <p className="text-xl sm:text-2xl font-bold tracking-tight leading-none">{c.value}</p>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1 font-medium">{c.label}</p>
        </div>
      ))}
    </div>
  );
};

export default KpiCards;
