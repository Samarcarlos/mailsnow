import Link from "next/link";
import Footer from "@/components/layout/Footer";

const faqs = [
  {
    category: "Getting started",
    items: [
      {
        q: "What is Mailsnow?",
        a: "Mailsnow is a service that lets you buy your own personal email address — for example, yourname@mailsnow.live. Once purchased, you can use it on any phone, PC, or email app just like Gmail or Yahoo Mail.",
      },
      {
        q: "What email address will I get?",
        a: "You choose your own username during checkout. Your email will follow the format username@mailsnow.live (or whatever our domain is). You can check availability before paying.",
      },
      {
        q: "How quickly do I get my email after paying?",
        a: "Instantly. Your email account is created automatically as soon as your payment is confirmed — usually within seconds. You will see your credentials on the confirmation page right after payment.",
      },
    ],
  },
  {
    category: "Accessing your email",
    items: [
      {
        q: "How do I use my email on my phone?",
        a: "You have two options: (1) Open the webmail link we give you in any browser — this works on any phone or PC without installing anything. (2) Add your email to the Gmail app, Apple Mail, Outlook, or any other mail app using the IMAP settings we provide. Both options are free.",
      },
      {
        q: "Can I use it with the Gmail app?",
        a: "Yes. Open the Gmail app → tap your profile photo → Add another account → choose Other (not Google) → enter your email address and password → enter our IMAP/SMTP server settings. Your Mailsnow inbox will then appear inside Gmail alongside your other accounts.",
      },
      {
        q: "Can I use it on both my phone and PC at the same time?",
        a: "Yes. IMAP sync means all your devices stay in sync. Emails you read on your phone are marked as read on your PC, and vice versa. You can be logged in on as many devices as you want simultaneously.",
      },
      {
        q: "What are the IMAP and SMTP server settings?",
        a: "After purchase you will see the full settings on your confirmation page and in your dashboard. In general: IMAP — mail.yourdomain.com, port 993, SSL/TLS. SMTP — mail.yourdomain.com, port 587, STARTTLS. Your username is your full email address.",
      },
    ],
  },
  {
    category: "Privacy & security",
    items: [
      {
        q: "Is my email private? Can anyone else read it?",
        a: "Yes, completely private. Each mailbox is isolated — only the person who knows your password can access your inbox. Other customers of Mailsnow cannot read your emails. Even we (Mailsnow) do not routinely access customer mailboxes.",
      },
      {
        q: "I set my own password — is that safe?",
        a: "Yes. Your password goes directly to our mail server, which stores it in encrypted form. We never log or permanently store your plaintext password. After the confirmation page, even we cannot retrieve your password — which is why we display it once and ask you to save it.",
      },
      {
        q: "Can someone else register my email address?",
        a: "No. Once you purchase an email address, it is permanently reserved for you. Nobody else can ever register the same address again, even if your account is inactive.",
      },
      {
        q: "What if I forget my password?",
        a: "You can request a password reset from your dashboard. We will reset the mailbox password to a new one of your choosing. Your emails are not deleted when you reset your password.",
      },
    ],
  },
  {
    category: "Payment & billing",
    items: [
      {
        q: "What payment methods are accepted?",
        a: "We accept debit/credit cards, bank transfers, and mobile money through Flutterwave — one of Africa's most trusted payment platforms. All transactions are encrypted and secure.",
      },
      {
        q: "What is the difference between one-time and monthly payment?",
        a: "One-time means you pay once and keep the email forever — no further charges. Monthly means you pay a smaller amount each month and can cancel at any time. If you cancel a monthly plan, your email will remain active until the end of the billing period.",
      },
      {
        q: "Can I buy multiple email addresses?",
        a: "Yes. On the checkout page you can select 1, 3, 5, or 10 email addresses in one order. Buying more gives you a discount — up to 15% off for 10 emails. Each email gets its own unique username and password.",
      },
      {
        q: "Is there a refund policy?",
        a: "Because email accounts are digital products that are provisioned instantly, we generally do not offer refunds after the account has been created. If there is a technical problem and your account was not created, we will either fix it immediately or issue a full refund. See our Terms of Service for full details.",
      },
    ],
  },
  {
    category: "Technical questions",
    items: [
      {
        q: "Can I send and receive emails from this address?",
        a: "Yes. Your email account is fully functional — you can send emails, receive emails, use folders, attachments, and everything you expect from a standard email account.",
      },
      {
        q: "Is there a storage limit?",
        a: "Each email account includes 10 GB of storage. This is more than enough for most users. If you need more, contact our support team.",
      },
      {
        q: "Can I change my email username after purchase?",
        a: "No — email usernames cannot be changed after purchase, as the address is tied to your identity and any emails already sent to it. Choose your username carefully. You can always purchase a new email address if you want a different name.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-blue-600">Mailsnow</Link>
          <Link href="/checkout" className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700">
            Buy an email
          </Link>
        </div>
      </nav>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Frequently Asked Questions</h1>
        <p className="text-gray-500 mb-10">
          Can&apos;t find your answer?{" "}
          <a href="mailto:support@mailsnow.live" className="text-blue-600 hover:underline">
            Contact our support team
          </a>
          .
        </p>

        <div className="space-y-10">
          {faqs.map((section) => (
            <div key={section.category}>
              <h2 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-gray-200">
                {section.category}
              </h2>
              <div className="space-y-4">
                {section.items.map((item) => (
                  <details
                    key={item.q}
                    className="bg-white rounded-xl border border-gray-200 group"
                  >
                    <summary className="px-5 py-4 cursor-pointer font-medium text-gray-800 select-none list-none flex items-center justify-between gap-4">
                      <span>{item.q}</span>
                      <span className="text-gray-400 text-lg group-open:rotate-45 transition-transform shrink-0">+</span>
                    </summary>
                    <div className="px-5 pb-4 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-3">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
          <p className="font-semibold text-gray-800 mb-1">Still have questions?</p>
          <p className="text-gray-500 text-sm mb-4">Our support team usually replies within a few hours.</p>
          <a
            href="mailto:support@mailsnow.live"
            className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700"
          >
            Email us
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
}
