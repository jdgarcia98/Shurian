import { NextResponse } from "next/server";
import { getTiendanubeCredentials, fetchTiendanubeProducts } from "@/services/tiendanube";

export async function GET() {
  const { storeId, accessToken, userAgent } = getTiendanubeCredentials();

  if (!storeId || !accessToken) {
    return NextResponse.json({
      configured: false,
      storeId: storeId || null,
      hasAccessToken: Boolean(accessToken),
      message: "Falta configurar TIENDANUBE_STORE_ID o TIENDANUBE_ACCESS_TOKEN",
      instructions: "Ingresa tus credenciales en el panel de /admin o autoriza con OAuth en /api/tiendanube/authorize",
    });
  }

  try {
    const url = `https://api.tiendanube.com/v1/${storeId}/products?per_page=5`;
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authentication: `bearer ${accessToken}`,
        "User-Agent": userAgent,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json({
        configured: true,
        connected: false,
        status: res.status,
        statusText: res.statusText,
        error: errText,
        storeId,
        message: "Tiendanube rechazó las credenciales. Verifica que el Store ID y el Access Token sean correctos.",
      });
    }

    const data = await res.json();
    const count = Array.isArray(data) ? data.length : 0;

    return NextResponse.json({
      configured: true,
      connected: true,
      storeId,
      sampleProductsFound: count,
      firstProduct: count > 0 ? (data[0].name?.es || data[0].name) : null,
      message: "¡Conexión exitosa con Tiendanube! El catálogo está listo.",
    });
  } catch (error: any) {
    return NextResponse.json({
      configured: true,
      connected: false,
      error: error.message,
    });
  }
}
