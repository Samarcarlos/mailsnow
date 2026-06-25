import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { rateLimit, rateLimitResponse } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const { allowed } = rateLimit(`support:${ip}`, 5, 60_000);
  if (!allowed) return rateLimitResponse();

  const session = await auth();

  const body = await req.json() as {
    name?: string;
    email?: string;
    subject?: string;
    message?: string;
  };
  const { name, email, subject, message } = body;

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  await prisma.supportTicket.create({
    data: {
      name: name.trim().slice(0, 100),
      email: email.trim().toLowerCase().slice(0, 200),
      subject: subject.trim().slice(0, 200),
      message: message.trim().slice(0, 5000),
      userId: session?.user?.id ?? null,
    },
  });

  return NextResponse.json({ success: true });
}
