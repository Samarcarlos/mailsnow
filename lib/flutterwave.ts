const SECRET_KEY = process.env.FLW_SECRET_KEY!;
const BASE = "https://api.flutterwave.com/v3";

const headers = {
  Authorization: `Bearer ${SECRET_KEY}`,
  "Content-Type": "application/json",
};

export interface InitPaymentParams {
  txRef: string;
  amount: number;        // in Naira (NOT kobo)
  currency: string;      // "NGN"
  redirectUrl: string;
  customerEmail: string;
  customerName: string;
  planName: string;
  meta: Record<string, string>;
}

export async function initPayment(params: InitPaymentParams) {
  const res = await fetch(`${BASE}/payments`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      tx_ref: params.txRef,
      amount: params.amount,
      currency: params.currency,
      redirect_url: params.redirectUrl,
      customer: {
        email: params.customerEmail,
        name: params.customerName,
      },
      customizations: {
        title: "Mailnow",
        description: `${params.planName} Email Account`,
        logo: `${process.env.NEXT_PUBLIC_APP_URL}/logo.png`,
      },
      meta: params.meta,
    }),
  });
  if (!res.ok) throw new Error(`Flutterwave initPayment error: ${res.status}`);
  const data = await res.json();
  if (data.status !== "success") throw new Error(`Flutterwave error: ${data.message}`);
  return data.data as { link: string };
}

export async function verifyTransaction(transactionId: string) {
  const res = await fetch(`${BASE}/transactions/${transactionId}/verify`, { headers });
  if (!res.ok) throw new Error(`Flutterwave verify error: ${res.status}`);
  const data = await res.json();
  return data.data as {
    status: string;       // "successful" | "failed" | "pending"
    amount: number;
    currency: string;
    tx_ref: string;
    id: number;
    meta: Record<string, string>;
  };
}

export async function searchTransactionByRef(txRef: string) {
  const res = await fetch(`${BASE}/transactions?tx_ref=${encodeURIComponent(txRef)}`, { headers });
  if (!res.ok) throw new Error(`Flutterwave search error: ${res.status}`);
  const data = await res.json();
  if (data.status !== "success" || !Array.isArray(data.data) || data.data.length === 0) {
    throw new Error("Transaction not found");
  }
  return data.data[0] as { id: number; status: string; meta: Record<string, string> };
}

export function verifyWebhookSignature(signature: string): boolean {
  return signature === process.env.FLW_SECRET_HASH;
}
