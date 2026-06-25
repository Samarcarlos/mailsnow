import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { verifyTransaction } from "@/lib/flutterwave";
import { prisma } from "@/lib/prisma";
import { createEmailAccount, DOMAIN } from "@/lib/cpanel";
import Link from "next/link";

interface Props {
  searchParams: Promise<{
    transaction_id?: string;
    tx_ref?: string;
    status?: string;
  }>;
}

export default async function SuccessPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { transaction_id, tx_ref, status } = await searchParams;

  if (!["successful", "completed"].includes(status ?? "") || !transaction_id || !tx_ref) {
    return <FailPage message="Payment was not completed. Please try again." />;
  }

  // Verify with Flutterwave
  let tx: Awaited<ReturnType<typeof verifyTransaction>>;
  try {
    tx = await verifyTransaction(transaction_id);
    if (!["successful", "completed"].includes(tx.status)) return <FailPage message="Payment verification failed." />;
  } catch {
    return <FailPage message="Could not verify payment. Contact support if amount was deducted." />;
  }

  const meta = tx.meta ?? {};
  const bundleTxRef = meta.bundleTxRef as string ?? tx_ref;
  const slotsRaw = meta.slots as string | undefined;

  if (!slotsRaw) {
    return <FailPage message="Order data missing. Please contact support." />;
  }

  const slots: Array<{ username: string; passwordPlain: string }> = JSON.parse(slotsRaw);
  const plan = await prisma.plan.findFirst({ where: { slug: "standard" } });
  if (!plan) return <FailPage message="Plan not found." />;

  const results: Array<{
    emailAddress: string;
    passwordPlain: string;
    alreadyExisted: boolean;
  }> = [];

  for (const slot of slots) {
    const perSlotRef = `${bundleTxRef}-${slot.username}`;
    const order = await prisma.order.findUnique({ where: { flwTxRef: perSlotRef } });
    if (!order || order.userId !== session.user!.id) continue;

    const emailAddress = `${slot.username}@${DOMAIN}`;

    if (order.status === "COMPLETED") {
      results.push({ emailAddress, passwordPlain: slot.passwordPlain, alreadyExisted: true });
      continue;
    }

    const quotaMb = plan.storageGb * 1024;
    try {
      await createEmailAccount({ localPart: slot.username, password: slot.passwordPlain, quotaMb });
    } catch {
      // may already exist from webhook
    }

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
        update: {},
      }),
      prisma.order.update({
        where: { id: order.id },
        data: { status: "COMPLETED", flwTransactionId: transaction_id },
      }),
    ]);

    results.push({ emailAddress, passwordPlain: slot.passwordPlain, alreadyExisted: false });
  }

  if (results.length === 0) {
    return <FailPage message="No accounts were provisioned. Please contact support." />;
  }

  const imapHost = process.env.NEXT_PUBLIC_IMAP_HOST ?? `mail.${DOMAIN}`;
  const smtpHost = process.env.NEXT_PUBLIC_SMTP_HOST ?? `mail.${DOMAIN}`;
  const webmailUrl = process.env.NEXT_PUBLIC_WEBMAIL_URL ?? `https://webmail.${DOMAIN}`;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {results.length === 1 ? "Your email is ready!" : `${results.length} emails are ready!`}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Save your credentials below — passwords won&apos;t be shown again.</p>
        </div>

        {/* Credentials for each email */}
        {results.map((r, i) => (
          <div key={r.emailAddress} className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
            {results.length > 1 && (
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                Email #{i + 1}
              </p>
            )}
            <CredRow label="Email address" value={r.emailAddress} />
            <CredRow label="Password" value={r.passwordPlain} highlight />
          </div>
        ))}

        {/* Warning + privacy note */}
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3 mb-3">
          ⚠ Save all passwords now — they will not be shown again after you leave this page.
        </div>
        <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl px-4 py-3 mb-4">
          🔐 Your {results.length > 1 ? "emails are" : "email is"} completely private. No one else can access{" "}
          {results.length > 1 ? "these inboxes" : "this inbox"} — only the person who knows the password.
        </div>

        {/* Connection settings (same for all) */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <h2 className="font-semibold mb-3">Connection settings (same for all emails)</h2>
          <CredRow label="Webmail URL" value={webmailUrl} link={webmailUrl} />
          <CredRow label="IMAP Host" value={imapHost} />
          <CredRow label="IMAP Port" value="993 (SSL/TLS)" />
          <CredRow label="SMTP Host" value={smtpHost} />
          <CredRow label="SMTP Port" value="587 (STARTTLS)" />
        </div>

        <div className="flex gap-3">
          <Link
            href="/dashboard"
            className="flex-1 text-center bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
          >
            Go to my accounts
          </Link>
          <a
            href={webmailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center border border-blue-600 text-blue-600 py-3 rounded-xl font-semibold hover:bg-blue-50"
          >
            Open webmail
          </a>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.querySelectorAll('.copy-btn').forEach(btn => {
              btn.addEventListener('click', () => {
                navigator.clipboard.writeText(btn.dataset.copy || '').then(() => {
                  const orig = btn.textContent;
                  btn.textContent = 'Copied!';
                  setTimeout(() => { btn.textContent = orig; }, 1500);
                });
              });
            });
          `,
        }}
      />
    </div>
  );
}

function CredRow({
  label,
  value,
  link,
  highlight,
}: {
  label: string;
  value: string;
  link?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-3 py-2.5 border-b border-gray-100 last:border-0 ${highlight ? "bg-amber-50 rounded-lg px-2 -mx-2" : ""}`}>
      <span className="text-xs text-gray-500 shrink-0 w-28">{label}</span>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm font-mono text-blue-600 flex-1 truncate hover:underline">
          {value}
        </a>
      ) : (
        <span className={`text-sm font-mono flex-1 truncate ${highlight ? "text-amber-900 font-semibold" : "text-gray-900"}`}>
          {value}
        </span>
      )}
      <button data-copy={value} className="copy-btn shrink-0 text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50">
        Copy
      </button>
    </div>
  );
}

function FailPage({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-sm w-full text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">Payment failed</h1>
        <p className="text-gray-500 text-sm mb-6">{message}</p>
        <Link href="/checkout" className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700">
          Try again
        </Link>
      </div>
    </div>
  );
}
