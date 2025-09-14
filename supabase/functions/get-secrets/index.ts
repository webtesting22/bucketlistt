import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const whatsappAuth = Deno.env.get("WHATSAPP_AUTH");
    const groqAuthKey = Deno.env.get("GROQ_AUTH_KEY");

    const secrets = {
      whatsappAuth,
      groqAuthKey,
    };

    return new Response(JSON.stringify(secrets), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting secrets:", error);
    return new Response(JSON.stringify({ error: "Failed to get secrets" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
