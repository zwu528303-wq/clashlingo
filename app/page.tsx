import type { Metadata } from "next";
import LandingPage from "@/components/LandingPage";

export const metadata: Metadata = {
  title: "ClashLingo | Scenario-based language practice",
  description:
    "Practice real-life language scenarios, clear timed stages, and keep friend rivalries for weekly competition.",
};

export default function Home() {
  return <LandingPage />;
}
