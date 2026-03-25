"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, KeyRound, Loader2, Lock } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [loadingSession, setLoadingSession] = useState(true);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      setReady(Boolean(session));
      setLoadingSession(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(Boolean(session));
        setLoadingSession(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleUpdatePassword = async () => {
    setMessage(null);

    if (password.length < 6) {
      setMessage({
        type: "error",
        text: "Your new password needs at least 6 characters.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({
        type: "error",
        text: "The two password fields do not match yet.",
      });
      return;
    }

    setSaving(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setMessage({
        type: "error",
        text: error.message || "Could not update your password.",
      });
      setSaving(false);
      return;
    }

    setMessage({
      type: "success",
      text: "Password updated. You can head back to sign in now.",
    });
    setSaving(false);
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-on-surface-variant font-medium">
          Loading reset link...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-4 md:p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-primary-container/40 rounded-full blur-3xl mix-blend-multiply opacity-70" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-secondary-container/35 rounded-full blur-3xl mix-blend-multiply opacity-70" />

      <div className="relative z-10 max-w-xl mx-auto">
        <button
          onClick={() => router.push("/login")}
          className="mb-5 inline-flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft size={18} />
          Back to login
        </button>

        <section className="bg-surface-container-lowest rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-white/80 space-y-6">
          <div className="space-y-2">
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-on-surface-variant">
              Password Recovery
            </p>
            <h1 className="text-4xl font-black text-on-surface tracking-[-0.05em]">
              Choose a new password
            </h1>
            <p className="text-on-surface-variant leading-relaxed">
              Pick a fresh password so you can get back into your rivalry queue.
            </p>
          </div>

          {!ready ? (
            <div className="rounded-[2rem] border border-surface-container bg-surface-container-low p-6 space-y-3">
              <div className="w-12 h-12 rounded-[1rem] bg-surface-container text-on-surface-variant flex items-center justify-center">
                <KeyRound size={22} />
              </div>
              <h2 className="text-2xl font-black text-on-surface tracking-tight">
                Open this page from your reset email
              </h2>
              <p className="text-on-surface-variant leading-relaxed">
                This page needs the secure recovery link from your inbox. If you arrived here another way, go back and request a new password reset email from login.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                    New Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock size={20} className="text-on-surface-variant/50" />
                    </div>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      minLength={6}
                      className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <CheckCircle2
                        size={20}
                        className="text-on-surface-variant/50"
                      />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      minLength={6}
                      className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {message && (
                <div
                  className={`rounded-xl px-4 py-3 text-sm font-medium ${
                    message.type === "success"
                      ? "bg-secondary-container/30 text-on-secondary-container"
                      : message.type === "info"
                        ? "bg-surface-container-low text-on-surface-variant"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {message.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleUpdatePassword}
                  disabled={saving}
                  className="w-full bg-primary text-on-primary py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    "Update Password"
                  )}
                </button>

                <button
                  onClick={() => router.push("/login")}
                  className="w-full bg-surface-container-low text-on-surface py-4 rounded-2xl font-bold hover:bg-surface-container transition-all"
                >
                  Back to Sign In
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
