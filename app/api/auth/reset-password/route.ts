import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/ratelimit";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { allowed } = rateLimit(`reset-password:${ip}`, 5, 60_000);
  if (!allowed) return rateLimitResponse();

  const { token, email, password } = await req.json();
  if (!token || !email || !password) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const normalised = String(email).toLowerCase().trim();

  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: `reset:${normalised}`, token: String(token) } },
  });

  if (!record || record.expires < new Date()) {
    return NextResponse.json({ error: "This link has expired. Please request a new one." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({ where: { email: normalised }, data: { passwordHash } });
  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: `reset:${normalised}`, token: String(token) } },
  });

  return NextResponse.json({ ok: true });
}
