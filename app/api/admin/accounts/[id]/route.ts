import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { deleteEmailAccount } from "@/lib/cpanel";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const account = await prisma.emailAccount.findUnique({ where: { id } });
  if (!account) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [localPart] = account.emailAddress.split("@");

  await deleteEmailAccount(localPart);
  await prisma.emailAccount.update({
    where: { id },
    data: { status: "DELETED" },
  });

  return NextResponse.json({ success: true });
}
