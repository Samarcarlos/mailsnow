import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { searchTransactionByRef, verifyTransaction } from "@/lib/flutterwave";
import { createEmailAccount, DOMAIN } from "@/lib/cpanel";

export async function POST(req: NextRequest) {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!session?.user?.id || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderId, passwordPlain: manualPassword } = await req.json();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  let resolvedPassword: string;

  if (manualPassword) {
    resolvedPassword = manualPassword;
  } else {
    const bundleTxRef = order.flwTxRef.slice(
      0,
      order.flwTxRef.lastIndexOf(`-${order.desiredUsername}`)
    );

    let tx: Awaited<ReturnType<typeof verifyTransaction>>;
    try {
      const found = await searchTransactionByRef(bundleTxRef);
      tx = await verifyTransaction(String(found.id));
    } catch {
      return NextResponse.json({ error: "Transaction not found on Flutterwave", needsPassword: true }, { status: 404 });
    }

    if (!["successful", "completed"].includes(tx.status)) {
      return NextResponse.json({ error: "Transaction not successful" }, { status: 400 });
    }

    const slotsRaw = (tx.meta ?? {}).slots;
    if (!slotsRaw) return NextResponse.json({ error: "No slots in transaction meta", needsPassword: true }, { status: 400 });

    const slots: Array<{ username: string; passwordPlain: string }> = JSON.parse(slotsRaw);
    const slot = slots.find((s) => s.username === order.desiredUsername);
    if (!slot) return NextResponse.json({ error: "Username not found in payment meta", needsPassword: true }, { status: 404 });

    resolvedPassword = slot.passwordPlain;
  }

  const emailAddress = `${order.desiredUsername}@${DOMAIN}`;
  const plan = await prisma.plan.findFirst({ where: { slug: "standard" } });
  const quotaMb = plan ? plan.storageGb * 1024 : 5120;

  try {
    await createEmailAccount({ localPart: order.desiredUsername, password: resolvedPassword, quotaMb });
  } catch { /* may already exist on cPanel */ }

  // If emailAddress already has an EmailAccount (duplicate order), just mark this order COMPLETED
  const existing = await prisma.emailAccount.findUnique({ where: { emailAddress } });
  if (existing) {
    await prisma.order.update({ where: { id: order.id }, data: { status: "COMPLETED" } });
  } else {
    await prisma.$transaction([
      prisma.emailAccount.create({
        data: {
          userId: order.userId,
          planId: order.planId,
          orderId: order.id,
          emailAddress,
          status: "ACTIVE",
          quotaMb,
        },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { status: "COMPLETED" },
      }),
    ]);
  }

  return NextResponse.json({ email: emailAddress, password: resolvedPassword });
}
