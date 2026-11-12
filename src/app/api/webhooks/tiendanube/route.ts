import { NextRequest, NextResponse } from "next/server";
import { clearTiendanubeCache } from "@/services/tiendanube";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    let payload: any = {};
    try {
      payload = JSON.parse(rawBody);
    } catch (e) {
      // payload might be form-urlencoded or empty
    }

    const eventHeader = request.headers.get("x-linkedstore-hmac-sha256") || request.headers.get("x-event");
    console.log(`[Tiendanube Webhook] Received event:`, {
      eventHeader,
      productId: payload?.id,
      event: payload?.event,
    });

    // Invalidate local memory cache so the next catalog request gets fresh data
    clearTiendanubeCache();

    return NextResponse.json({
      success: true,
      message: "Webhook processed and cache invalidated",
      receivedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("[Tiendanube Webhook] Error processing event:", error);
    // Still return 200 so Tiendanube doesn't block webhooks
    return NextResponse.json({ success: true, error: error.message });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    endpoint: "/api/webhooks/tiendanube",
    message: "Tiendanube Webhook Listener is active and healthy",
  });
}
