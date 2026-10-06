import { VerifyEmail } from "@/features/auth/VerifyEmail";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return <VerifyEmail token={(await searchParams).token ?? ""} />;
}
