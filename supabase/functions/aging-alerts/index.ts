import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get replacements older than 7 days that are still in-progress
    const { data: replacements, error } = await supabase
      .from("replacements")
      .select("*")
      .eq("lead_status", "In-progress");

    if (error) throw error;

    const now = new Date();
    const alerts: { id: string; area: string; apartment: string; age: number; sales_person: string }[] = [];

    for (const r of replacements || []) {
      const age = Math.floor((now.getTime() - new Date(r.lead_in_date).getTime()) / (1000 * 60 * 60 * 24));
      if (age >= 8) {
        alerts.push({ id: r.id, area: r.area, apartment: r.apartment, age, sales_person: r.sales_person });
      }
    }

    if (alerts.length === 0) {
      return new Response(JSON.stringify({ message: "No aging alerts", count: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all admin users to notify
    const { data: admins } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin")
      .eq("approved", true);

    // Create in-app notifications for each admin
    const notifications = (admins || []).flatMap((admin) =>
      alerts.map((alert) => ({
        user_id: admin.user_id,
        title: `Aging Alert: ${alert.area}`,
        message: `Replacement for ${alert.apartment} is ${alert.age} days old (${alert.sales_person})`,
        type: "aging_alert",
        entity_type: "replacements",
        entity_id: alert.id,
      }))
    );

    if (notifications.length > 0) {
      await supabase.from("notifications").insert(notifications);
    }

    return new Response(
      JSON.stringify({ message: `Created ${notifications.length} notifications for ${alerts.length} aging leads`, alerts }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Aging alerts error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
