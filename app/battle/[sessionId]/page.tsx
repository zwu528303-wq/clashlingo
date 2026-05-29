import { notFound } from "next/navigation";
import BattlePage from "@/components/BattlePage";

interface BattleRoutePageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function BattleRoutePage({
  params,
}: BattleRoutePageProps) {
  const { sessionId } = await params;

  if (!sessionId) {
    notFound();
  }

  return <BattlePage sessionId={sessionId} />;
}
