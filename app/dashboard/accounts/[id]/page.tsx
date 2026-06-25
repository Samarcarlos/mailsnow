import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AccountDetailPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const account = await prisma.emailAccount.findFirst({
    where: { id, userId: session.user.id },
    include: { plan: true },
  });
  if (!account) notFound();

  const imapHost = process.env.NEXT_PUBLIC_IMAP_HOST ?? "mail.yourdomain.com";
  const smtpHost = process.env.NEXT_PUBLIC_SMTP_HOST ?? "mail.yourdomain.com";
  const webmailUrl = process.env.NEXT_PUBLIC_WEBMAIL_URL ?? "#";

  const settings = [
    { label: "Your email address", value: account.emailAddress },
    { label: "Webmail URL", value: webmailUrl, link: webmailUrl },
    { label: "IMAP server", value: imapHost },
    { label: "IMAP port", value: "993" },
    { label: "IMAP security", value: "SSL / TLS" },
    { label: "SMTP server", value: smtpHost },
    { label: "SMTP port", value: "587" },
    { label: "SMTP security", value: "STARTTLS" },
    { label: "Username", value: account.emailAddress },
    { label: "Password", value: "(the password you set at checkout)" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-800">
            ← Back to my accounts
          </Link>
          <Link href="/" className="text-xl font-bold text-blue-600">Mailsnow</Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-1">{account.emailAddress}</h1>
        <p className="text-gray-400 text-sm mb-8">
          {account.plan.name} · {account.plan.storageGb} GB ·{" "}
          <span className={account.status === "ACTIVE" ? "text-green-600" : "text-red-600"}>
            {account.status}
          </span>
        </p>

        {/* Webmail */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold mb-3">Option 1 — Use in browser (Webmail)</h2>
          <p className="text-sm text-gray-500 mb-4">
            Visit the webmail URL in any browser on your phone or PC. Sign in with your email and password.
          </p>
          <a
            href={webmailUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-700"
          >
            Open webmail →
          </a>
        </section>

        {/* IMAP/SMTP setup */}
        <section className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold mb-1">Option 2 — Add to Gmail App / Outlook / Apple Mail</h2>
          <p className="text-sm text-gray-500 mb-4">
            In your mail app: <strong>Add Account → Other / IMAP</strong> → use the settings below.
          </p>
          <div className="divide-y divide-gray-100">
            {settings.map((s) => (
              <div key={s.label} className="flex items-center justify-between py-3 gap-4">
                <span className="text-xs text-gray-500 w-36 shrink-0">{s.label}</span>
                {s.link ? (
                  <a
                    href={s.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-mono text-blue-600 flex-1 truncate hover:underline"
                  >
                    {s.value}
                  </a>
                ) : (
                  <span className="text-sm font-mono text-gray-800 flex-1 truncate">{s.value}</span>
                )}
                <button
                  data-copy={s.value}
                  className="copy-btn text-xs text-blue-600 border border-blue-200 rounded px-2 py-1 hover:bg-blue-50 shrink-0"
                >
                  Copy
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Phone guide */}
        <section className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <h2 className="font-semibold mb-3 text-blue-900">Step-by-step: Gmail App on Android / iPhone</h2>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Open the <strong>Gmail app</strong></li>
            <li>Tap your profile photo → <strong>Add another account</strong></li>
            <li>Choose <strong>Other</strong> (not Google, Apple, or Outlook)</li>
            <li>Enter your email: <strong>{account.emailAddress}</strong></li>
            <li>Choose <strong>Personal (IMAP)</strong></li>
            <li>Enter your password</li>
            <li>
              IMAP settings: <strong>{imapHost}</strong> / Port <strong>993</strong> / Security: <strong>SSL/TLS</strong>
            </li>
            <li>
              SMTP settings: <strong>{smtpHost}</strong> / Port <strong>587</strong> / Security: <strong>STARTTLS</strong>
            </li>
            <li>Tap <strong>Next</strong> — your email is now in Gmail!</li>
          </ol>
        </section>
      </div>

      {/* Copy-to-clipboard script */}
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
