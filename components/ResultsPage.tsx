"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  Frown,
  Home,
  Meh,
  Share2,
  Smile,
  Sparkles,
  XCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import type { Exam, Rivalry, Round, Submission } from "@/lib/domain-types";
import {
  getDictionary,
  getLocalizedLearningLanguageLabel,
  resolveClientWebsiteLanguage,
} from "@/lib/i18n";
import {
  getEditableProfileFromUser,
  resolveDisplayName,
} from "@/lib/profile";
import {
  getLocalizedExamOptions,
  getLocalizedList,
  getLocalizedRubricAnswer,
  getLocalizedText,
  getLocalizedVocabularyGroups,
  type InstructionLanguage,
} from "@/lib/instruction-content";

type ShareCardTone = "victory" | "tie" | "defeat";

function escapeForXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncateForCard(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1)}…`;
}

function buildShareCardSvg(input: {
  roundNumber: number;
  topic: string;
  language: string;
  myName: string;
  rivalName: string;
  myScore: number;
  rivalScore: number;
  resultLabel: string;
  summaryLine: string;
  tone: ShareCardTone;
}) {
  const toneMap: Record<
    ShareCardTone,
    { primary: string; secondary: string; accent: string }
  > = {
    victory: {
      primary: "#953f4d",
      secondary: "#f8c7d0",
      accent: "#0c693d",
    },
    tie: {
      primary: "#8e6f18",
      secondary: "#f4e3a3",
      accent: "#953f4d",
    },
    defeat: {
      primary: "#0c693d",
      secondary: "#b8ecd0",
      accent: "#953f4d",
    },
  };

  const colors = toneMap[input.tone];
  const topic = escapeForXml(truncateForCard(input.topic, 30));
  const language = escapeForXml(input.language);
  const myName = escapeForXml(truncateForCard(input.myName, 18));
  const rivalName = escapeForXml(truncateForCard(input.rivalName, 18));
  const resultLabel = escapeForXml(input.resultLabel);
  const summaryLine = escapeForXml(truncateForCard(input.summaryLine, 38));

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" fill="none">
  <defs>
    <linearGradient id="bg" x1="120" y1="80" x2="1040" y2="560" gradientUnits="userSpaceOnUse">
      <stop stop-color="#FFF8F2" />
      <stop offset="0.55" stop-color="#FFFDF9" />
      <stop offset="1" stop-color="#F5FFF8" />
    </linearGradient>
    <filter id="shadow" x="130" y="106" width="940" height="430" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feDropShadow dx="0" dy="24" stdDeviation="30" flood-color="rgba(48,46,43,0.12)"/>
    </filter>
  </defs>
  <rect width="1200" height="630" rx="36" fill="url(#bg)" />
  <circle cx="164" cy="132" r="116" fill="${colors.secondary}" opacity="0.9" />
  <circle cx="1038" cy="516" r="132" fill="${colors.secondary}" opacity="0.7" />
  <g filter="url(#shadow)">
    <rect x="160" y="136" width="880" height="358" rx="42" fill="white"/>
  </g>
  <rect x="220" y="190" width="178" height="46" rx="23" fill="${colors.primary}"/>
  <text x="309" y="220" fill="white" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="20" font-weight="800" text-anchor="middle">ClashLingo</text>
  <text x="220" y="272" fill="#5F5A54" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="22" font-weight="700">Round ${input.roundNumber} · ${language}</text>
  <text x="220" y="314" fill="#2F2C29" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="52" font-weight="800">${topic}</text>
  <text x="220" y="360" fill="#736E69" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="26" font-weight="600">${summaryLine}</text>
  <rect x="220" y="394" width="244" height="54" rx="27" fill="${colors.secondary}"/>
  <text x="342" y="427" fill="${colors.primary}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="24" font-weight="800" text-anchor="middle">${resultLabel}</text>

  <text x="724" y="248" fill="#736E69" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="18" font-weight="800" text-anchor="middle">YOU</text>
  <text x="724" y="342" fill="${colors.primary}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="92" font-weight="900" text-anchor="middle">${input.myScore}</text>
  <text x="724" y="390" fill="#2F2C29" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="28" font-weight="800" text-anchor="middle">${myName}</text>

  <text x="904" y="317" fill="#D6D1CB" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="36" font-weight="900" text-anchor="middle">VS</text>

  <text x="1014" y="248" fill="#736E69" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="18" font-weight="800" text-anchor="middle">RIVAL</text>
  <text x="1014" y="342" fill="${colors.accent}" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="92" font-weight="900" text-anchor="middle">${input.rivalScore}</text>
  <text x="1014" y="390" fill="#2F2C29" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="28" font-weight="800" text-anchor="middle">${rivalName}</text>

  <text x="220" y="554" fill="#736E69" font-family="'Plus Jakarta Sans', Arial, sans-serif" font-size="20" font-weight="700">Weekly language duel · ClashLingo</text>
</svg>`;
}

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const roundId = params.id as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [websiteLanguage, setWebsiteLanguage] = useState(
    resolveClientWebsiteLanguage()
  );
  const [instructionLanguage, setInstructionLanguage] =
    useState<InstructionLanguage>(resolveClientWebsiteLanguage());
  const [myDisplayName, setMyDisplayName] = useState("You");
  const [rivalDisplayName, setRivalDisplayName] = useState("Rival");
  const [round, setRound] = useState<Round | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [mySub, setMySub] = useState<Submission | null>(null);
  const [rivalSub, setRivalSub] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);

  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [feedbackSaved, setFeedbackSaved] = useState(false);

  const [shareCopied, setShareCopied] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);
  const [cardDownloaded, setCardDownloaded] = useState(false);

  const [showSyllabus, setShowSyllabus] = useState(false);

  const dictionary = getDictionary(websiteLanguage);

  const loadResults = useCallback(async () => {
    const { data: roundData } = await supabase
      .from("rounds")
      .select("*")
      .eq("id", roundId)
      .single();

    if (!roundData) {
      router.push("/lounge");
      return;
    }

    const typedRound = roundData as Round;
    setRound(typedRound);

    if (typedRound.rivalry_id && userId) {
      const { data: rivalryData } = await supabase
        .from("rivalries")
        .select("player_a_id, player_b_id")
        .eq("id", typedRound.rivalry_id)
        .maybeSingle<Pick<Rivalry, "player_a_id" | "player_b_id">>();

      const rivalId =
        rivalryData?.player_a_id === userId
          ? rivalryData.player_b_id
          : rivalryData?.player_a_id;

      if (rivalId) {
        const { data: rivalProfile } = await supabase
          .from("users")
          .select("display_name")
          .eq("id", rivalId)
          .maybeSingle<{ display_name: string | null }>();

        setRivalDisplayName(
          resolveDisplayName(
            rivalProfile?.display_name,
            dictionary.results.rival
          )
        );
      } else {
        setRivalDisplayName(dictionary.results.rival);
      }
    }

    const { data: examData } = await supabase
      .from("exams")
      .select("*")
      .eq("round_id", roundId)
      .single();

    if (examData) {
      const typedExam = examData as Exam;
      setExam(typedExam);

      const { data: subs } = await supabase
        .from("submissions")
        .select("*")
        .eq("exam_id", typedExam.id);

      if (subs) {
        const my = subs.find((submission) => submission.user_id === userId);
        const rival = subs.find((submission) => submission.user_id !== userId);

        if (my) {
          const typedSubmission = my as Submission;
          setMySub(typedSubmission);
          if (typedSubmission.feedback_difficulty) {
            setDifficulty(typedSubmission.feedback_difficulty);
            setFeedbackSaved(true);
          }
        }

        if (rival) {
          setRivalSub(rival as Submission);
        }
      }
    }
  }, [dictionary.results.rival, roundId, router, userId]);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const profile = getEditableProfileFromUser(user);
      setUserId(user.id);
      setWebsiteLanguage(profile.websiteLanguage);
      setInstructionLanguage(profile.instructionLanguage);
      setMyDisplayName(
        resolveDisplayName(profile.displayName, dictionary.results.you)
      );
    };

    init();
  }, [dictionary.results.you, router]);

  useEffect(() => {
    if (!userId) return;

    const syncResults = async () => {
      await loadResults();
      setLoading(false);
    };

    syncResults();
  }, [loadResults, userId]);

  useEffect(() => {
    if (!exam?.id) return;

    const channel = supabase
      .channel(`submissions-${exam.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "submissions",
          filter: `exam_id=eq.${exam.id}`,
        },
        () => {
          loadResults();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [exam?.id, loadResults]);

  const saveFeedback = async (diff: string) => {
    if (!mySub) return;
    setDifficulty(diff);
    await supabase
      .from("submissions")
      .update({ feedback_difficulty: diff })
      .eq("id", mySub.id);
    setFeedbackSaved(true);
  };

  const myScore = mySub?.total_score ?? 0;
  const rivalScore = rivalSub?.total_score ?? null;
  const bothSubmitted = Boolean(mySub && rivalSub);
  const iWon = rivalScore !== null && myScore > rivalScore;
  const tied = rivalScore !== null && myScore === rivalScore;
  const syllabus = round?.syllabus;
  const localizedCanDo = getLocalizedList(
    syllabus?.can_do,
    instructionLanguage
  );
  const localizedGrammar = getLocalizedList(
    syllabus?.grammar,
    instructionLanguage
  );
  const vocabularyGroups = getLocalizedVocabularyGroups(
    syllabus,
    instructionLanguage
  );

  const totalPossiblePoints = useMemo(() => {
    if (!exam) return 0;
    if (typeof exam.total_points === "number") return exam.total_points;
    return exam.rubric.reduce(
      (sum, item) => sum + Number(item.points ?? 0),
      0
    );
  }, [exam]);

  const perfectAnswerCount = useMemo(() => {
    if (!exam || !mySub) return 0;

    return exam.questions.filter((question) => {
      const rubricItem = exam.rubric.find((item) => item.id === question.id);
      const maxPoints = Number(rubricItem?.points ?? 0);
      const score = Number(mySub.scores?.[question.id] ?? 0);

      return maxPoints > 0 && score === maxPoints;
    }).length;
  }, [exam, mySub]);

  const accuracy = totalPossiblePoints
    ? Math.round((myScore / totalPossiblePoints) * 100)
    : 0;
  const scoreDelta = rivalScore !== null ? myScore - rivalScore : null;

  const localizedTargetLanguage = getLocalizedLearningLanguageLabel(
    round?.target_lang,
    websiteLanguage
  );
  const topicLabel = round?.topic?.trim() || dictionary.results.noTopic;
  const myName = myDisplayName || dictionary.results.you;
  const rivalName = rivalDisplayName || dictionary.results.rival;

  const resultTone: ShareCardTone = iWon ? "victory" : tied ? "tie" : "defeat";
  const resultLabel = iWon
    ? dictionary.results.victory
    : tied
      ? dictionary.results.tie
      : dictionary.results.defeat;
  const resultSummary = scoreDelta === null
    ? ""
    : iWon
      ? dictionary.results.wonBy(Math.abs(scoreDelta))
      : tied
        ? dictionary.results.tiedAt(myScore)
        : dictionary.results.lostBy(Math.abs(scoreDelta));

  const shareText = bothSubmitted
    ? `ClashLingo — Round ${round?.round_number}\n${topicLabel} · ${localizedTargetLanguage}\n${myName}: ${myScore} vs ${rivalName}: ${rivalScore}\n${resultSummary}`
    : "";

  const shareCardSvg = bothSubmitted
    ? buildShareCardSvg({
        roundNumber: round?.round_number ?? 0,
        topic: topicLabel,
        language: localizedTargetLanguage,
        myName,
        rivalName,
        myScore,
        rivalScore: rivalScore ?? 0,
        resultLabel,
        summaryLine: resultSummary,
        tone: resultTone,
      })
    : null;

  const handleShare = async () => {
    if (!bothSubmitted || !shareText) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "ClashLingo",
          text: shareText,
        });
        return;
      } catch {
        // User cancelled.
      }
    }

    await navigator.clipboard.writeText(shareText);
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 2000);
  };

  const handleCopyCaption = async () => {
    if (!bothSubmitted || !shareText) return;

    await navigator.clipboard.writeText(shareText);
    setCaptionCopied(true);
    window.setTimeout(() => setCaptionCopied(false), 2000);
  };

  const handleDownloadCard = async () => {
    if (!bothSubmitted || !shareCardSvg || !round) return;

    const blob = new Blob([shareCardSvg], {
      type: "image/svg+xml;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `clashlingo-round-${round.round_number}.svg`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setCardDownloaded(true);
    window.setTimeout(() => setCardDownloaded(false), 2000);
  };

  const getQuestionPromptLabel = (question: Exam["questions"][number]) =>
    getLocalizedText(question.prompt, instructionLanguage);

  const getOptionLabel = (
    question: Exam["questions"][number],
    optionValue: string
  ) => {
    const options = getLocalizedExamOptions(question, instructionLanguage);
    const match = options.find(
      (option) => option.value === optionValue || option.label === optionValue
    );

    return match?.label ?? optionValue;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-on-surface-variant font-medium">
          {dictionary.results.loading}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-10">
        <section className="bg-white rounded-[2.75rem] p-8 md:p-12 shadow-[0_24px_60px_rgba(149,63,77,0.08)] relative overflow-hidden">
          <div className="absolute -top-16 -left-14 w-52 h-52 bg-primary-container/35 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -right-12 w-56 h-56 bg-secondary-container/35 rounded-full blur-3xl" />

          <div className="relative z-10 space-y-8">
            <div className="space-y-3">
              <p className="text-[11px] font-black uppercase tracking-[0.26em] text-on-surface-variant">
                {bothSubmitted
                  ? dictionary.results.reportEyebrow
                  : dictionary.results.waitingEyebrow}
              </p>

              {bothSubmitted ? (
                <>
                  <div
                    className={`inline-flex items-center rounded-full px-6 py-3 text-sm md:text-base font-black uppercase tracking-[0.18em] ${
                      iWon
                        ? "bg-primary text-on-primary"
                        : tied
                          ? "bg-tertiary-container text-on-tertiary-container"
                          : "bg-secondary text-on-secondary"
                    }`}
                  >
                    {resultLabel}
                  </div>
                  <h1 className="text-4xl md:text-6xl font-black text-on-surface tracking-[-0.06em] leading-none">
                    {resultSummary}
                  </h1>
                </>
              ) : (
                <>
                  <h1 className="text-4xl md:text-6xl font-black text-on-surface tracking-[-0.06em] leading-none">
                    {dictionary.results.waitingTitle}
                  </h1>
                  <p className="text-lg md:text-xl text-on-surface-variant max-w-3xl leading-relaxed">
                    {dictionary.results.waitingDescription}
                  </p>
                </>
              )}
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 rounded-full bg-surface-container-low text-on-surface text-sm font-black">
                {dictionary.results.stats.round}: {round?.round_number}
              </span>
              <span className="px-4 py-2 rounded-full bg-surface-container-low text-on-surface text-sm font-black">
                {dictionary.results.stats.language}: {localizedTargetLanguage}
              </span>
              <span className="px-4 py-2 rounded-full bg-surface-container-low text-on-surface text-sm font-black">
                {dictionary.results.stats.topic}: {topicLabel}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)] gap-6 items-stretch">
              <div className="bg-surface-container-low rounded-[2.25rem] p-6 md:p-8 border border-surface-container space-y-6">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 md:gap-8">
                  <div className="text-center space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-on-surface-variant">
                      {dictionary.results.you}
                    </p>
                    <div className="text-6xl md:text-7xl font-black text-primary tracking-[-0.06em]">
                      {myScore}
                    </div>
                    <p className="text-base md:text-lg font-bold text-on-surface">
                      {myName}
                    </p>
                  </div>

                  <div className="text-2xl md:text-4xl font-black italic text-on-surface-variant/25">
                    VS
                  </div>

                  <div className="text-center space-y-2">
                    <p className="text-xs font-black uppercase tracking-[0.24em] text-on-surface-variant">
                      {dictionary.results.rival}
                    </p>
                    <div className="text-6xl md:text-7xl font-black text-secondary tracking-[-0.06em]">
                      {rivalScore ?? "—"}
                    </div>
                    <p className="text-base md:text-lg font-bold text-on-surface">
                      {rivalName}
                    </p>
                  </div>
                </div>

                {!bothSubmitted && (
                  <div className="rounded-[1.7rem] bg-white px-5 py-4 border border-surface-container text-on-surface-variant font-medium">
                    {dictionary.results.waitingDescription}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-[1.9rem] p-5 border border-surface-container shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">
                    {dictionary.results.stats.score}
                  </p>
                  <p className="mt-3 text-3xl font-black tracking-[-0.05em] text-on-surface">
                    {myScore}/{totalPossiblePoints}
                  </p>
                </div>

                <div className="bg-white rounded-[1.9rem] p-5 border border-surface-container shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">
                    {dictionary.results.stats.accuracy}
                  </p>
                  <p className="mt-3 text-3xl font-black tracking-[-0.05em] text-on-surface">
                    {accuracy}%
                  </p>
                </div>

                <div className="bg-white rounded-[1.9rem] p-5 border border-surface-container shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">
                    {dictionary.results.stats.delta}
                  </p>
                  <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-on-surface">
                    {scoreDelta === null
                      ? "—"
                      : scoreDelta === 0
                        ? dictionary.results.deltaEven
                        : scoreDelta > 0
                          ? dictionary.results.deltaAhead(scoreDelta)
                          : dictionary.results.deltaBehind(Math.abs(scoreDelta))}
                  </p>
                </div>

                <div className="bg-white rounded-[1.9rem] p-5 border border-surface-container shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-on-surface-variant">
                    {dictionary.results.stats.perfect}
                  </p>
                  <p className="mt-3 text-2xl font-black tracking-[-0.04em] text-on-surface">
                    {dictionary.results.perfectValue(
                      perfectAnswerCount,
                      exam?.questions.length ?? 0
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {bothSubmitted && round?.prize_text && (
          <section className="bg-tertiary-container/30 border-2 border-dashed border-tertiary/30 rounded-[2rem] py-6 px-8 text-center shadow-sm">
            <p className="text-xl md:text-2xl font-black text-on-surface">
              {iWon
                ? dictionary.results.prizeWon(round.prize_text)
                : tied
                  ? dictionary.results.prizeTied
                  : dictionary.results.prizeLost(round.prize_text)}
            </p>
          </section>
        )}

        <section className="bg-white rounded-[2.75rem] p-8 md:p-10 shadow-[0_24px_60px_rgba(149,63,77,0.08)] space-y-6">
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-on-surface-variant">
              {dictionary.results.shareEyebrow}
            </p>
            <h2 className="text-3xl md:text-4xl font-black tracking-[-0.05em] text-on-surface">
              {dictionary.results.shareTitle}
            </h2>
            <p className="text-on-surface-variant text-lg leading-relaxed max-w-3xl">
              {dictionary.results.shareDescription}
            </p>
          </div>

          <div className="rounded-[2.4rem] border border-surface-container bg-[radial-gradient(circle_at_top_left,_rgba(255,148,162,0.28),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(161,245,188,0.24),_transparent_34%),white] p-6 md:p-8 shadow-sm">
            <div className="inline-flex items-center rounded-full bg-primary px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-on-primary">
              ClashLingo
            </div>

            <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold text-on-surface-variant">
              <span>Round {round?.round_number}</span>
              <span>·</span>
              <span>{localizedTargetLanguage}</span>
              <span>·</span>
              <span>{topicLabel}</span>
            </div>

            <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-end gap-4 md:gap-8">
              <div className="space-y-2">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  {dictionary.results.you}
                </div>
                <div className="text-5xl md:text-6xl font-black text-primary tracking-[-0.06em]">
                  {myScore}
                </div>
                <div className="text-lg font-bold text-on-surface">{myName}</div>
              </div>

              <div className="pb-4 text-2xl font-black italic text-on-surface-variant/30">
                VS
              </div>

              <div className="space-y-2 text-right">
                <div className="text-xs font-black uppercase tracking-[0.22em] text-on-surface-variant">
                  {dictionary.results.rival}
                </div>
                <div className="text-5xl md:text-6xl font-black text-secondary tracking-[-0.06em]">
                  {rivalScore ?? "—"}
                </div>
                <div className="text-lg font-bold text-on-surface">{rivalName}</div>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <div
                className={`inline-flex rounded-full px-5 py-2 text-sm font-black uppercase tracking-[0.18em] ${
                  bothSubmitted
                    ? iWon
                      ? "bg-primary text-on-primary"
                      : tied
                        ? "bg-tertiary-container text-on-tertiary-container"
                        : "bg-secondary text-on-secondary"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {bothSubmitted
                  ? resultLabel
                  : dictionary.results.waitingEyebrow}
              </div>

              <div className="text-base md:text-lg font-bold text-on-surface">
                {bothSubmitted
                  ? resultSummary
                  : dictionary.results.waitingDescription}
              </div>
            </div>
          </div>

          {bothSubmitted ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 rounded-[1.5rem] bg-primary text-on-primary px-5 py-4 font-black text-base hover:translate-y-[-1px] active:translate-y-0 transition-all shadow-[0_14px_28px_rgba(149,63,77,0.18)]"
              >
                <Share2 size={18} />
                {shareCopied ? dictionary.common.copied : dictionary.results.shareButton}
              </button>
              <button
                onClick={handleCopyCaption}
                className="flex items-center justify-center gap-2 rounded-[1.5rem] bg-surface-container-low text-on-surface px-5 py-4 font-black text-base hover:bg-surface-container transition-colors"
              >
                <Copy size={18} />
                {captionCopied
                  ? dictionary.results.captionCopied
                  : dictionary.results.copyCaption}
              </button>
              <button
                onClick={handleDownloadCard}
                className="flex items-center justify-center gap-2 rounded-[1.5rem] bg-secondary-container text-on-secondary-container px-5 py-4 font-black text-base hover:translate-y-[-1px] active:translate-y-0 transition-all"
              >
                <Download size={18} />
                {cardDownloaded
                  ? dictionary.results.cardDownloaded
                  : dictionary.results.downloadCard}
              </button>
            </div>
          ) : (
            <div className="rounded-[1.7rem] bg-surface-container-low px-5 py-4 text-sm font-medium text-on-surface-variant">
              {dictionary.results.waitingShareHint}
            </div>
          )}
        </section>

        {syllabus && (
          <section className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden">
            <button
              onClick={() => setShowSyllabus((value) => !value)}
              className="w-full flex items-center justify-between px-8 py-6 hover:bg-surface-container-lowest transition-colors"
            >
              <div className="flex items-center gap-3">
                <BookOpen size={20} className="text-primary" />
                <span className="text-lg font-black text-on-surface">
                  {dictionary.results.studyMaterial}
                </span>
                <span className="text-sm font-medium text-on-surface-variant">
                  {topicLabel}
                  {round?.target_lang ? ` · ${localizedTargetLanguage}` : ""}
                </span>
              </div>
              {showSyllabus ? (
                <ChevronUp size={20} className="text-on-surface-variant" />
              ) : (
                <ChevronDown size={20} className="text-on-surface-variant" />
              )}
            </button>

            {showSyllabus && (
              <div className="px-8 pb-8 space-y-6 border-t border-surface-container">
                {localizedCanDo.length > 0 ? (
                  <div className="pt-6">
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                      {dictionary.scopes.sections.can_do}
                    </h3>
                    <ul className="space-y-2">
                      {localizedCanDo.map((item, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-on-surface text-sm"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {vocabularyGroups.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                      {dictionary.scopes.sections.vocabulary}
                    </h3>
                    <div className="space-y-3">
                      {vocabularyGroups.map((group) => (
                        <div key={group.id}>
                          <p className="text-xs font-medium text-on-surface-variant mb-2">
                            {group.label}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {group.words.map((word, index) => (
                              <span
                                key={index}
                                className="px-3 py-1 bg-surface-container-low border border-surface-container rounded-xl text-sm text-on-surface"
                              >
                                {word}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {localizedGrammar.length > 0 ? (
                  <div>
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                      {dictionary.scopes.sections.grammar}
                    </h3>
                    <div className="space-y-2">
                      {localizedGrammar.map((grammar, index) => (
                        <div
                          key={index}
                          className="bg-surface-container-low p-3 rounded-xl border-l-4 border-primary text-sm text-on-surface"
                        >
                          {grammar}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                {syllabus.expressions?.length ? (
                  <div>
                    <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                      {dictionary.scopes.sections.expressions}
                    </h3>
                    <div className="divide-y divide-surface-container">
                      {syllabus.expressions.map((expression, index) => (
                        <div key={index} className="py-2 text-sm text-on-surface">
                          {expression}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </section>
        )}

        {mySub && exam && (
          <section className="space-y-4">
            <h2 className="text-2xl font-black text-on-surface tracking-tight">
              {dictionary.results.questionReview}
            </h2>

            <div className="bg-white rounded-[2rem] shadow-sm divide-y divide-surface-container overflow-hidden">
              {exam.questions.map((question) => {
                const myAnswer =
                  mySub.answers?.[question.id] || dictionary.results.noAnswer;
                const score = Number(mySub.scores?.[question.id] ?? 0);
                const rubricItem = exam.rubric.find(
                  (item) => item.id === question.id
                );
                const correct =
                  question.type === "mcq"
                    ? getOptionLabel(
                        question,
                        String(rubricItem?.answer ?? "")
                      )
                    : getLocalizedRubricAnswer(
                        rubricItem,
                        instructionLanguage
                      );
                const yourAnswer =
                  question.type === "mcq"
                    ? getOptionLabel(question, myAnswer)
                    : myAnswer;
                const maxPoints = Number(rubricItem?.points ?? 0);
                const isCorrect = score === maxPoints && maxPoints > 0;

                return (
                  <div key={question.id} className="p-6">
                    <div className="flex items-start justify-between mb-3 gap-4">
                      <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                        Q{question.id} •{" "}
                        {dictionary.results.questionTypes[question.type]}
                      </span>
                      <span
                        className={`flex items-center gap-1 text-sm font-bold shrink-0 ${
                          isCorrect
                            ? "text-green-600"
                            : score > 0
                              ? "text-tertiary"
                              : "text-red-500"
                        }`}
                      >
                        {isCorrect ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <XCircle size={16} />
                        )}
                        {score}/{maxPoints}
                      </span>
                    </div>

                    <p className="text-on-surface font-medium mb-3">
                      {getQuestionPromptLabel(question)}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div
                        className={`p-3 rounded-xl text-sm ${
                          isCorrect
                            ? "bg-green-50 border border-green-200"
                            : "bg-red-50 border border-red-200"
                        }`}
                      >
                        <div className="text-xs font-bold uppercase tracking-widest mb-1 text-on-surface-variant">
                          {dictionary.results.yourAnswer}
                        </div>
                        <div
                          className={`font-medium ${
                            isCorrect ? "text-green-700" : "text-red-700"
                          }`}
                        >
                          {yourAnswer}
                        </div>
                      </div>

                      {!isCorrect && (
                        <div className="p-3 rounded-xl text-sm bg-primary-container/20 border border-primary/20">
                          <div className="text-xs font-bold uppercase tracking-widest mb-1 text-primary">
                            {dictionary.results.correctAnswer}
                          </div>
                          <div className="font-medium text-on-surface">
                            {correct}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {mySub && !feedbackSaved && (
          <section className="bg-surface-container-low rounded-[2rem] p-8 text-center space-y-6">
            <h3 className="text-xl font-black text-on-surface">
              {dictionary.results.difficultyTitle}
            </h3>
            <div className="flex justify-center gap-6">
              {[
                {
                  val: "too_easy",
                  icon: Smile,
                  label: dictionary.results.tooEasy,
                },
                {
                  val: "just_right",
                  icon: Meh,
                  label: dictionary.results.justRight,
                },
                {
                  val: "too_hard",
                  icon: Frown,
                  label: dictionary.results.tooHard,
                },
              ].map(({ val, icon: Icon, label }) => (
                <button
                  key={val}
                  onClick={() => saveFeedback(val)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all ${
                    difficulty === val
                      ? "bg-primary-container text-on-primary-container"
                      : "hover:bg-surface-container text-on-surface-variant"
                  }`}
                >
                  <Icon size={36} />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </section>
        )}

        {feedbackSaved && (
          <div className="text-center text-on-surface-variant font-medium flex items-center justify-center gap-2">
            <Sparkles size={16} className="text-primary" />
            {dictionary.results.feedbackThanks}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
          <button
            onClick={() => router.push(`/rivalries?rivalry=${round?.rivalry_id}`)}
            className="bg-primary text-on-primary px-8 py-4 rounded-full font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <ArrowRight size={20} /> {dictionary.results.backToRivalryHub}
          </button>
          <button
            onClick={() => router.push("/lounge")}
            className="bg-surface-container-low text-on-surface px-8 py-4 rounded-full font-bold text-lg hover:bg-surface-container transition-colors flex items-center justify-center gap-2"
          >
            <Home size={20} /> {dictionary.results.backToLounge}
          </button>
        </div>
      </div>
    </div>
  );
}
