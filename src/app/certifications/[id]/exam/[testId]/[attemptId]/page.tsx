import { ExamShell } from "@/components/exam/exam-shell";

type Props = {
  params: Promise<{ id: string; testId: string; attemptId: string }>;
};

export default async function ActiveExamPage({ params }: Props) {
  const { id: certId, testId, attemptId } = await params;
  return <ExamShell certId={certId} testId={testId} attemptId={attemptId} />;
}
