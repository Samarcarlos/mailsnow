import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkEmailExists } from "@/lib/cpanel";

export const dynamic = "force-dynamic";
import { validateUsername } from "@/lib/utils";
import { rateLimit, rateLimitResponse } from "@/lib/ratelimit";

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { allowed } = rateLimit(`availability:${ip}`, 30, 60_000); // 30 checks/min per IP
  if (!allowed) return rateLimitResponse();

  const username = req.nextUrl.searchParams.get("username")?.toLowerCase().trim();

  if (!username) {
    return NextResponse.json({ available: false, reason: "missing" }, { status: 400 });
  }

  const error = validateUsername(username);
  if (error) {
    return NextResponse.json({ available: false, reason: "invalid", message: error });
  }

  const domain = process.env.NEXT_PUBLIC_MAIL_DOMAIN!;
  const emailAddress = `${username}@${domain}`;

  // Check local DB first (faster)
  const existing = await prisma.emailAccount.findUnique({
    where: { emailAddress },
  });
  if (existing) {
    return NextResponse.json({ available: false, reason: "taken" });
  }

  // Double-check against live cPanel
  try {
    const existsOnServer = await checkEmailExists(username);
    if (existsOnServer) {
      return NextResponse.json({ available: false, reason: "taken" });
    }
  } catch {
    // cPanel unreachable — trust DB result
  }

  return NextResponse.json({ available: true, email: emailAddress });
}
