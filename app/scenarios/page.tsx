import { Suspense } from "react";
import ScenarioMapPage from "@/components/ScenarioMapPage";

export default function ScenariosPage() {
  return (
    <Suspense fallback={null}>
      <ScenarioMapPage />
    </Suspense>
  );
}
