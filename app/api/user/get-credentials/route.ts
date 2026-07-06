import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { searchTransactionByRef, verifyTransaction } from "@/lib/flutterwave";
import { createEmailAccount, DOMAIN } from "@/lib/cpanel";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order || order.userId !== session.user.id) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const bundleTxRef = order.flwTxRef.slice(
    0,
    order.flwTxRef.lastIndexOf(`-${order.desiredUsername}`)
  );

  let tx: Awaited<ReturnType<typeof verifyTransaction>>;
  try {
    const found = await searchTransactionByRef(bundleTxRef);
    tx = await verifyTransaction(String(found.id));
  } catch {
    return NextResponse.json({ error: "Transaction not found. Please contact support." }, { status: 404 });
  }

  if (!["successful", "completed"].includes(tx.status)) {
    return NextResponse.json({ error: "Payment was not completed." }, { status: 400 });
  }

  const slotsRaw = (tx.meta ?? {}).slots;
  if (!slotsRaw) return NextResponse.json({ error: "Credentials not found in payment data." }, { status: 400 });

  const slots: Array<{ username: string; passwordPlain: string }> = JSON.parse(slotsRaw);
  const slot = slots.find((s) => s.username === order.desiredUsername);
  if (!slot) return NextResponse.json({ error: "Account not found in payment data." }, { status: 404 });

  const emailAddress = `${slot.username}@${DOMAIN}`;
  const plan = await prisma.plan.findFirst({ where: { slug: "standard" } });
  const quotaMb = plan ? plan.storageGb * 1024 : 5120;

  if (order.status !== "COMPLETED") {
    try {
      await createEmailAccount({ localPart: slot.username, password: slot.passwordPlain, quotaMb });
    } catch { /* may already exist */ }

    await prisma.$transaction([
      prisma.emailAccount.upsert({
        where: { orderId: order.id },
        create: {
          userId: order.userId,
          planId: order.planId,
          orderId: order.id,
          emailAddress,
          status: "ACTIVE",
          quotaMb,
        },
        update: { status: "ACTIVE" },
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { status: "COMPLETED", flwTransactionId: String(tx.id) },
      }),
    ]);
  }

  return NextResponse.json({
    email: emailAddress,
    password: slot.passwordPlain,
    webmail: process.env.NEXT_PUBLIC_WEBMAIL_URL ?? `https://webmail.${DOMAIN}`,
  });
}
