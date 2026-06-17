import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactPayload {
  name?: string;
  email?: string;
  phone?: string;
  interest?: string;
  message?: string;
}

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Methode nicht erlaubt." }, 405);
  }

  try {
    const body = (await req.json()) as ContactPayload;
    const name = body.name?.trim() ?? "";
    const email = body.email?.trim() ?? "";
    const phone = body.phone?.trim() ?? "";
    const interest = body.interest?.trim() || "beratung";
    const message = body.message?.trim() ?? "";

    if (!name) {
      return jsonResponse({ error: "Bitte geben Sie Ihren Namen ein." }, 400);
    }

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return jsonResponse({ error: "Bitte geben Sie eine gültige E-Mail ein." }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("Supabase-Umgebungsvariablen fehlen.");
      return jsonResponse({ error: "Server ist nicht konfiguriert." }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { error: insertError } = await supabase.from("contact_inquiries").insert({
      name,
      email,
      phone: phone || null,
      interest,
      message: message || null,
    });

    if (insertError) {
      console.error("DB insert failed:", insertError.message);
      return jsonResponse({ error: "Anfrage konnte nicht gespeichert werden." }, 500);
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error(error);
    return jsonResponse({ error: "Unerwarteter Fehler beim Senden." }, 500);
  }
});
