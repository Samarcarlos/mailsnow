import Link from "next/link";
import Footer from "@/components/layout/Footer";

const EFFECTIVE_DATE = "1 January 2025";
const SUPPORT_EMAIL = "support@mailnow.com";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">Mailnow</Link>
          <Link href="/checkout" className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700">
            Buy an email
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Effective date: {EFFECTIVE_DATE}</p>

        <div className="space-y-8 text-gray-700 text-sm leading-relaxed">

          <p className="text-base text-gray-600">
            At Mailnow, your privacy is important to us. This policy explains what information we collect,
            how we use it, and how we protect it.
          </p>

          <Section title="1. Information We Collect">
            <p><strong>Account information:</strong> When you register, we collect your name (optional) and
            email address. We store your account password as a secure hash — never in plaintext.</p>
            <p className="mt-2"><strong>Purchase information:</strong> When you buy an email account, we record
            the username you chose, the plan you purchased, the amount paid, and the transaction reference.
            We do not store your card details — payment is processed entirely by Flutterwave.</p>
            <p className="mt-2"><strong>Email mailbox data:</strong> The contents of your email inbox (messages,
            attachments) are stored on our mail servers in your private, isolated mailbox. We do not read,
            scan, or share the contents of your emails.</p>
            <p className="mt-2"><strong>Usage data:</strong> We may collect basic server logs including IP
            addresses and request timestamps for security monitoring and abuse prevention.</p>
          </Section>

          <Section title="2. How We Use Your Information">
            <ul className="list-disc list-inside space-y-1">
              <li>To create and manage your account and email mailboxes</li>
              <li>To process payments and send purchase confirmations</li>
              <li>To respond to your support requests</li>
              <li>To detect and prevent fraud, abuse, or security threats</li>
              <li>To send important service notifications (e.g. billing reminders)</li>
            </ul>
            <p className="mt-2">
              We do not sell your personal information. We do not use your data for advertising.
            </p>
          </Section>

          <Section title="3. Information Sharing">
            <p>We share your information only with the third parties necessary to provide the service:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>
                <strong>Flutterwave</strong> — payment processor. Your payment details are handled
                entirely by Flutterwave under their own privacy policy. We receive only a transaction
                reference and status from them.
              </li>
              <li>
                <strong>Our mail hosting provider (cPanel reseller host)</strong> — your email mailbox
                is hosted on a third-party server. They provide the infrastructure but do not have
                access to your credentials or the authority to access your mailbox content under
                normal operations.
              </li>
              <li>
                <strong>Supabase</strong> — our database provider. Your account and order data is stored
                in their secure PostgreSQL database under their data protection terms.
              </li>
            </ul>
            <p className="mt-3">
              We may also disclose information if required by law, court order, or to protect the safety
              of our users or the public.
            </p>
          </Section>

          <Section title="4. Data Retention">
            <p>
              We retain your account information and order history for as long as your account is active,
              or as required by law. If you close your account, we will delete your personal data within
              90 days, except where retention is required for legal or financial compliance.
            </p>
            <p className="mt-2">
              Email messages in your mailbox are retained until you delete them or your account is closed.
            </p>
          </Section>

          <Section title="5. Your Rights">
            <p>You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li><strong>Access</strong> — request a copy of the personal data we hold about you</li>
              <li><strong>Correction</strong> — request correction of inaccurate information</li>
              <li><strong>Deletion</strong> — request deletion of your account and personal data</li>
              <li><strong>Portability</strong> — request your data in a portable format</li>
            </ul>
            <p className="mt-2">
              To exercise any of these rights, contact us at{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 hover:underline">{SUPPORT_EMAIL}</a>.
              We will respond within 30 days.
            </p>
          </Section>

          <Section title="6. Security">
            <p>We protect your data using the following measures:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>All data is transmitted over HTTPS (SSL/TLS encryption)</li>
              <li>Account passwords are hashed using bcrypt — never stored in plaintext</li>
              <li>Email mailbox passwords are stored encrypted on the mail server</li>
              <li>Rate limiting is applied to all authentication and purchase endpoints</li>
              <li>Security headers are enforced on all web responses</li>
              <li>Strict access controls limit who can access production systems</li>
            </ul>
            <p className="mt-2">
              No system is 100% secure. In the unlikely event of a data breach, we will notify affected
              users within 72 hours of becoming aware of it.
            </p>
          </Section>

          <Section title="7. Cookies">
            <p>
              We use only essential session cookies required for authentication (e.g. keeping you logged
              in to your Mailnow account). We do not use advertising cookies, tracking pixels, or
              third-party analytics.
            </p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>
              Our service is not directed at children under 13. We do not knowingly collect personal
              information from children under 13. If you believe a child has provided us with their
              information, please contact us and we will delete it promptly.
            </p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant
              changes by email or by posting a notice on our website. Continued use of the service
              after changes take effect means you accept the updated policy.
            </p>
          </Section>

          <Section title="10. Contact Us">
            <p>
              If you have questions or concerns about this Privacy Policy or how we handle your data,
              please contact us at:{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 hover:underline">
                {SUPPORT_EMAIL}
              </a>
            </p>
          </Section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-base font-bold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
