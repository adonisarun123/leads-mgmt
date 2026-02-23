import { supabase } from "@/integrations/supabase/client";

type LogAction = 
  | "create" | "update" | "delete"
  | "login" | "logout"
  | "approve_user" | "revoke_user" | "change_role" | "reset_password";

interface LogParams {
  action: LogAction;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

export const logActivity = async ({ action, entityType, entityId, details }: LogParams) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    await supabase.from("activity_logs").insert([{
      user_id: session.user.id,
      action,
      entity_type: entityType,
      entity_id: entityId ?? null,
      details: (details ?? {}) as any,
    }]);
  } catch (e) {
    console.error("Failed to log activity:", e);
  }
};
