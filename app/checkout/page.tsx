import { redirect } from "next/navigation";

export default function CheckoutRedirect({
  searchParams,
}: {
  searchParams: { username?: string };
}) {
  const username = searchParams.username;
  redirect(username ? `/buy?username=${encodeURIComponent(username)}` : "/buy");
}
