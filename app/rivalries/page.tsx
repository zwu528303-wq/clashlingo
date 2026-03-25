import { Suspense } from "react";
import RivalryDashboard from "@/components/RivalryDashboard";

export default function RivalriesPage() {
  return (
    <Suspense fallback={null}>
      <RivalryDashboard />
    </Suspense>
  );
}
