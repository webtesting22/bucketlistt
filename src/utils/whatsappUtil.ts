export const SendWhatsappMessage = async (body: any) => {
  // Get the WhatsApp auth key from Supabase Edge Function
const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://uaptkggmrsxoqayjjnlz.supabase.co";
  const secretsResponse = await fetch(
    `${supabaseUrl}/functions/v1/get-secrets`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
    }
  );

  const secrets = await secretsResponse.json();
  const authKey = secrets.whatsappAuth;

  if (!authKey) {
    throw new Error("WhatsApp auth key not available");
  }

  const response = await fetch(
    "https://console.authkey.io/restapi/requestjson_v2.0.php",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authKey}`,
      },
      body: JSON.stringify(body),
    }
  );

  return response.json();
};
