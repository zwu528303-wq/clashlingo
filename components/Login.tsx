"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import {
  ArrowRight,
  CheckCircle2,
  CircleHelp,
  Loader2,
  Lock,
  Mail,
  RotateCcw,
  UserRound,
} from "lucide-react";
import HowItWorksLoop from "@/components/HowItWorksLoop";
import {
  getDictionary,
  persistWebsiteLanguage,
  resolveClientWebsiteLanguage,
  type WebsiteLanguage,
} from "@/lib/i18n";
import { supabase } from "../lib/supabase";
import { DEFAULT_LANGUAGE_LEVEL } from "@/lib/language-level";
import {
  getEditableProfileFromUser,
  resolveDisplayName,
} from "@/lib/profile";

type AuthView = "sign_in" | "sign_up" | "forgot_password" | "check_email";

type MessageState = {
  type: "success" | "error" | "info";
  text: string;
} | null;

function getRedirectTo(path: string) {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}${path}`;
}

export default function Login() {
  const router = useRouter();
  const [view, setView] = useState<AuthView>("sign_in");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<MessageState>(null);
  const [pendingEmail, setPendingEmail] = useState("");
  const [websiteLanguage, setWebsiteLanguage] = useState<WebsiteLanguage>(
    () => resolveClientWebsiteLanguage()
  );
  const [languageTouched, setLanguageTouched] = useState(false);

  const isSignUp = view === "sign_up";
  const isForgotPassword = view === "forgot_password";
  const isCheckEmail = view === "check_email";
  const dictionary = getDictionary(websiteLanguage);

  const setLanguagePreference = (nextLanguage: WebsiteLanguage) => {
    setWebsiteLanguage(nextLanguage);
    setLanguageTouched(true);
    persistWebsiteLanguage(nextLanguage);
  };

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

  const switchView = (nextView: AuthView) => {
    setView(nextView);
    setMessage(null);
    if (nextView === "sign_in") {
      setPassword("");
    }
  };

  const handleResendConfirmation = async () => {
    const resendEmail = (pendingEmail || email).trim();
    if (!resendEmail) {
      setMessage({
        type: "error",
        text: dictionary.login.emailRequiredForConfirmation,
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email: resendEmail,
      options: {
        emailRedirectTo: getRedirectTo("/"),
      },
    });

    if (error) {
      setMessage({
        type: "error",
        text: error.message || dictionary.login.resendConfirmationFailed,
      });
      setLoading(false);
      return;
    }

    setMessage({
      type: "success",
      text: dictionary.login.resendConfirmationSuccess(resendEmail),
    });
    setLoading(false);
  };

  const handlePasswordReset = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setMessage({
        type: "error",
        text: dictionary.login.emailRequiredForReset,
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: getRedirectTo("/reset-password"),
    });

    if (error) {
      setMessage({
        type: "error",
        text: error.message || dictionary.login.passwordResetFailed,
      });
      setLoading(false);
      return;
    }

    setMessage({
      type: "success",
      text: dictionary.login.passwordResetSent(trimmedEmail),
    });
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (isForgotPassword) {
      await handlePasswordReset();
      return;
    }

    if (isSignUp) {
      const trimmedDisplayName = displayName.trim();
      if (!trimmedDisplayName) {
        setMessage({
          type: "error",
          text: dictionary.login.nicknameRequired,
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getRedirectTo("/"),
          data: {
            display_name: resolveDisplayName(trimmedDisplayName),
            default_language_level: DEFAULT_LANGUAGE_LEVEL,
            website_language: websiteLanguage,
            instruction_language: websiteLanguage,
          },
        },
      });

      if (error) {
        setMessage({
          type: "error",
          text: error.message,
        });
        setLoading(false);
        return;
      }

      if (data.user && data.session?.access_token) {
        try {
          await syncPublicProfile(data.user, data.session.access_token);
        } catch (syncError) {
          setMessage({
            type: "error",
            text:
              syncError instanceof Error
                ? syncError.message
                : dictionary.login.signUpProfileSyncFailed,
          });
          setLoading(false);
          return;
        }
      }

      persistWebsiteLanguage(websiteLanguage);
      setPendingEmail(email.trim());
      setView("check_email");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      const lowerMessage = error.message.toLowerCase();
      setMessage({
        type: "error",
        text:
          lowerMessage.includes("email not confirmed")
            ? dictionary.login.emailNotConfirmed
            : error.message,
      });
      setLoading(false);
      return;
    }

    if (data.user) {
      const resolvedLanguage = languageTouched
        ? websiteLanguage
        : getEditableProfileFromUser(data.user).websiteLanguage;

      if (languageTouched) {
        const { error: languageUpdateError } = await supabase.auth.updateUser({
          data: {
            website_language: websiteLanguage,
          },
        });

        if (languageUpdateError) {
          setMessage({
            type: "error",
            text: languageUpdateError.message,
          });
          setLoading(false);
          return;
        }
      }

      persistWebsiteLanguage(resolvedLanguage);
    }

    if (data.user && data.session?.access_token) {
      try {
        await syncPublicProfile(data.user, data.session.access_token);
      } catch (syncError) {
        setMessage({
          type: "error",
          text:
            syncError instanceof Error
              ? syncError.message
              : dictionary.login.signInProfileSyncFailed,
        });
        setLoading(false);
        return;
      }
    }

    router.push("/lounge");
  };

  const cardTitle = isForgotPassword
    ? dictionary.login.cardTitles.forgot_password
    : isSignUp
      ? dictionary.login.cardTitles.sign_up
      : isCheckEmail
        ? dictionary.login.cardTitles.check_email
        : dictionary.login.cardTitles.sign_in;

  const cardDescription = isForgotPassword
    ? dictionary.login.cardDescriptions.forgot_password
    : isSignUp
      ? dictionary.login.cardDescriptions.sign_up
      : isCheckEmail
        ? dictionary.login.cardDescriptions.check_email
        : dictionary.login.cardDescriptions.sign_in;

  return (
    <div className="min-h-screen bg-surface p-4 md:p-6 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-primary-container/40 rounded-full blur-3xl mix-blend-multiply opacity-70" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-secondary-container/40 rounded-full blur-3xl mix-blend-multiply opacity-70" />

      <div className="relative z-10 max-w-[1320px] mx-auto grid grid-cols-1 xl:grid-cols-[410px_minmax(0,1fr)] gap-6 items-start">
        <section className="space-y-6">
          <div className="text-center xl:text-left">
            <div className="mb-5 inline-flex items-center gap-1 rounded-full border border-white/80 bg-white/85 p-1 shadow-sm">
              <span className="px-3 text-[11px] font-black uppercase tracking-[0.18em] text-on-surface-variant">
                {dictionary.login.languageToggleLabel}
              </span>
              {(["en", "zh-CN"] as const).map((language) => (
                <button
                  key={language}
                  type="button"
                  onClick={() => setLanguagePreference(language)}
                  className={`rounded-full px-3 py-2 text-sm font-black transition-all ${
                    websiteLanguage === language
                      ? "bg-primary text-on-primary shadow-sm"
                      : "text-on-surface-variant hover:text-primary"
                  }`}
                >
                  {dictionary.websiteLanguageLabels[language]}
                </button>
              ))}
            </div>
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary-container rounded-[2rem] mb-6 rotate-12 shadow-sm">
              <span className="text-4xl">⚔️</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter mb-2">
              ClashLingo
            </h1>
            <p className="text-on-surface-variant font-medium text-lg">
              {dictionary.login.brandTagline}
            </p>
          </div>

          <div className="bg-surface-container-lowest p-8 rounded-[2.5rem] shadow-sm border border-white/80">
            <div className="space-y-2 mb-6">
              <h2 className="text-3xl font-black text-on-surface tracking-tight">
                {cardTitle}
              </h2>
              <p className="text-on-surface-variant leading-relaxed">
                {cardDescription}
              </p>
            </div>

            {isCheckEmail ? (
              <div className="space-y-5">
                <div className="rounded-[2rem] border border-secondary/15 bg-secondary-container/20 p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                      <CheckCircle2 size={22} />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-[0.18em] text-on-surface-variant">
                        {dictionary.login.confirmationSent}
                      </p>
                      <p className="text-on-surface font-bold">
                        {pendingEmail || email}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {dictionary.login.confirmationInstructions}
                  </p>
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
                    onClick={handleResendConfirmation}
                    disabled={loading}
                    className="w-full bg-primary text-on-primary py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm disabled:opacity-60"
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        <RotateCcw size={18} />
                        {dictionary.login.resendEmail}
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => switchView("sign_in")}
                    className="w-full bg-surface-container-low text-on-surface py-4 rounded-2xl font-bold hover:bg-surface-container transition-all"
                  >
                    {dictionary.resetPassword.backToSignIn}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  data-testid="login-form"
                >
                  <div className="space-y-4">
                    {isSignUp && (
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                          {dictionary.common.displayNickname}
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
                            onChange={(event) => setDisplayName(event.target.value)}
                            className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary transition-all"
                            placeholder={dictionary.login.displayNicknamePlaceholder}
                            maxLength={32}
                            data-testid="login-display-name-input"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                        {dictionary.common.email}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <Mail size={20} className="text-on-surface-variant/50" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(event) => setEmail(event.target.value)}
                          className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary transition-all"
                          placeholder={dictionary.login.emailPlaceholder}
                          data-testid="login-email-input"
                        />
                      </div>
                    </div>

                    {!isForgotPassword && (
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2 ml-1">
                          {dictionary.common.password}
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Lock size={20} className="text-on-surface-variant/50" />
                          </div>
                          <input
                            type="password"
                            required
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            className="w-full bg-surface-container-low text-on-surface placeholder:text-on-surface-variant/40 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-primary transition-all"
                            placeholder="••••••••"
                            minLength={6}
                            data-testid="login-password-input"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {message && (
                    <div
                      className={`text-sm text-center font-medium px-4 py-3 rounded-xl ${
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-on-primary py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all shadow-sm group disabled:opacity-60"
                    data-testid="login-submit-button"
                  >
                    {loading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : (
                      <>
                        {isForgotPassword
                          ? dictionary.login.sendResetLink
                          : isSignUp
                            ? dictionary.login.createAccount
                            : dictionary.login.enterArena}
                        <ArrowRight
                          size={20}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </>
                    )}
                  </button>
                </form>

                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
                  {view === "sign_in" ? (
                    <>
                      <button
                        onClick={() => switchView("forgot_password")}
                        className="font-medium text-on-surface-variant hover:text-primary"
                      >
                        {dictionary.login.forgotPassword}
                      </button>
                      <button
                        onClick={handleResendConfirmation}
                        disabled={loading}
                        className="font-medium text-on-surface-variant hover:text-primary disabled:opacity-60"
                      >
                        {dictionary.login.resendConfirmation}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => switchView("sign_in")}
                      className="font-medium text-on-surface-variant hover:text-primary"
                    >
                      {dictionary.resetPassword.backToSignIn}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>

          {!isCheckEmail && (
            <p className="text-center xl:text-left text-on-surface-variant text-sm">
              {isSignUp
                ? dictionary.login.alreadyHaveAccount
                : isForgotPassword
                  ? dictionary.login.rememberedPassword
                  : dictionary.login.noAccountYet}{" "}
              <button
                onClick={() =>
                  switchView(
                    isSignUp || isForgotPassword ? "sign_in" : "sign_up"
                  )
                }
                className="text-primary font-bold hover:underline"
              >
                {isSignUp || isForgotPassword
                  ? dictionary.common.signIn
                  : dictionary.common.signUp}
              </button>
            </p>
          )}
        </section>

        <section className="bg-gradient-to-br from-surface-container-lowest via-white to-surface-container-low rounded-[2.8rem] p-7 md:p-8 shadow-[0_24px_60px_rgba(149,63,77,0.08)] border border-white/80 space-y-7">
          <div className="space-y-3">
            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-on-surface-variant">
              {dictionary.guide.loginEyebrow}
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-on-surface tracking-[-0.06em] leading-none">
              {dictionary.guide.loginTitle}
            </h2>
            <p className="text-on-surface-variant text-lg leading-relaxed">
              {dictionary.guide.loginDescription}
            </p>
          </div>

          <HowItWorksLoop compact websiteLanguage={websiteLanguage} />

          <button
            onClick={() => router.push("/how-it-works")}
            className="w-full rounded-[1.6rem] border border-white/80 bg-white/85 px-5 py-4 font-black text-on-surface transition-all hover:text-primary hover:translate-y-[-1px] flex items-center justify-center gap-2"
          >
            <CircleHelp size={18} />
            {dictionary.common.openFullGuide}
          </button>
        </section>
      </div>
    </div>
  );
}
