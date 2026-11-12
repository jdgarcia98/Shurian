import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { clearTiendanubeCache } from "@/services/tiendanube";

async function registerWebhook(storeId: number | string, token: string, event: string, webhookUrl: string, userAgent: string) {
  try {
    const res = await fetch(`https://api.tiendanube.com/v1/${storeId}/webhooks`, {
      method: "POST",
      headers: {
        Authentication: `bearer ${token}`,
        "User-Agent": userAgent,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event,
        url: webhookUrl,
      }),
    });
    const data = await res.json();
    return { event, ok: res.ok, data };
  } catch (err: any) {
    return { event, ok: false, error: err.message };
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDesc = searchParams.get("error_description");

  if (error || !code) {
    return NextResponse.json(
      { success: false, error: error || "Missing code", description: errorDesc },
      { status: 400 }
    );
  }

  const clientId = process.env.TIENDANUBE_CLIENT_ID || "23086";
  const clientSecret = process.env.TIENDANUBE_CLIENT_SECRET || "7238310964cf7cb52df768a2a8059862e55e109e2d14ed76";
  const userAgent = process.env.TIENDANUBE_USER_AGENT || "Shurian (contacto@shurian.com.ar)";

  try {
    // 1. Exchange authorization code for access token
    const tokenRes = await fetch("https://www.tiendanube.com/apps/authorize/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": userAgent,
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error("[Tiendanube Callback] Token exchange failed:", tokenRes.status, errBody);
      return NextResponse.json(
        { success: false, error: "Failed to exchange token", details: errBody },
        { status: tokenRes.status }
      );
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    const storeId = tokenData.user_id;

    // Set process.env in runtime
    process.env.TIENDANUBE_STORE_ID = String(storeId);
    process.env.TIENDANUBE_ACCESS_TOKEN = accessToken;

    // Persist to tmp/runtime settings
    try {
      const TMP_SETTINGS_PATH = path.join("/tmp", "shurian_tiendanube.json");
      fs.writeFileSync(
        TMP_SETTINGS_PATH,
        JSON.stringify({ storeId, accessToken, connectedAt: new Date().toISOString() }, null, 2)
      );
    } catch (e) {}

    // Clear cache
    clearTiendanubeCache();

    // 2. Automatically register webhooks pointing to Shurian
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://shurian.vercel.app";
    const webhookEndpoint = `${baseUrl}/api/webhooks/tiendanube`;

    const eventsToRegister = [
      "product/created",
      "product/updated",
      "product/deleted",
      "order/created",
    ];

    const webhookResults = [];
    for (const ev of eventsToRegister) {
      const res = await registerWebhook(storeId, accessToken, ev, webhookEndpoint, userAgent);
      webhookResults.push(res);
    }

    // Return HTML confirmation page with credentials info for easy copy/paste into Vercel
    const htmlResponse = `
      <!DOCTYPE html>
      <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Tiendanube Conectada con Éxito</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
            .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 580px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
            h1 { color: #22c55e; margin-top: 0; font-size: 24px; display: flex; align-items: center; gap: 8px; }
            p { color: #94a3b8; line-height: 1.6; }
            .box { background: #0f172a; border-radius: 8px; padding: 16px; margin: 16px 0; font-family: monospace; font-size: 14px; color: #38bdf8; word-break: break-all; }
            .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; transition: background 0.2s; }
            .btn:hover { background: #2563eb; }
            .badge { display: inline-block; background: #065f46; color: #6ee7b7; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="badge">CONEXIÓN EXITOSA</div>
            <h1>¡Tiendanube Vinculada!</h1>
            <p>Tu catálogo de Tiendanube y tu web de Shurian ahora están sincronizados en tiempo real mediante webhooks.</p>
            
            <p><strong>Datos generados:</strong></p>
            <div class="box">
              <strong>TIENDANUBE_STORE_ID:</strong> ${storeId}<br><br>
              <strong>TIENDANUBE_ACCESS_TOKEN:</strong><br>${accessToken}
            </div>

            <p style="font-size: 13px; color: #cbd5e1;">
              💡 <em>Para que persista permanentemente en tus deploys de Vercel, copia estas dos variables en los Environment Variables de tu proyecto en Vercel.</em>
            </p>

            <a class="btn" href="/admin">Volver al Panel de Administración</a>
          </div>
        </body>
      </html>
    `;

    return new NextResponse(htmlResponse, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error: any) {
    console.error("[Tiendanube Callback] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during auth callback", details: error.message },
      { status: 500 }
    );
  }
}
