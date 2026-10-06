import { AuthForm } from "@/features/auth/AuthForm";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return <AuthForm mode="activate" token={(await searchParams).token} />;
}
