import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const account = await prisma.emailAccount.findFirst({
    where: { id, userId: session.user.id },
    include: { plan: true },
  });

  if (!account) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...account,
    connectionSettings: {
      imap: {
        host: process.env.NEXT_PUBLIC_IMAP_HOST,
        port: 993,
        security: "SSL/TLS",
        username: account.emailAddress,
      },
      smtp: {
        host: process.env.NEXT_PUBLIC_SMTP_HOST,
        port: 587,
        security: "STARTTLS",
        username: account.emailAddress,
      },
      webmail: process.env.NEXT_PUBLIC_WEBMAIL_URL,
    },
  });
}
