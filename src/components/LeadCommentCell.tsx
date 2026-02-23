import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, Pencil, Save, X } from "lucide-react";

interface LeadCommentCellProps {
  leadId: string;
  comment: string | null;
  canEdit: boolean;
  onSave: (id: string, comment: string) => void;
}

const LeadCommentCell = ({ leadId, comment, canEdit, onSave }: LeadCommentCellProps) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment ?? "");

  const handleSave = () => {
    onSave(leadId, draft);
    setEditing(false);
  };

  const handleCancel = () => {
    setDraft(comment ?? "");
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="text-xs min-h-[60px] resize-none"
          placeholder="Add a comment..."
          autoFocus
        />
        <div className="flex items-center gap-1.5">
          <Button size="sm" variant="default" className="h-7 text-xs gap-1.5 px-3" onClick={handleSave}>
            <Save className="h-3 w-3" /> Save
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5 px-3" onClick={handleCancel}>
            <X className="h-3 w-3" /> Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2">
      <MessageSquare className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      {comment ? (
        <p className="text-xs text-foreground whitespace-pre-wrap break-words flex-1">{comment}</p>
      ) : (
        <p className="text-xs text-muted-foreground italic flex-1">No comment yet</p>
      )}
      {canEdit && (
        <Button
          size="sm"
          variant="outline"
          className="h-6 text-[10px] gap-1 px-2 shrink-0"
          onClick={() => {
            setDraft(comment ?? "");
            setEditing(true);
          }}
        >
          <Pencil className="h-3 w-3" /> Edit
        </Button>
      )}
    </div>
  );
};

export default LeadCommentCell;
