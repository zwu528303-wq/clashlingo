import { notFound } from "next/navigation";
import ScenarioExamLandingPage from "@/components/ScenarioExamLandingPage";
import { isStageNumber } from "@/lib/scenario-types";

interface ScenarioExamPageProps {
  params: Promise<{
    slug: string;
    stage: string;
  }>;
}

export default async function ScenarioExamPage({
  params,
}: ScenarioExamPageProps) {
  const { slug, stage } = await params;
  const parsedStage = Number(stage);

  if (!isStageNumber(parsedStage)) {
    notFound();
  }

  return <ScenarioExamLandingPage slug={slug} stage={parsedStage} />;
}
