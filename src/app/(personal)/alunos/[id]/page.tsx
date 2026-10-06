import { StudentProfile } from "@/features/students/StudentProfile";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <StudentProfile id={(await params).id} />;
}
