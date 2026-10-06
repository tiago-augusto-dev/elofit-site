import { WorkoutForm } from "@/features/training/WorkoutForm";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ aluno?: string }>;
}) {
  return <WorkoutForm studentId={(await searchParams).aluno} />;
}
