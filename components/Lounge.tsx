"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { Swords, Plus, UserPlus, ArrowRight, X, Copy, Check, LogOut } from "lucide-react";

interface Rivalry {
  id: string;
  player_a_id: string;
  player_b_id: string | null;
  invite_code: string;
  player_a_lang: string;
  player_b_lang: string | null;
  current_round_num: number;
  created_at: string;
}

export default function Lounge() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [rivalries, setRivalries] = useState<Rivalry[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  // Create form
  const [myLang, setMyLang] = useState("French");
  const [creating, setCreating] = useState(false);
  const [createdCode, setCreatedCode] = useState("");
  const [copied, setCopied] = useState(false);

  // Join form
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  const languages = ["French", "Spanish", "Japanese", "German", "Korean", "Italian", "Portuguese", "Chinese"];

  // Check auth + fetch rivalries
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);
      await fetchRivalries(user.id);
      setLoading(false);
    };
    init();
  }, [router]);

  const fetchRivalries = async (uid: string) => {
    const { data, error } = await supabase
      .from("rivalries")
      .select("*")
      .or(`player_a_id.eq.${uid},player_b_id.eq.${uid}`)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRivalries(data);
    }
  };

  // Generate 6-char invite code
  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  const handleCreate = async () => {
    if (!userId) return;
    setCreating(true);

    const code = generateCode();
    const { error } = await supabase.from("rivalries").insert({
      player_a_id: userId,
      invite_code: code,
      player_a_lang: myLang,
      player_a_difficulty: "beginner",
    });

    if (error) {
      // If code collision, retry once
      const retryCode = generateCode();
      const { error: retryError } = await supabase.from("rivalries").insert({
        player_a_id: userId,
        invite_code: retryCode,
        player_a_lang: myLang,
        player_a_difficulty: "beginner",
      });
      if (retryError) {
        alert("Failed to create rivalry: " + retryError.message);
        setCreating(false);
        return;
      }
      setCreatedCode(retryCode);
    } else {
      setCreatedCode(code);
    }

    setCreating(false);
    await fetchRivalries(userId);
  };

  const handleJoin = async () => {
    if (!userId) return;
    setJoining(true);
    setJoinError("");

    const trimmedCode = joinCode.trim().toUpperCase();

    // Find rivalry by code
    const { data, error } = await supabase
      .from("rivalries")
      .select("*")
      .eq("invite_code", trimmedCode)
      .single();

    if (error || !data) {
      setJoinError("Invite code not found.");
      setJoining(false);
      return;
    }

    if (data.player_a_id === userId) {
      setJoinError("You can't join your own rivalry!");
      setJoining(false);
      return;
    }

    if (data.player_b_id) {
      setJoinError("This rivalry already has two players.");
      setJoining(false);
      return;
    }

    // Join
    const { error: updateError } = await supabase
      .from("rivalries")
      .update({
        player_b_id: userId,
        player_b_lang: data.player_a_lang, // Same language for now
        player_b_difficulty: "beginner",
      })
      .eq("id", data.id);

    if (updateError) {
      setJoinError("Failed to join: " + updateError.message);
      setJoining(false);
      return;
    }

    setJoining(false);
    setShowJoin(false);
    setJoinCode("");
    await fetchRivalries(userId);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(createdCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
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
      {/* Header */}
      <header className="flex justify-between items-center px-6 py-5 max-w-5xl mx-auto">
        <h1 className="text-2xl font-black text-primary tracking-tighter">ClashLingo</h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors text-sm font-medium"
        >
          <LogOut size={18} />
          Log out
        </button>
      </header>

      <div className="max-w-5xl mx-auto px-6 pb-12 space-y-10">
        {/* Welcome */}
        <div>
          <h2 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter mb-2">
            Your Lounge
          </h2>
          <p className="text-on-surface-variant text-lg">Ready to crush some dreams today?</p>
        </div>

        {rivalries.length === 0 ? (
          /* ========== Empty State ========== */
          <div className="bg-surface-container-low rounded-[3rem] p-12 text-center flex flex-col items-center justify-center min-h-[50vh] relative overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] bg-primary-container/30 rounded-full blur-3xl mix-blend-multiply"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] bg-secondary-container/30 rounded-full blur-3xl mix-blend-multiply"></div>

            <div className="relative z-10 max-w-lg mx-auto space-y-8">
              <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto shadow-xl rotate-12">
                <Swords size={64} className="text-primary" />
              </div>

              <div className="space-y-4">
                <h3 className="text-4xl font-black text-on-surface tracking-tight">
                  Learning alone is boring.
                </h3>
                <p className="text-xl text-on-surface-variant">
                  Crush your friends instead. Start a rivalry and see who learns faster.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                <button
                  onClick={() => { setShowCreate(true); setCreatedCode(""); }}
                  className="bg-primary text-on-primary px-8 py-4 rounded-full font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={24} /> CREATE RIVALRY
                </button>
                <button
                  onClick={() => { setShowJoin(true); setJoinError(""); setJoinCode(""); }}
                  className="bg-white text-on-surface border-2 border-surface-container px-8 py-4 rounded-full font-black text-lg shadow-sm hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <UserPlus size={24} /> JOIN WITH CODE
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========== Rivalry Cards ========== */
          <div className="space-y-8">
            {/* Action buttons */}
            <div className="flex gap-4">
              <button
                onClick={() => { setShowCreate(true); setCreatedCode(""); }}
                className="bg-primary text-on-primary px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-sm"
              >
                <Plus size={20} /> New Rivalry
              </button>
              <button
                onClick={() => { setShowJoin(true); setJoinError(""); setJoinCode(""); }}
                className="bg-white text-on-surface border-2 border-surface-container px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
              >
                <UserPlus size={20} /> Join
              </button>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rivalries.map((r) => {
                const isPlayerA = r.player_a_id === userId;
                const isPaired = !!r.player_b_id;
                const lang = isPlayerA ? r.player_a_lang : (r.player_b_lang || r.player_a_lang);

                return (
                  <div
                    key={r.id}
                    onClick={() => isPaired && router.push(`/rivalry/${r.id}`)}
                    className={`bg-white rounded-[2.5rem] p-8 shadow-sm border-2 transition-all ${
                      isPaired
                        ? "border-primary/20 hover:border-primary hover:scale-[1.02] cursor-pointer"
                        : "border-surface-container"
                    }`}
                  >
                    {/* Status badge */}
                    <div className="flex justify-between items-start mb-6">
                      <div
                        className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest ${
                          isPaired
                            ? "bg-primary-container text-on-primary-container"
                            : "bg-surface-container-high text-on-surface-variant"
                        }`}
                      >
                        {isPaired ? `Round ${r.current_round_num}` : "Waiting for rival..."}
                      </div>
                    </div>

                    {/* Players */}
                    <div className="flex flex-col items-center text-center mb-6">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-14 h-14 rounded-full bg-primary-container flex items-center justify-center text-primary font-black text-xl border-2 border-white shadow-md">
                          {isPlayerA ? "A" : "B"}
                        </div>
                        <div className="text-xl font-black italic text-surface-container-highest">VS</div>
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl border-2 border-white shadow-md ${
                          isPaired
                            ? "bg-secondary-container text-secondary"
                            : "bg-surface-container text-on-surface-variant"
                        }`}>
                          {isPaired ? (isPlayerA ? "B" : "A") : "?"}
                        </div>
                      </div>
                      <p className="text-on-surface-variant font-medium">{lang} • {isPaired ? "Active" : "Pending"}</p>
                    </div>

                    {/* Invite code (for unpaired) */}
                    {!isPaired && isPlayerA && (
                      <div className="bg-surface-container-lowest rounded-2xl p-4 text-center border border-surface-container">
                        <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
                          Share this code
                        </p>
                        <p className="text-2xl font-black text-primary tracking-[0.3em] font-mono">
                          {r.invite_code}
                        </p>
                      </div>
                    )}

                    {/* Enter button (for paired) */}
                    {isPaired && (
                      <div className="flex items-center justify-center gap-2 text-primary font-bold">
                        Enter Rivalry <ArrowRight size={18} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========== Create Modal ========== */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowCreate(false)}>
          <div
            className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCreate(false)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface"
            >
              <X size={24} />
            </button>

            {!createdCode ? (
              <>
                <h3 className="text-2xl font-black text-on-surface mb-2">Create a Rivalry</h3>
                <p className="text-on-surface-variant mb-8">Pick your language, then share the code with your rival.</p>

                <div className="mb-8">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                    I want to learn
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {languages.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setMyLang(lang)}
                        className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                          myLang === lang
                            ? "bg-primary text-on-primary shadow-sm"
                            : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="w-full bg-primary text-on-primary py-4 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm disabled:opacity-60"
                >
                  {creating ? "Creating..." : "Create Rivalry"}
                </button>
              </>
            ) : (
              /* Code generated */
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-primary-container rounded-full flex items-center justify-center mx-auto">
                  <Swords size={40} className="text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-on-surface mb-2">Rivalry Created!</h3>
                  <p className="text-on-surface-variant">Share this code with your rival:</p>
                </div>

                <div className="bg-surface-container-low rounded-2xl p-6">
                  <p className="text-4xl font-black text-primary tracking-[0.3em] font-mono mb-4">
                    {createdCode}
                  </p>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 mx-auto text-sm font-bold text-on-surface-variant hover:text-primary transition-colors"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                    {copied ? "Copied!" : "Copy Code"}
                  </button>
                </div>

                <button
                  onClick={() => setShowCreate(false)}
                  className="w-full bg-surface-container-low text-on-surface py-4 rounded-2xl font-bold hover:bg-surface-container transition-colors"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== Join Modal ========== */}
      {showJoin && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowJoin(false)}>
          <div
            className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowJoin(false)}
              className="absolute top-6 right-6 text-on-surface-variant hover:text-on-surface"
            >
              <X size={24} />
            </button>

            <h3 className="text-2xl font-black text-on-surface mb-2">Join a Rivalry</h3>
            <p className="text-on-surface-variant mb-8">Enter the code your rival shared with you.</p>

            <div className="mb-6">
              <input
                type="text"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="XXXXXX"
                className="w-full text-center text-3xl font-black tracking-[0.3em] font-mono bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/30 rounded-2xl py-5 outline-none focus:ring-2 focus:ring-primary transition-all"
              />
            </div>

            {joinError && (
              <div className="text-sm text-center font-medium px-4 py-3 rounded-xl bg-red-100 text-red-700 mb-6">
                {joinError}
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={joining || joinCode.length < 4}
              className="w-full bg-primary text-on-primary py-4 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm disabled:opacity-60"
            >
              {joining ? "Joining..." : "Join Rivalry"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}