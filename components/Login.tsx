"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import type { User } from "@supabase/supabase-js";
import { Mail, Lock, ArrowRight, Loader2, UserRound } from "lucide-react";
import {
  getEditableProfileFromUser,
  resolveDisplayName,
} from "@/lib/profile";

export default function Login() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const syncPublicProfile = async (user: User, accessToken?: string | null) => {
    if (!accessToken) return;

    const editableProfile = getEditableProfileFromUser(user);
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        displayName: editableProfile.displayName,
        avatarLetter: editableProfile.avatarLetter,
        avatarColor: editableProfile.avatarColor,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      throw new Error(payload?.error || "Failed to sync profile.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isSignUp) {
      const trimmedDisplayName = displayName.trim();
      if (!trimmedDisplayName) {
        setError("Display nickname is required.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: resolveDisplayName(trimmedDisplayName),
          },
        },
      });
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      if (data.user && data.session?.access_token) {
        try {
          await syncPublicProfile(data.user, data.session.access_token);
        } catch (syncError) {
          setError(
            syncError instanceof Error
              ? syncError.message
              : "Account created, but public profile sync failed."
          );
          setLoading(false);
          return;
        }
      }

      setError("Check your email to confirm your account!");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user && data.session?.access_token) {
      try {
        await syncPublicProfile(data.user, data.session.access_token);
      } catch (syncError) {
        setError(
          syncError instanceof Error
            ? syncError.message
            : "Signed in, but profile sync failed."
        );
        setLoading(false);
        return;
      }
    }

    router.push("/lounge");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface p-4 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-primary-container/40 rounded-full blur-3xl mix-blend-multiply opacity-70"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-secondary-container/40 rounded-full blur-3xl mix-blend-multiply opacity-70"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-container rounded-[2rem] mb-6 rotate-12 shadow-sm">
            <span className="text-4xl">⚔️</span>
          </div>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-2">
            ClashLingo
          </h1>
          <p className="text-on-surface-variant font-medium">
            Master languages through epic battles.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {isSignUp && (
                <div>
                  <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                    Display Nickname
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <UserRound
                        size={20}
                        className="text-on-surface-variant/50"
                      />
                    </div>
                    <input
                      type="text"
                      required={isSignUp}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary transition-all"
                      placeholder="Language Warrior"
                      maxLength={32}
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={20} className="text-on-surface-variant/50" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary transition-all"
                    placeholder="warrior@example.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={20} className="text-on-surface-variant/50" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary transition-all"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              </div>
            </div>

            {/* Error / Info */}
            {error && (
              <div
                className={`text-sm text-center font-medium px-4 py-3 rounded-xl ${
                  error.includes("Check your email")
                    ? "bg-secondary-container/30 text-on-secondary-container"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm group disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {isSignUp ? "Create Account" : "Enter the Arena"}
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Toggle Sign Up / Sign In */}
        <p className="text-center mt-8 text-on-surface-variant text-sm">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError("");
              setDisplayName("");
            }}
            className="text-primary font-bold hover:underline"
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </div>
    </div>
  );
}
