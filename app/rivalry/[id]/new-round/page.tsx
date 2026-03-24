"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import { ArrowLeft, Sparkles, Clock, Trophy, ArrowRight, Loader2 } from "lucide-react";

interface Rivalry {
  id: string;
  player_a_id: string;
  player_b_id: string | null;
  player_a_lang: string;
  player_b_lang: string | null;
  current_round_num: number;
}

export default function NewRoundPage() {
  const router = useRouter();
  const params = useParams();
  const rivalryId = params.id as string;

  const [userId, setUserId] = useState<string | null>(null);
  const [rivalry, setRivalry] = useState<Rivalry | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form
  const [topic, setTopic] = useState("");
  const [studyDays, setStudyDays] = useState(7);
  const [prize, setPrize] = useState("");

  const topicSuggestions = [
    "At the Café",
    "Ordering Food",
    "Travel & Directions",
    "Shopping & Prices",
    "Greetings & Introductions",
    "At the Hotel",
    "Weather & Seasons",
    "Family & Relationships",
  ];

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from("rivalries")
        .select("*")
        .eq("id", rivalryId)
        .single();

      if (!data || (!data.player_b_id)) {
        router.push(`/rivalry/${rivalryId}`);
        return;
      }
      setRivalry(data);
      setLoading(false);
    };
    init();
  }, [router, rivalryId]);

  const handleCreate = async () => {
    if (!userId || !rivalry || !topic.trim()) return;
    setCreating(true);

    const newRoundNumber = rivalry.current_round_num + 1;

    // Create round
    const { data: round, error } = await supabase
      .from("rounds")
      .insert({
        rivalry_id: rivalryId,
        round_number: newRoundNumber,
        target_lang: (newRoundNumber % 2 === 1) ? rivalry.player_a_lang : (rivalry.player_b_lang || rivalry.player_a_lang),
        topic: topic.trim(),
        study_days: studyDays,
        prize_text: prize.trim() || null,
        status: "topic_selection",
      })
      .select()
      .single();

    if (error) {
      alert("Failed to create round: " + error.message);
      setCreating(false);
      return;
    }

    // Update rivalry current_round_num
    await supabase
      .from("rivalries")
      .update({ current_round_num: newRoundNumber })
      .eq("id", rivalryId);

    // Navigate to the round page
    router.push(`/round/${round.id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-on-surface-variant font-medium">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <header className="flex items-center px-6 py-5 max-w-3xl mx-auto">
        <button
          onClick={() => router.push(`/rivalry/${rivalryId}`)}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Back
        </button>
      </header>

      <div className="max-w-3xl mx-auto px-6 pb-12 space-y-10">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-2">
            New Round
          </h1>
          <p className="text-on-surface-variant text-lg">
            Pick a topic, set the rules, and challenge your rival.
          </p>
        </div>

        {/* Topic Selection */}
        <section className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-bold text-on-surface-variant uppercase tracking-widest">
            <Sparkles size={16} /> Topic
          </label>

          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. At the Café, Ordering Food..."
            className="w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary transition-all border border-surface-container text-lg"
          />

          <div className="flex flex-wrap gap-2">
            {topicSuggestions.map((s) => (
              <button
                key={s}
                onClick={() => setTopic(s)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  topic === s
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Study Days */}
        <section className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-bold text-on-surface-variant uppercase tracking-widest">
            <Clock size={16} /> Study Days
          </label>

          <div className="flex gap-3">
            {[3, 5, 7, 10, 14].map((d) => (
              <button
                key={d}
                onClick={() => setStudyDays(d)}
                className={`flex-1 py-4 rounded-2xl font-black text-lg transition-all ${
                  studyDays === d
                    ? "bg-primary text-on-primary shadow-sm"
                    : "bg-surface-container-lowest text-on-surface border border-surface-container hover:bg-surface-container-low"
                }`}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="text-sm text-on-surface-variant font-medium ml-1">
            You and your rival will have {studyDays} days to study before the exam.
          </p>
        </section>

        {/* Prize / Stake */}
        <section className="space-y-4">
          <label className="flex items-center gap-2 text-sm font-bold text-on-surface-variant uppercase tracking-widest">
            <Trophy size={16} /> Prize / Stake
            <span className="text-on-surface-variant/50 normal-case tracking-normal font-medium">(optional)</span>
          </label>

          <input
            type="text"
            value={prize}
            onChange={(e) => setPrize(e.target.value)}
            placeholder="e.g. Loser buys boba 🧋"
            className="w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40 rounded-2xl py-4 px-6 outline-none focus:ring-2 focus:ring-primary transition-all border border-surface-container text-lg"
          />
        </section>

        {/* Submit */}
        <button
          onClick={handleCreate}
          disabled={creating || !topic.trim()}
          className="w-full bg-primary text-on-primary py-5 rounded-2xl font-black text-xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {creating ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              Create Round <ArrowRight size={24} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
