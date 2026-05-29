import { Suspense } from "react";
import { notFound } from "next/navigation";
import ScenarioDetailPage from "@/components/ScenarioDetailPage";
import { getScenarioBySlug } from "@/lib/scenario-map";

interface ScenarioPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function ScenarioPage({ params }: ScenarioPageProps) {
  const { slug } = await params;

  if (!getScenarioBySlug(slug)) {
    notFound();
  }

  return (
    <Suspense fallback={null}>
      <ScenarioDetailPage slug={slug} />
    </Suspense>
  );
}
