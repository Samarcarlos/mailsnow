import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature, verifyTransaction } from "@/lib/flutterwave";

export const dynamic = "force-dynamic";
import { createEmailAccount, DOMAIN } from "@/lib/cpanel";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("verif-hash") ?? "";
  if (!verifyWebhookSignature(signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = await req.json();
  if (event.event !== "charge.completed") {
    return NextResponse.json({ received: true });
  }

  const transactionId = String(event.data?.id);
  const txRef = event.data?.tx_ref as string;
  if (!txRef || !transactionId) return NextResponse.json({ received: true });

  await provisionBundle(transactionId, txRef);
  return NextResponse.json({ received: true });
}

export async function provisionBundle(transactionId: string, bundleTxRef: string) {
  // Verify with Flutterwave
  const tx = await verifyTransaction(transactionId);
  if (tx.status !== "successful") return;

  const meta = tx.meta ?? {};
  const slotsRaw = meta.slots as string | undefined;
  if (!slotsRaw) return;

  const slots: Array<{ username: string; passwordPlain: string }> = JSON.parse(slotsRaw);
  const plan = await prisma.plan.findUnique({ where: { slug: "standard" } });
  if (!plan) return;

  for (const slot of slots) {
    const perSlotRef = `${bundleTxRef}-${slot.username}`;
    const order = await prisma.order.findUnique({ where: { flwTxRef: perSlotRef } });
    if (!order || order.status === "COMPLETED") continue; // idempotent

    const quotaMb = plan.storageGb * 1024;
    const emailAddress = `${slot.username}@${DOMAIN}`;

    try {
      await createEmailAccount({
        localPart: slot.username,
        password: slot.passwordPlain,
        quotaMb,
      });

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
          data: { status: "COMPLETED", flwTransactionId: transactionId },
        }),
      ]);
    } catch (err) {
      console.error(`Failed to provision ${slot.username}:`, err);
      await prisma.order.update({
        where: { id: order.id },
        data: { status: "FAILED", flwTransactionId: transactionId },
      });
    }
  }
}
