import Link from "next/link";
import Footer from "@/components/layout/Footer";

const EFFECTIVE_DATE = "1 January 2025";
const SUPPORT_EMAIL = "support@mailsnow.live";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">Mailsnow</Link>
          <Link href="/buy" className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700">
            Buy an email
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-10">Effective date: {EFFECTIVE_DATE}</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 text-sm leading-relaxed">

          <Section title="1. Acceptance of Terms">
            <p>
              By creating an account or purchasing any product from Mailsnow (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or
              &ldquo;our&rdquo;), you agree to be bound by these Terms of Service. If you do not agree with any
              part of these terms, you must not use our service. We may update these terms at any time;
              continued use of the service after updates means you accept the revised terms.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              Mailsnow provides personal email accounts hosted on our mail servers. After purchasing an
              email address, you receive a fully functional mailbox accessible via webmail, IMAP, and SMTP.
              You are responsible for all activity that occurs under your account.
            </p>
          </Section>

          <Section title="3. Account Registration">
            <p>To purchase an email account, you must:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Provide a valid email address for your Mailsnow account</li>
              <li>Create a secure password for your Mailsnow account</li>
              <li>Be at least 13 years old, or have parental consent if younger</li>
              <li>Provide accurate and truthful information</li>
            </ul>
            <p className="mt-2">
              You are responsible for maintaining the confidentiality of your account credentials and for
              all activities that occur under your account.
            </p>
          </Section>

          <Section title="4. Acceptable Use">
            <p>You may use your Mailsnow email account only for lawful purposes. You must NOT use the service to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Send spam, unsolicited bulk email, or phishing messages</li>
              <li>Distribute viruses, malware, or any harmful software</li>
              <li>Harass, threaten, or harm other individuals</li>
              <li>Violate any applicable law or regulation</li>
              <li>Impersonate any person or organisation</li>
              <li>Engage in fraudulent transactions or illegal activities</li>
              <li>Attempt to gain unauthorised access to other accounts or systems</li>
            </ul>
            <p className="mt-2">
              Violation of this section will result in immediate account suspension or termination without
              refund. We reserve the right to report illegal activity to relevant authorities.
            </p>
          </Section>

          <Section title="5. Payment and Billing">
            <p>
              All payments are processed securely through Flutterwave. By completing a purchase, you
              authorise us to charge the stated amount to your chosen payment method.
            </p>
            <p className="mt-2">
              <strong>One-time payments:</strong> You pay once and your email account remains active
              indefinitely as long as you comply with these terms. There are no recurring charges.
            </p>
            <p className="mt-2">
              <strong>Monthly subscriptions:</strong> You authorise recurring charges on your billing cycle.
              You may cancel at any time from your dashboard. Cancellation takes effect at the end of the
              current billing period — your account remains active until then.
            </p>
            <p className="mt-2">
              Prices are displayed in Nigerian Naira (₦). We reserve the right to change prices with
              30 days&apos; notice. Existing one-time customers are not affected by price changes.
            </p>
          </Section>

          <Section title="6. Refund Policy">
            <p>
              Because email accounts are digital products that are provisioned instantly upon payment,
              <strong> all sales are generally final and non-refundable</strong>.
            </p>
            <p className="mt-2">Exceptions — we will issue a full refund if:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Your email account was not created due to a technical error on our side</li>
              <li>You were charged but received no confirmation of account creation</li>
              <li>You request a refund within 24 hours of purchase and have not yet used the account</li>
            </ul>
            <p className="mt-2">
              To request a refund, contact us at <a href={`mailto:${SUPPORT_EMAIL}`} className="text-blue-600 hover:underline">{SUPPORT_EMAIL}</a> with
              your order details.
            </p>
          </Section>

          <Section title="7. Account Suspension and Termination">
            <p>We may suspend or terminate your account immediately, without notice, if you:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Violate the Acceptable Use policy (Section 4)</li>
              <li>Provide false information during registration</li>
              <li>Engage in fraudulent payment activity</li>
              <li>Fail to pay for a monthly subscription</li>
            </ul>
            <p className="mt-2">
              Upon termination, your email address and all stored messages may be permanently deleted.
              We will make reasonable efforts to notify you before termination unless immediate action is
              required to protect the service or other users.
            </p>
          </Section>

          <Section title="8. Privacy">
            <p>
              Your use of Mailsnow is also governed by our{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>,
              which is incorporated into these Terms by reference.
            </p>
          </Section>

          <Section title="9. Disclaimer of Warranties">
            <p>
              The service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind.
              We do not guarantee that the service will be uninterrupted, error-free, or completely
              secure. We make reasonable efforts to maintain uptime and security, but cannot guarantee
              100% availability.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, Mailsnow shall not be liable for any indirect,
              incidental, special, consequential, or punitive damages, including loss of data, loss of
              revenue, or loss of business, arising from your use of or inability to use the service.
              Our total liability to you shall not exceed the amount you paid us in the 3 months
              preceding the claim.
            </p>
          </Section>

          <Section title="11. Changes to This Agreement">
            <p>
              We may update these Terms at any time. We will notify registered users of material changes
              via email. Your continued use of the service after the effective date of any changes
              constitutes acceptance of the updated Terms.
            </p>
          </Section>

          <Section title="12. Contact Us">
            <p>
              If you have questions about these Terms, please contact us at:{" "}
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
