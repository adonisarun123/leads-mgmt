import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/types/leads";

const StatusBadge = ({ status }: { status: LeadStatus }) => {
  const colors: Record<LeadStatus, string> = {
    "In-progress": "bg-[hsl(38,92%,50%)] text-[hsl(0,0%,100%)]",
    "Won": "bg-[hsl(142,71%,45%)] text-[hsl(0,0%,100%)]",
    "Lost": "bg-destructive text-destructive-foreground",
  };
  return <Badge className={cn("text-xs", colors[status])}>{status}</Badge>;
};

export default StatusBadge;
