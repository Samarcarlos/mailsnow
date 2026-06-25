import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateTOTPSecret, generateTOTPUri } from "@/lib/totp";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = generateTOTPSecret();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorSecret: secret },
  });

  const otpauthUrl = generateTOTPUri(
    session.user.email ?? session.user.id,
    secret,
    "Mailsnow"
  );

  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

  return NextResponse.json({ secret, qrCodeDataUrl });
}
