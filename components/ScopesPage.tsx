"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ArrowRight,
} from "lucide-react";
import { resolveDisplayName } from "@/lib/profile";

interface ScopeRound {
  id: string;
  round_number: number;
  status: string;
  topic: string | null;
  target_lang: string | null;
  rivalry_id: string;
  rivalName: string;
  syllabus: Record<string, unknown> | null;
}

const STATUS_LABEL: Record<string, string> = {
  topic_selection: "Topic Selection",
  confirming: "Confirming",
  countdown: "Countdown",
  exam_ready: "Exam Ready",
  exam_live: "Live",
  completed: "Completed",
};

const STATUS_COLOR: Record<string, string> = {
  topic_selection: "bg-yellow-100 text-yellow-800",
  confirming: "bg-yellow-100 text-yellow-800",
  countdown: "bg-orange-100 text-orange-800",
  exam_ready: "bg-blue-100 text-blue-800",
  exam_live: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-600",
};

const ACTIVE_STATUSES = ["topic_selection", "confirming", "countdown", "exam_ready", "exam_live"];

export default function ScopesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [scopes, setScopes] = useState<ScopeRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [langFilter, setLangFilter] = useState<string>("All");

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);
      await loadScopes(user.id);
      setLoading(false);
    };
    init();
  }, [router]);

  const loadScopes = async (uid: string) => {
    // Fetch all rivalries the user belongs to
    const { data: rivalries } = await supabase
      .from("rivalries")
      .select("id, player_a_id, player_b_id")
      .or(`player_a_id.eq.${uid},player_b_id.eq.${uid}`);

    if (!rivalries || rivalries.length === 0) { setScopes([]); return; }

    // Collect rival user IDs to fetch display names
    const rivalIdMap: Record<string, string> = {};
    for (const r of rivalries) {
      const rivalId = r.player_a_id === uid ? r.player_b_id : r.player_a_id;
      if (rivalId) rivalIdMap[r.id] = rivalId;
    }

    const uniqueRivalIds = [...new Set(Object.values(rivalIdMap))];
    const nameMap: Record<string, string> = {};
    if (uniqueRivalIds.length > 0) {
      const { data: profiles } = await supabase
        .from("users")
        .select("id, display_name")
        .in("id", uniqueRivalIds);
      if (profiles) {
        for (const p of profiles) {
          nameMap[p.id] = resolveDisplayName(p.display_name, "Rival");
        }
      }
    }

    const rivalryIds = rivalries.map((r) => r.id);

    // Fetch all rounds for these rivalries
    const { data: rounds } = await supabase
      .from("rounds")
      .select("id, round_number, status, topic, target_lang, rivalry_id, syllabus")
      .in("rivalry_id", rivalryIds)
      .order("created_at", { ascending: false });

    if (!rounds || rounds.length === 0) { setScopes([]); return; }

    // A scope should appear as soon as the syllabus exists, not only after an exam record is created.
    const roundsWithSyllabus = rounds.filter((r) => r.topic && r.syllabus);

    const built: ScopeRound[] = roundsWithSyllabus.map((r) => ({
      id: r.id,
      round_number: r.round_number,
      status: r.status,
      topic: r.topic,
      target_lang: r.target_lang,
      rivalry_id: r.rivalry_id,
      rivalName: nameMap[rivalIdMap[r.rivalry_id]] || "Rival",
      syllabus: r.syllabus,
    }));

    setScopes(built);
  };

  const activeScope = scopes.find((s) => ACTIVE_STATUSES.includes(s.status) && s.syllabus);
  const pastScopes = scopes.filter((s) => s.status === "completed" && s.syllabus);

  const allLangs = ["All", ...Array.from(new Set(pastScopes.map((s) => s.target_lang).filter(Boolean) as string[]))];
  const filteredPast = langFilter === "All"
    ? pastScopes
    : pastScopes.filter((s) => s.target_lang === langFilter);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const renderSyllabus = (syllabus: Record<string, unknown> | null) => {
    if (!syllabus) return <p className="text-sm text-gray-400 italic">No syllabus available yet.</p>;

    const sections = [
      { key: "can_do", label: "Can-Do Goals" },
      { key: "vocabulary", label: "Vocabulary" },
      { key: "grammar", label: "Grammar" },
      { key: "expressions", label: "Expressions" },
    ];

    return (
      <div className="space-y-3 mt-3">
        {sections.map(({ key, label }) => {
          const val = syllabus[key];
          if (!val) return null;
          const items: string[] = Array.isArray(val) ? val : [String(val)];
          return (
            <div key={key}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
              <ul className="space-y-1">
                {items.map((item, i) => (
                  <li key={i} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[#953f4d] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#953f4d] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push("/lounge")}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-[#953f4d]" />
            <h1 className="text-xl font-bold text-gray-900">Exam Scopes</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Current Scope */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Current Scope</h2>

          {!activeScope ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400 text-sm">
              No active scope right now. Generate a syllabus in a round to see it here.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      vs {activeScope.rivalName} · Round {activeScope.round_number}
                      {activeScope.target_lang && (
                        <span className="ml-2 px-2 py-0.5 bg-[#953f4d]/10 text-[#953f4d] rounded-full text-xs font-medium">
                          {activeScope.target_lang}
                        </span>
                      )}
                    </p>
                    <h3 className="text-lg font-bold text-gray-900">{activeScope.topic}</h3>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${STATUS_COLOR[activeScope.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {STATUS_LABEL[activeScope.status] ?? activeScope.status}
                  </span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleExpand(activeScope.id)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#953f4d] text-white text-sm font-medium hover:bg-[#7d3440] transition-colors"
                  >
                    <BookOpen className="w-4 h-4" />
                    {expandedId === activeScope.id ? "Hide Scope" : "Review Scope"}
                    {expandedId === activeScope.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => router.push(`/round/${activeScope.id}`)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Go to Round <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {expandedId === activeScope.id && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    {renderSyllabus(activeScope.syllabus)}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Past Scopes */}
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Past Scopes</h2>

          {pastScopes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center text-gray-400 text-sm">
              Completed rounds will appear here.
            </div>
          ) : (
            <>
              {/* Language filter pills */}
              {allLangs.length > 2 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {allLangs.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLangFilter(lang)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                        langFilter === lang
                          ? "bg-[#953f4d] text-white"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-[#953f4d] hover:text-[#953f4d]"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredPast.map((scope) => (
                  <div
                    key={scope.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-400 mb-0.5 truncate">
                            vs {scope.rivalName} · Round {scope.round_number}
                          </p>
                          <p className="text-sm font-semibold text-gray-900 leading-snug">{scope.topic}</p>
                        </div>
                        {scope.target_lang && (
                          <span className="flex-shrink-0 px-2 py-0.5 bg-[#953f4d]/10 text-[#953f4d] rounded-full text-xs font-medium">
                            {scope.target_lang}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleExpand(scope.id)}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#953f4d] transition-colors"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          {expandedId === scope.id ? "Hide" : "Scope"}
                          {expandedId === scope.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>
                        <span className="text-gray-200">·</span>
                        <button
                          onClick={() => router.push(`/round/${scope.id}/results`)}
                          className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#953f4d] transition-colors"
                        >
                          Results <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {expandedId === scope.id && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          {renderSyllabus(scope.syllabus)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredPast.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-6">
                  No scopes for {langFilter} yet.
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
