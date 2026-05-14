import { NextResponse } from "next/server";

import { getTopRoutes, RoutingValidationError } from "@/lib/router";
import type { RoutingRequest } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RoutingRequest;
    const response = await getTopRoutes(body);

    return NextResponse.json(response);
  } catch (error) {
    const status = error instanceof RoutingValidationError ? error.status : 500;
    const message =
      error instanceof Error ? error.message : "Unable to calculate routes.";

    return NextResponse.json({ error: message }, { status });
  }
}
