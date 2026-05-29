import { notFound } from "next/navigation";
import StageBriefingPage from "@/components/StageBriefingPage";
import { isStageNumber } from "@/lib/scenario-types";

interface StagePageProps {
  params: Promise<{
    slug: string;
    stage: string;
  }>;
}

export default async function StagePage({ params }: StagePageProps) {
  const { slug, stage } = await params;
  const parsedStage = Number(stage);

  if (!isStageNumber(parsedStage)) {
    notFound();
  }

  return <StageBriefingPage slug={slug} stage={parsedStage} />;
}
