import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { verifyTransaction } from "@/lib/flutterwave";
import { prisma } from "@/lib/prisma";
import { createEmailAccount, DOMAIN } from "@/lib/cpanel";
import Link from "next/link";

interface Props {
  searchParams: Promise<{ transaction_id?: string }>;
}

export default async function RecoverPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/dashboard/recover");

  const { transaction_id } = await searchParams;

  if (!transaction_id?.trim()) {
    return <RecoverForm />;
  }

  const txId = transaction_id.trim();

  let tx: Awaited<ReturnType<typeof verifyTransaction>>;
  try {
    tx = await verifyTransaction(txId);
    if (!["successful", "completed"].includes(tx.status)) {
      return <RecoverForm error="This transaction was not successful. Check the ID and try again." />;
    }
  } catch {
    return <RecoverForm error="Transaction not found. Double-check the ID from your Flutterwave receipt." />;
  }

  const meta = tx.meta ?? {};
  const bundleTxRef = meta.bundleTxRef as string | undefined;
  const slotsRaw = meta.slots as string | undefined;

  if (!bundleTxRef || !slotsRaw) {
    return <RecoverForm error="This transaction does not belong to Mailsnow. Check the ID and try again." />;
  }

  const slots: Array<{ username: string; passwordPlain: string }> = JSON.parse(slotsRaw);
  const plan = await prisma.plan.findFirst({ where: { slug: "standard" } });
  if (!plan) return <RecoverForm error="Internal error. Please contact support." />;

  const results: Array<{ emailAddress: string; passwordPlain: string; wasProvisioned: boolean }> = [];

  for (const slot of slots) {
    const perSlotRef = `${bundleTxRef}-${slot.username}`;
    const order = await prisma.order.findUnique({ where: { flwTxRef: perSlotRef } });

    if (!order) continue;
    if (order.userId !== session.user!.id) continue;

    const emailAddress = `${slot.username}@${DOMAIN}`;
    let wasProvisioned = false;

    if (order.status !== "COMPLETED") {
      const quotaMb = plan.storageGb * 1024;
      try {
        await createEmailAccount({ localPart: slot.username, password: slot.passwordPlain, quotaMb });
      } catch {
        // account may already exist on cPanel from a previous attempt
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
          data: { status: "COMPLETED", flwTransactionId: txId },
        }),
      ]);
      wasProvisioned = true;
    }

    results.push({ emailAddress, passwordPlain: slot.passwordPlain, wasProvisioned });
  }

  if (results.length === 0) {
    return (
      <RecoverForm error="No orders found for this transaction on your account. Make sure you are signed in with the same Google account used at checkout." />
    );
  }

  const webmailUrl = process.env.NEXT_PUBLIC_WEBMAIL_URL ?? `https://webmail.${DOMAIN}`;
  const imapHost = process.env.NEXT_PUBLIC_IMAP_HOST ?? `mail.${DOMAIN}`;
  const smtpHost = process.env.NEXT_PUBLIC_SMTP_HOST ?? `mail.${DOMAIN}`;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <nav className="mb-6">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">← Back to dashboard</Link>
        </nav>

        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Credentials recovered</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {results.some((r) => r.wasProvisioned)
              ? "Your email account has been set up. Save your credentials below."
              : "Your credentials are shown below. Save your password now."}
          </p>
        </div>

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

        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3 mb-3">
          ⚠ Save your password now — it cannot be retrieved again after you leave this page.
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-4">
          <h2 className="font-semibold mb-3">Connection settings</h2>
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

function RecoverForm({ error }: { error?: string }) {
  const webmailUrl = process.env.NEXT_PUBLIC_WEBMAIL_URL;
  void webmailUrl;
  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="max-w-lg mx-auto">
        <nav className="mb-6">
          <Link href="/dashboard" className="text-sm text-blue-600 hover:underline">← Back to dashboard</Link>
        </nav>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Recover your credentials</h1>
          <p className="text-gray-500 text-sm mb-6">
            Enter the transaction ID from your Flutterwave payment receipt to recover your email credentials.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form method="GET" action="/dashboard/recover">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Flutterwave Transaction ID
            </label>
            <input
              type="text"
              name="transaction_id"
              placeholder="e.g. 123456789"
              required
              className="w-full border-2 border-gray-400 rounded-lg px-3 py-3 text-gray-900 text-sm bg-white shadow-sm focus:outline-none focus:border-blue-500 mb-4"
            />
            <p className="text-xs text-gray-400 mb-5">
              Find this ID in the email receipt Flutterwave sent you after payment, or in your bank statement.
            </p>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700"
            >
              Recover credentials
            </button>
          </form>
        </div>
      </div>
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
    <div
      className={`flex items-center justify-between gap-3 py-2.5 border-b border-gray-100 last:border-0 ${
        highlight ? "bg-amber-50 rounded-lg px-2 -mx-2" : ""
      }`}
    >
      <span className="text-xs text-gray-500 shrink-0 w-28">{label}</span>
      {link ? (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-mono text-blue-600 flex-1 truncate hover:underline"
        >
          {value}
        </a>
      ) : (
        <span
          className={`text-sm font-mono flex-1 truncate ${
            highlight ? "text-amber-900 font-semibold" : "text-gray-900"
          }`}
        >
          {value}
        </span>
      )}
      <button
        data-copy={value}
        className="copy-btn shrink-0 text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50"
      >
        Copy
      </button>
    </div>
  );
}
