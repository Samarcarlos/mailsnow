import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/ratelimit";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { allowed } = rateLimit(`pre-check:${ip}`, 10, 60_000);
  if (!allowed) return rateLimitResponse();

  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });

  if (!user?.passwordHash) {
    // Still do a dummy compare to prevent timing attacks
    await bcrypt.compare(String(password), "$2b$12$dummy.hash.for.timing.attack.prevention.padding");
    return NextResponse.json({ success: false }, { status: 401 });
  }

  const valid = await bcrypt.compare(String(password), user.passwordHash);
  if (!valid) {
    return NextResponse.json({ success: false }, { status: 401 });
  }

  return NextResponse.json({ success: true, needs2FA: user.twoFactorEnabled });
}
