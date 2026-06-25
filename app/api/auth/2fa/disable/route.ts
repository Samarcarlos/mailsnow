import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { verifyTOTPToken } from "@/lib/totp";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.twoFactorEnabled || !user?.twoFactorSecret) {
    return NextResponse.json({ error: "2FA is not enabled" }, { status: 400 });
  }

  if (!verifyTOTPToken(user.twoFactorSecret, code)) {
    return NextResponse.json({ error: "Invalid code. Please try again." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  return NextResponse.json({ ok: true });
}
