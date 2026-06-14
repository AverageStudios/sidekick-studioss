import { NextResponse } from "next/server";

export async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export function logRouteError(scope: string, error: unknown) {
  console.error(`[${scope}]`, error instanceof Error ? error.message : "Unexpected route error");
}

