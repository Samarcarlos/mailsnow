import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/ratelimit";
import { sendPasswordResetEmail } from "@/lib/email";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { allowed } = rateLimit(`forgot-password:${ip}`, 3, 60_000);
  if (!allowed) return rateLimitResponse();

  const { email } = await req.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalised = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalised } });

  // Always return 200 to prevent email enumeration
  if (!user || !user.passwordHash) {
    return NextResponse.json({ ok: true });
  }

  const token = randomUUID();
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Delete any existing reset token for this email
  await prisma.verificationToken.deleteMany({
    where: { identifier: `reset:${normalised}` },
  });

  await prisma.verificationToken.create({
    data: { identifier: `reset:${normalised}`, token, expires },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://mailsnow.live";
  const resetUrl = `${appUrl}/reset-password?token=${token}&email=${encodeURIComponent(normalised)}`;

  try {
    await sendPasswordResetEmail(normalised, resetUrl);
  } catch (err) {
    console.error("Failed to send reset email:", err);
    return NextResponse.json({ error: "Failed to send email. Please try again later." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
