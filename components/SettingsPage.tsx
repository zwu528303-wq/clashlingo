"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  Clock3,
  Palette,
  Save,
  Sparkles,
  UserRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  AVATAR_THEMES,
  DEFAULT_WEEKLY_MATCH_TIME,
  SUPPORTED_LANGUAGES,
  type EditableProfile,
  getAvatarTheme,
  getDisplayInitial,
  getEditableProfileFromUser,
  normalizeAvatarLetter,
  resolveDisplayName,
} from "@/lib/profile";

interface PublicUserRow {
  display_name: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<EditableProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setAuthUser(user);

      const authProfile = getEditableProfileFromUser(user);
      const { data: publicUser } = await supabase
        .from("users")
        .select("display_name")
        .eq("id", user.id)
        .maybeSingle<PublicUserRow>();

      const displayName =
        resolveDisplayName(publicUser?.display_name, authProfile.displayName);

      setProfile({
        ...authProfile,
        displayName,
        avatarLetter: normalizeAvatarLetter(
          authProfile.avatarLetter,
          displayName,
          user.email
        ),
      });
      setLoading(false);
    };

    init();
  }, [router]);

  const handleSave = async () => {
    if (!authUser || !profile) return;

    setSaving(true);
    setMessage(null);

    const displayName =
      resolveDisplayName(profile.displayName);
    const avatarLetter = normalizeAvatarLetter(
      profile.avatarLetter,
      displayName,
      profile.email
    );
    const nextProfile: EditableProfile = {
      ...profile,
      displayName,
      avatarLetter,
      weeklyMatchTime: profile.weeklyMatchTime || DEFAULT_WEEKLY_MATCH_TIME,
    };

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        display_name: nextProfile.displayName,
        avatar_letter: nextProfile.avatarLetter,
        avatar_color: nextProfile.avatarColor,
        preferred_language: nextProfile.preferredLanguage,
        weekly_match_time: nextProfile.weeklyMatchTime,
      },
    });

    if (authError) {
      setSaving(false);
      setMessage({
        type: "error",
        text: authError.message || "Failed to save your settings.",
      });
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    let publicUserErrorMessage: string | null = null;

    if (!session?.access_token) {
      publicUserErrorMessage = "Missing session for profile sync.";
    } else {
      const syncResponse = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          displayName: nextProfile.displayName,
        }),
      });

      if (!syncResponse.ok) {
        const payload = (await syncResponse.json().catch(() => null)) as
          | { error?: string }
          | null;

        publicUserErrorMessage =
          payload?.error || "Failed to sync nickname for shared views.";
      }
    }

    setProfile(nextProfile);
    setSaving(false);

    if (publicUserErrorMessage) {
      setMessage({
        type: "error",
        text: "Saved your personal settings, but nickname sync for shared views failed.",
      });
      return;
    }

    setMessage({
      type: "success",
      text: "Settings saved.",
    });
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-on-surface-variant font-medium">
          Loading settings...
        </div>
      </div>
    );
  }

  const avatarTheme = getAvatarTheme(profile.avatarColor);

  return (
    <div className="min-h-screen bg-surface">
      <header className="flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <button
          onClick={() => router.push("/lounge")}
          className="flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors font-medium"
        >
          <ArrowLeft size={20} />
          Back to Lounge
        </button>
        <div className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
          Settings
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 pb-12 grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
        <section className="bg-surface-container-low rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter mb-2">
              Your Identity
            </h1>
            <p className="text-on-surface-variant text-lg">
              Set how you show up in ClashLingo. Avatar is letter-based for now.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                <UserRound size={16} />
                Display Nickname
              </label>
              <input
                type="text"
                value={profile.displayName}
                onChange={(event) =>
                  setProfile((current) =>
                    current
                      ? {
                          ...current,
                          displayName: event.target.value,
                          avatarLetter:
                            current.avatarLetter ===
                            getDisplayInitial(current.displayName, "L")
                              ? getDisplayInitial(event.target.value, "L")
                              : current.avatarLetter,
                        }
                      : current
                  )
                }
                placeholder="Language Warrior"
                className="w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40 rounded-2xl py-4 px-5 outline-none focus:ring-2 focus:ring-primary transition-all border border-surface-container"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                <Sparkles size={16} />
                Avatar Letter
              </label>
              <div className="flex gap-4 items-center">
                <input
                  type="text"
                  maxLength={1}
                  value={profile.avatarLetter}
                  onChange={(event) =>
                    setProfile((current) =>
                      current
                        ? {
                            ...current,
                            avatarLetter: event.target.value.toUpperCase(),
                          }
                        : current
                    )
                  }
                  className="w-24 bg-surface-container-lowest text-on-surface rounded-2xl py-4 px-5 text-center text-2xl font-black outline-none focus:ring-2 focus:ring-primary transition-all border border-surface-container"
                />
                <p className="text-sm text-on-surface-variant max-w-md">
                  Defaults to your nickname initial, but you can customize it.
                </p>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                <Palette size={16} />
                Avatar Color
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {AVATAR_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() =>
                      setProfile((current) =>
                        current ? { ...current, avatarColor: theme.id } : current
                      )
                    }
                    className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                      profile.avatarColor === theme.id
                        ? "border-primary bg-surface-container-lowest shadow-sm"
                        : "border-surface-container bg-surface-container-low hover:border-primary/40"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-full ${theme.avatarClassName} flex items-center justify-center font-black`}
                      >
                        {normalizeAvatarLetter(
                          profile.avatarLetter,
                          profile.displayName,
                          profile.email
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">{theme.label}</p>
                        <div
                          className={`w-6 h-6 rounded-full mt-1 ${theme.swatchClassName}`}
                        />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                Default Learning Language
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SUPPORTED_LANGUAGES.map((language) => (
                  <button
                    key={language}
                    type="button"
                    onClick={() =>
                      setProfile((current) =>
                        current
                          ? { ...current, preferredLanguage: language }
                          : current
                      )
                    }
                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                      profile.preferredLanguage === language
                        ? "bg-primary text-on-primary shadow-sm"
                        : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    {language}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                <Clock3 size={16} />
                Weekly Matching Time
              </label>
              <input
                type="time"
                value={profile.weeklyMatchTime}
                onChange={(event) =>
                  setProfile((current) =>
                    current
                      ? { ...current, weeklyMatchTime: event.target.value }
                      : current
                  )
                }
                className="w-full max-w-xs bg-surface-container-lowest text-on-surface rounded-2xl py-4 px-5 outline-none focus:ring-2 focus:ring-primary transition-all border border-surface-container"
              />
              <p className="text-sm text-on-surface-variant mt-3">
                This sets your weekly countdown preference. Matches can still
                start early if both players tap start.
              </p>
            </div>
          </div>

          {message && (
            <div
              className={`rounded-2xl px-5 py-4 text-sm font-medium ${
                message.type === "success"
                  ? "bg-secondary-container/30 text-on-secondary-container border border-secondary/20"
                  : "bg-red-50 text-red-700 border border-red-200"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto bg-primary text-on-primary px-8 py-4 rounded-2xl font-black text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {saving ? (
              "Saving..."
            ) : (
              <>
                <Save size={18} />
                Save Settings
              </>
            )}
          </button>
        </section>

        <aside className="bg-surface-container-lowest rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-6 h-fit">
          <div className="flex items-center gap-3">
            <div
              className={`w-16 h-16 rounded-[1.5rem] ${avatarTheme.avatarClassName} flex items-center justify-center text-3xl font-black shadow-sm`}
            >
              {normalizeAvatarLetter(
                profile.avatarLetter,
                profile.displayName,
                profile.email
              )}
            </div>
            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant">
                Live Preview
              </p>
              <h2 className="text-2xl font-black text-on-surface tracking-tight">
                {profile.displayName}
              </h2>
            </div>
          </div>

          <div className={`rounded-[2rem] p-6 ${avatarTheme.softClassName}`}>
            <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">
              Lounge Card Snapshot
            </p>
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl ${avatarTheme.avatarClassName} flex items-center justify-center text-2xl font-black shadow-sm`}
              >
                {normalizeAvatarLetter(
                  profile.avatarLetter,
                  profile.displayName,
                  profile.email
                )}
              </div>
              <div>
                <p className="font-black text-lg leading-none">
                  {profile.displayName}
                </p>
                <p className="text-sm opacity-80 mt-2">
                  {profile.preferredLanguage} learner
                </p>
                <p className="text-xs opacity-70 mt-1">
                  Weekly match time {profile.weeklyMatchTime}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-surface-container-low p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              Current Rules
            </p>
            <ul className="space-y-2 text-sm text-on-surface-variant">
              <li>Letter avatar only in this phase</li>
              <li>Nickname controls your default identity</li>
              <li>Weekly time is for countdown UX, not hard locking</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
