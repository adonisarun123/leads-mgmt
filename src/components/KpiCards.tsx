import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
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
    { label: `Total ${label}`, value: stats.total, icon: ClipboardList, color: "text-primary" },
    { label: "Hot Leads", value: stats.hot, icon: Flame, color: "text-destructive" },
    { label: "In-progress", value: stats.inProgress, icon: Clock, color: "text-orange-500" },
    { label: "Won", value: stats.won, icon: Trophy, color: "text-green-600" },
    { label: "Lost", value: stats.lost, icon: XCircle, color: "text-muted-foreground" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <Card key={c.label} className="shadow-sm">
          <CardContent className="flex items-center gap-3 p-4">
            <c.icon className={`h-8 w-8 shrink-0 ${c.color}`} />
            <div>
              <p className="text-2xl font-bold leading-none">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default KpiCards;
