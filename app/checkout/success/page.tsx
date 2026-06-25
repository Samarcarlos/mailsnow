import { redirect } from "next/navigation";

export default function SuccessRedirect({
  searchParams,
}: {
  searchParams: { transaction_id?: string; tx_ref?: string; status?: string };
}) {
  const params = new URLSearchParams();
  if (searchParams.transaction_id) params.set("transaction_id", searchParams.transaction_id);
  if (searchParams.tx_ref) params.set("tx_ref", searchParams.tx_ref);
  if (searchParams.status) params.set("status", searchParams.status);
  redirect(`/buy/success?${params.toString()}`);
}
