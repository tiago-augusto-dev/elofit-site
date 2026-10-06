import { AuthTemplate } from "@/components/templates/AuthTemplate";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthTemplate>{children}</AuthTemplate>;
}
