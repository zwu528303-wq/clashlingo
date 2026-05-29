import { notFound } from "next/navigation";
import BattleReportPage from "@/components/BattleReportPage";

interface BattleReportRoutePageProps {
  params: Promise<{
    sessionId?: string;
  }>;
}

export default async function BattleReportRoutePage({
  params,
}: BattleReportRoutePageProps) {
  const { sessionId } = await params;
  if (!sessionId) {
    notFound();
  }

  return <BattleReportPage sessionId={sessionId} />;
}

