import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, X } from "lucide-react";

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (val: string[]) => void;
  placeholder?: string;
}

const MultiSelect = ({ options, selected, onChange, placeholder = "Select..." }: MultiSelectProps) => {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter((s) => s !== opt) : [...selected, opt]);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between font-normal">
          {selected.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {selected.map((s) => (
                <Badge key={s} variant="secondary" className="text-xs">
                  {s}
                  <X
                    className="ml-1 h-3 w-3 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle(s);
                    }}
                  />
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-2" align="start">
        {options.map((opt) => (
          <label key={opt} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-accent">
            <Checkbox checked={selected.includes(opt)} onCheckedChange={() => toggle(opt)} />
            <span className="text-sm">{opt}</span>
          </label>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default MultiSelect;
