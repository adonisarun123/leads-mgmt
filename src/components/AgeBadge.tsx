import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { differenceInDays } from "date-fns";

const AgeBadge = ({ leadInDate }: { leadInDate: string }) => {
  const days = differenceInDays(new Date(), new Date(leadInDate));
  const color =
    days <= 3
      ? "bg-[hsl(142,71%,45%)] text-[hsl(0,0%,100%)]"
      : days <= 7
        ? "bg-[hsl(38,92%,50%)] text-[hsl(0,0%,100%)]"
        : "bg-destructive text-destructive-foreground";

  return <Badge className={cn("text-xs", color)}>{days} day{days !== 1 ? "s" : ""}</Badge>;
};

export default AgeBadge;
