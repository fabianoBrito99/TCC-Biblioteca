import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const API_BASE =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE ||
  "https://api.helenaramazzotte.online";

const APP_ORIGIN =
  process.env.APP_ORIGIN || "https://app.helenaramazzotte.online";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

type RouteContext = {
  params: Promise<{ path?: string[] }>;
};

async function proxy(req: NextRequest, context: RouteContext) {
  const { path = [] } = await context.params;
  const pathname = `/api/${path.join("/")}`;
  const target = new URL(pathname, API_BASE);
  target.search = req.nextUrl.search;

  const token = (await cookies()).get("token")?.value;
  const headers = new Headers(req.headers);

  for (const header of HOP_BY_HOP_HEADERS) {
    headers.delete(header);
  }

  headers.delete("cookie");
  headers.delete("authorization");
  // Same-origin GET requests usually do not include Origin. The API deliberately
  // rejects originless production requests, so identify this trusted proxy.
  headers.set("origin", APP_ORIGIN);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const method = req.method.toUpperCase();
  const hasBody = !["GET", "HEAD"].includes(method);
  const response = await fetch(target, {
    method,
    headers,
    body: hasBody ? await req.arrayBuffer() : undefined,
    cache: "no-store",
  });

  const responseHeaders = new Headers(response.headers);
  for (const header of HOP_BY_HOP_HEADERS) {
    responseHeaders.delete(header);
  }
  responseHeaders.delete("access-control-allow-origin");
  responseHeaders.delete("x-powered-by");
  responseHeaders.set("Cache-Control", "no-store");

  const proxyResponse = new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });

  if (response.status === 401) {
    proxyResponse.cookies.delete("token");
    proxyResponse.cookies.delete("tipo_usuario");
  }

  return proxyResponse;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
