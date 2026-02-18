import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LeadPriority } from "@/types/leads";

const PriorityBadge = ({ priority }: { priority: LeadPriority }) => {
  const colors: Record<LeadPriority, string> = {
    Hot: "bg-destructive text-destructive-foreground",
    Warm: "bg-[hsl(38,92%,50%)] text-[hsl(0,0%,100%)]",
    Cold: "bg-[hsl(217,91%,60%)] text-[hsl(0,0%,100%)]",
  };
  return <Badge className={cn("text-xs", colors[priority])}>{priority}</Badge>;
};

export default PriorityBadge;
