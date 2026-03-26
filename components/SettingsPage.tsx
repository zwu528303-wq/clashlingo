"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  Clock3,
  Mail,
  Palette,
  Save,
  Sparkles,
  UserRound,
} from "lucide-react";
import AppSidebar from "@/components/AppSidebar";
import {
  getDictionary,
  getLocalizedLanguageLevelLabel,
  getLocalizedLearningLanguageLabel,
  persistWebsiteLanguage,
  resolveClientWebsiteLanguage,
  WEBSITE_LANGUAGES,
} from "@/lib/i18n";
import { supabase } from "@/lib/supabase";
import { LANGUAGE_LEVELS } from "@/lib/language-level";
import {
  AVATAR_THEMES,
  DEFAULT_LANGUAGE_LEVEL,
  DEFAULT_WEEKLY_MATCH_TIME,
  SUPPORTED_LANGUAGES,
  type EditableProfile,
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
  const [fallbackWebsiteLanguage] = useState(resolveClientWebsiteLanguage());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const dictionary = getDictionary(
    profile?.websiteLanguage ?? fallbackWebsiteLanguage
  );

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
          displayName
        ),
      });
      persistWebsiteLanguage(authProfile.websiteLanguage);
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
      displayName
    );
    const nextProfile: EditableProfile = {
      ...profile,
      displayName,
      avatarLetter,
      defaultLanguageLevel:
        profile.defaultLanguageLevel || DEFAULT_LANGUAGE_LEVEL,
      weeklyMatchTime: profile.weeklyMatchTime || DEFAULT_WEEKLY_MATCH_TIME,
    };

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        display_name: nextProfile.displayName,
        avatar_letter: nextProfile.avatarLetter,
        avatar_color: nextProfile.avatarColor,
        preferred_language: nextProfile.preferredLanguage,
        default_language_level: nextProfile.defaultLanguageLevel,
        weekly_match_time: nextProfile.weeklyMatchTime,
        website_language: nextProfile.websiteLanguage,
      },
    });

    if (authError) {
      setSaving(false);
      setMessage({
        type: "error",
        text: authError.message || dictionary.settings.saveFailed,
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
          avatarLetter: nextProfile.avatarLetter,
          avatarColor: nextProfile.avatarColor,
        }),
      });

      if (!syncResponse.ok) {
        const payload = (await syncResponse.json().catch(() => null)) as
          | { error?: string }
          | null;

        publicUserErrorMessage =
          payload?.error || "Failed to sync shared profile details.";
      }
    }

    setProfile(nextProfile);
    persistWebsiteLanguage(nextProfile.websiteLanguage);
    setSaving(false);

    if (publicUserErrorMessage) {
      setMessage({
        type: "error",
        text: dictionary.settings.saveSharedSyncFailed,
      });
      return;
    }

    setMessage({
      type: "success",
      text: dictionary.settings.saved,
    });
  };

  if (loading || !profile) {
    return (
        <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="text-on-surface-variant font-medium">
          {dictionary.common.loadingSettings}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-6 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-6 lg:gap-8">
        <AppSidebar active="settings" profile={profile} />

        <main className="space-y-8" data-testid="settings-shell">
          <section
            className="max-w-4xl bg-surface-container-low rounded-[2.5rem] p-8 md:p-10 shadow-sm space-y-8"
            data-testid="settings-form"
          >
          <div>
            <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter mb-2">
              {dictionary.settings.title}
            </h1>
            <p className="text-on-surface-variant text-lg">
              {dictionary.settings.description}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                <Mail size={16} />
                {dictionary.common.registeredEmail}
              </label>
              <input
                type="email"
                value={profile.email}
                readOnly
                className="w-full bg-surface-container text-on-surface-variant rounded-2xl py-4 px-5 outline-none border border-surface-container cursor-default"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                <UserRound size={16} />
                {dictionary.common.displayNickname}
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
                placeholder={dictionary.login.displayNicknamePlaceholder}
                className="w-full bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/40 rounded-2xl py-4 px-5 outline-none focus:ring-2 focus:ring-primary transition-all border border-surface-container"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                <Sparkles size={16} />
                {dictionary.settings.avatarLetter}
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
                  {dictionary.settings.avatarLetterHint}
                </p>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                <Palette size={16} />
                {dictionary.settings.avatarColor}
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
                    className={`rounded-2xl border px-4 py-4 min-h-[8.5rem] transition-all ${
                      profile.avatarColor === theme.id
                        ? "border-primary bg-surface-container-lowest shadow-sm"
                        : "border-surface-container bg-surface-container-low hover:border-primary/40"
                    }`}
                  >
                    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                      <div
                        className={`w-16 h-16 shrink-0 rounded-[1.4rem] ${theme.avatarClassName} flex items-center justify-center text-3xl font-black shadow-sm`}
                      >
                        {normalizeAvatarLetter(
                          profile.avatarLetter,
                          profile.displayName
                        )}
                      </div>
                      <p className="font-bold text-on-surface text-lg leading-none">
                        {theme.label}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                {dictionary.settings.defaultLearningLanguage}
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
                    {getLocalizedLearningLanguageLabel(
                      language,
                      profile.websiteLanguage
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                {dictionary.settings.defaultLanguageLevel}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {LANGUAGE_LEVELS.map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() =>
                      setProfile((current) =>
                        current
                          ? { ...current, defaultLanguageLevel: level }
                          : current
                      )
                    }
                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                      profile.defaultLanguageLevel === level
                        ? "bg-primary text-on-primary shadow-sm"
                        : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    {getLocalizedLanguageLevelLabel(
                      level,
                      profile.websiteLanguage
                    )}
                  </button>
                ))}
              </div>
              <p className="text-sm text-on-surface-variant mt-3">
                {dictionary.settings.defaultLanguageLevelHint}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                {dictionary.settings.websiteLanguage}
              </label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                {WEBSITE_LANGUAGES.map((language) => (
                  <button
                    key={language}
                    type="button"
                    onClick={() =>
                      setProfile((current) =>
                        current
                          ? { ...current, websiteLanguage: language }
                          : current
                      )
                    }
                    className={`py-3 px-4 rounded-xl font-bold text-sm transition-all ${
                      profile.websiteLanguage === language
                        ? "bg-primary text-on-primary shadow-sm"
                        : "bg-surface-container-low text-on-surface hover:bg-surface-container"
                    }`}
                  >
                    {dictionary.websiteLanguageLabels[language]}
                  </button>
                ))}
              </div>
              <p className="text-sm text-on-surface-variant mt-3">
                {dictionary.settings.websiteLanguageHint}
              </p>
            </div>

            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">
                <Clock3 size={16} />
                {dictionary.settings.weeklyLoungeRhythm}
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
                {dictionary.settings.weeklyLoungeRhythmHint}
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
              dictionary.common.saving
            ) : (
              <>
                <Save size={18} />
                {dictionary.common.saveSettings}
              </>
            )}
          </button>
          </section>
        </main>
      </div>
    </div>
  );
}
