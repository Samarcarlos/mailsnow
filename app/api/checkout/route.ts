import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import { checkEmailExists } from "@/lib/cpanel";
import { getBundlePrice, PLANS } from "@/lib/plans";
import { validateUsername, validatePassword } from "@/lib/utils";
import { rateLimit, rateLimitResponse } from "@/lib/ratelimit";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

interface EmailSlot {
  username: string;
  password: string;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { allowed } = rateLimit(`checkout:${session.user.id}:${ip}`, 10, 60_000); // 10 checkouts/min
  if (!allowed) return rateLimitResponse();

  const body = await req.json();
  const { slots, billingType, qty } = body as {
    slots: EmailSlot[];
    billingType: "ONE_TIME" | "MONTHLY";
    qty: number;
  };

  if (!Array.isArray(slots) || slots.length === 0 || slots.length !== qty) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (!["ONE_TIME", "MONTHLY"].includes(billingType)) {
    return NextResponse.json({ error: "Invalid billing type" }, { status: 400 });
  }

  const domain = process.env.NEXT_PUBLIC_MAIL_DOMAIN!;

  // Validate all slots
  for (const slot of slots) {
    const uErr = validateUsername(slot.username?.toLowerCase().trim());
    if (uErr) return NextResponse.json({ error: `Username error: ${uErr}` }, { status: 400 });

    const pErr = validatePassword(slot.password);
    if (pErr) return NextResponse.json({ error: `Password error: ${pErr}` }, { status: 400 });
  }

  // Check availability of all usernames
  const cleanSlots = slots.map((s) => ({ ...s, username: s.username.toLowerCase().trim() }));
  for (const slot of cleanSlots) {
    const emailAddress = `${slot.username}@${domain}`;
    const inDb = await prisma.emailAccount.findUnique({ where: { emailAddress } });
    if (inDb) return NextResponse.json({ error: `${slot.username} is already taken` }, { status: 409 });
    const onServer = await checkEmailExists(slot.username).catch(() => false);
    if (onServer) return NextResponse.json({ error: `${slot.username} is already taken` }, { status: 409 });
  }

  // Get or create the standard plan in DB
  let dbPlan = await prisma.plan.findUnique({ where: { slug: "standard" } });
  if (!dbPlan) {
    const p = PLANS[0];
    dbPlan = await prisma.plan.create({
      data: {
        name: p.name,
        slug: p.slug,
        monthlyPriceKobo: p.monthlyPriceKobo,
        oneTimePriceKobo: p.oneTimePriceKobo,
        storageGb: p.storageGb,
        description: p.description,
      },
    });
  }

  const bundle = getBundlePrice(qty, billingType);
  const amountNaira = bundle.total / 100;
  const txRef = `mailnow-${uuidv4()}`;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    `${req.headers.get("x-forwarded-proto") ?? "https"}://${req.headers.get("x-forwarded-host") ?? req.headers.get("host")}`;

  // Hash all passwords and build meta
  const slotsWithHash = await Promise.all(
    cleanSlots.map(async (s) => ({
      username: s.username,
      passwordHash: await bcrypt.hash(s.password, 12),
      passwordPlain: s.password,
    }))
  );

  // Create one pending order per username
  const orders = await prisma.$transaction(
    slotsWithHash.map((s) =>
      prisma.order.create({
        data: {
          userId: session.user!.id!,
          planId: dbPlan.id,
          flwTxRef: `${txRef}-${s.username}`,
          billingType,
          status: "PENDING",
          amountKobo: Math.floor(bundle.total / qty),
          desiredUsername: s.username,
          desiredPasswordHash: s.passwordHash,
        },
      })
    )
  );

  const meta = {
    orderIds: orders.map((o) => o.id).join(","),
    bundleTxRef: txRef,
    slots: JSON.stringify(
      slotsWithHash.map((s) => ({ username: s.username, passwordPlain: s.passwordPlain }))
    ),
    qty: String(qty),
    billingType,
  };

  return NextResponse.json({
    publicKey: process.env.FLW_PUBLIC_KEY,
    txRef,
    amount: amountNaira,
    currency: "NGN",
    redirectUrl: `${appUrl}/buy/success`,
    customer: {
      email: session.user!.email!,
      name: session.user!.name ?? session.user!.email!,
    },
    customizations: {
      title: "Mailsnow",
      description: qty === 1 ? "1 Email Account" : `${qty} Email Accounts`,
      logo: `${appUrl}/logo.png`,
    },
    meta,
  });
}
