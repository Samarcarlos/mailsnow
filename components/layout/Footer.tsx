import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-900 text-gray-400 text-sm py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <span className="text-white font-bold text-lg">Mailsnow</span>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              Affordable personal email addresses that work on any device.
            </p>
          </div>
          <div>
            <p className="text-gray-300 font-semibold mb-3 text-xs uppercase tracking-wide">Product</p>
            <ul className="space-y-2">
              <li><Link href="/#pricing" className="hover:text-white transition">Pricing</Link></li>
              <li><Link href="/checkout" className="hover:text-white transition">Buy an email</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition">My accounts</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-gray-300 font-semibold mb-3 text-xs uppercase tracking-wide">Support</p>
            <ul className="space-y-2">
              <li><Link href="/faq" className="hover:text-white transition">FAQ</Link></li>
              <li>
                <a href="mailto:support@mailsnow.live" className="hover:text-white transition">
                  Contact us
                </a>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-gray-300 font-semibold mb-3 text-xs uppercase tracking-wide">Legal</p>
            <ul className="space-y-2">
              <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p>© {year} Mailsnow. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-600">🔒 Secured by Flutterwave</span>
            <span className="text-xs text-gray-600">🛡 SSL encrypted</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
