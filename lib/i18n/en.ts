import type { TranslationDictionary } from "@/lib/i18n/types";

export const en = {
  websiteLanguageLabels: {
    en: "English",
    "zh-CN": "简体中文",
  },
  learningLanguageLabels: {
    French: "French",
    Spanish: "Spanish",
    Japanese: "Japanese",
    Korean: "Korean",
    Chinese: "Chinese",
    English: "English",
  },
  languageLevelLabels: {
    Beginner: "Beginner",
    Elementary: "Elementary",
    Intermediate: "Intermediate",
    Advanced: "Advanced",
  },
  roundStatusLabels: {
    topic_selection: "Topic Selection",
    confirming: "Scope Review",
    countdown: "Study Countdown",
    exam_ready: "Exam Ready",
    exam_live: "Exam Live",
    completed: "Completed",
  },
  common: {
    loading: "Loading...",
    loadingSettings: "Loading settings...",
    loadingGuide: "Loading guide...",
    loadingResetLink: "Loading reset link...",
    done: "Done",
    cancel: "Cancel",
    copyCode: "Copy Code",
    copied: "Copied!",
    saveSettings: "Save Settings",
    saving: "Saving...",
    goToLounge: "Go to Lounge",
    openFullGuide: "Open Full Guide",
    backToLogin: "Back to login",
    signIn: "Sign in",
    signUp: "Sign up",
    email: "Email",
    password: "Password",
    displayNickname: "Display Nickname",
    registeredEmail: "Registered Email",
    rivalFallback: "Rival",
    learnerSuffix: "learner",
    unassignedLanguage: "Unassigned",
  },
  login: {
    brandTagline:
      "Weekly language duels with a real rival, a real scope, and a real winner.",
    languageToggleLabel: "Website Language",
    cardTitles: {
      sign_in: "Enter the arena",
      sign_up: "Create your rivalry profile",
      forgot_password: "Reset your password",
      check_email: "Check your inbox",
    },
    cardDescriptions: {
      sign_in:
        "Sign in to manage your countdowns, rivalries, scopes, and settings.",
      sign_up:
        "Pick your identity now so your rival sees the right nickname from round one.",
      forgot_password:
        "We will email you a secure link so you can choose a new password.",
      check_email:
        "Confirm your email first, then come back and sign in to start your first rivalry.",
    },
    resendEmail: "Resend Email",
    forgotPassword: "Forgot password?",
    resendConfirmation: "Resend confirmation",
    rememberedPassword: "Remembered it?",
    rememberPrompt: "Remembered it?",
    alreadyHaveAccount: "Already have an account?",
    noAccountYet: "Don't have an account?",
    enterArena: "Enter the Arena",
    createAccount: "Create Account",
    sendResetLink: "Send Reset Link",
    nicknameRequired: "Display nickname is required.",
    emailRequiredForConfirmation:
      "Enter your email first so we know where to send the confirmation link.",
    emailRequiredForReset:
      "Enter your email first so we can send the reset link.",
    resendConfirmationFailed: "Could not resend the confirmation email.",
    resendConfirmationSuccess: (email: string) =>
      `A fresh confirmation email is on the way to ${email}.`,
    passwordResetFailed: "Could not send the password reset email.",
    passwordResetSent: (email: string) =>
      `Password reset email sent to ${email}. Open the link there to choose a new password.`,
    signInProfileSyncFailed: "Signed in, but profile sync failed.",
    signUpProfileSyncFailed:
      "Account created, but public profile sync failed.",
    emailNotConfirmed:
      "Your email is not confirmed yet. Resend the confirmation email below and then try again.",
    confirmationSent: "Confirmation sent",
    confirmationInstructions:
      "Open the email we just sent, confirm your account, then come back and sign in.",
    displayNicknamePlaceholder: "Language Warrior",
    emailPlaceholder: "warrior@example.com",
  },
  resetPassword: {
    eyebrow: "Password Recovery",
    title: "Choose a new password",
    description:
      "Pick a fresh password so you can get back into your rivalry queue.",
    openFromEmailTitle: "Open this page from your reset email",
    openFromEmailDescription:
      "This page needs the secure recovery link from your inbox. If you arrived here another way, go back and request a new password reset email from login.",
    newPassword: "New Password",
    confirmPassword: "Confirm Password",
    updatePassword: "Update Password",
    updateSuccess: "Password updated. You can head back to sign in now.",
    updateFailed: "Could not update your password.",
    minLengthError: "Your new password needs at least 6 characters.",
    mismatchError: "The two password fields do not match yet.",
    backToSignIn: "Back to Sign In",
  },
  sidebar: {
    items: {
      lounge: "Lounge",
      rivalries: "Rivalries",
      scopes: "Scopes",
      settings: "Settings",
    },
    guideTitle: "How It Works",
    guideDescription: "Quick product guide and FAQ",
    loungeRhythmTitle: "Lounge rhythm",
    loungeRhythmHint:
      "Your weekly default countdown pulse. Matches can still begin early.",
    logOut: "Log out",
  },
  settings: {
    title: "Your Identity",
    description: "Set how you show up in ClashLingo.",
    avatarLetter: "Avatar Letter",
    avatarLetterHint:
      "Defaults to your nickname initial, but you can customize it.",
    avatarColor: "Avatar Color",
    defaultLearningLanguage: "Default Learning Language",
    defaultLanguageLevel: "Default Language Level",
    defaultLanguageLevelHint:
      "New rivalries start with this level. If both players study the same language, ClashLingo uses the lower level when generating the shared scope and exam.",
    weeklyLoungeRhythm: "Weekly Lounge Rhythm",
    weeklyLoungeRhythmHint:
      "This is your default rhythm for new rivalries. Each rivalry keeps its own shared countdown pulse, and both players can still start early together.",
    websiteLanguage: "Website Language",
    websiteLanguageHint:
      "This changes the interface language only. It does not change your learning language or the AI content rules.",
    saved: "Settings saved.",
    saveFailed: "Failed to save your settings.",
    saveSharedSyncFailed:
      "Saved your personal settings, but shared profile sync failed.",
  },
  lounge: {
    eyebrow: "Match Control",
    title: "Your Lounge",
    description:
      "Keep an eye on the countdown, then jump straight into the next clash.",
    limitReached: "You've reached the 2-rivalry limit.",
    emptyTitle: "Learning alone is boring.",
    emptyDescription:
      "Crush your friends instead. Start a rivalry and see who learns faster.",
    createRivalry: "Create Rivalry",
    joinWithCode: "Join With Code",
    howItWorksTitle: "How ClashLingo Works",
    howItWorksDescription:
      "Start with one rivalry first. The real product is a weekly loop you keep repeating together.",
    readyToDuel: "Ready to Duel",
    inviteReady: "Invite Ready",
    matchUnlocksIn: "Match unlocks in",
    inviteCode: "Invite code",
    shareInviteHint: "Share this code so your rival can join.",
    startRound: "Start Round",
    openMatch: "Open Match",
    openStudyRound: "Open Study Round",
    takeExam: "Take Exam",
    nextStep: "Next step",
    pickTopic: "Pick a topic",
    topicSelectionHint:
      "Generate the scope to kick off this round, or sync up and start before the weekly timer if both players are ready.",
    confirmation: "Confirmation",
    bothConfirmed: "Both confirmed",
    youConfirmed: "You confirmed",
    yourConfirmationNeeded: "Your confirmation needed",
    rivalLockedInHint:
      "Your rival already locked in. Once you confirm, the study countdown begins.",
    bothConfirmHint:
      "Both players must confirm before the study countdown begins.",
    examUnlocksIn: "Exam unlocks in",
    countdownHint: (topic: string | null) =>
      topic
        ? `${topic} · keep studying, or both tap ready inside the round to start early.`
        : "Keep studying, or both tap ready inside the round to start early.",
    readyCheck: "Ready check",
    bothReady: "Both players ready",
    youAreReady: "You are ready",
    tapReady: "Tap ready when you are set",
    rivalReadyHint: "Your rival is already ready.",
    bothReadyHint: "The exam starts as soon as both players are ready.",
    liveNow: "Live now",
    examInProgress: "Exam in progress",
    examLiveHint: "Jump in and submit before your rival pulls ahead.",
    waitingForRival: "Waiting for rival",
    codeCopied: "Code Copied",
    youPending: "You pending",
    rivalPending: "Rival pending",
    rivalConfirmed: "Rival confirmed",
    youStillStudying: "You still studying",
    rivalStillStudying: "Rival still studying",
    youReady: "You ready",
    rivalReady: "Rival ready",
    createModalTitle: "Create a Rivalry",
    createModalDescription:
      "Pick your language, then share the code with your rival.",
    wantToLearn: "I want to learn",
    creating: "Creating...",
    createdTitle: "Rivalry Created!",
    createdDescription: "Share this code with your rival:",
    nextStepsTitle: "What happens next",
    nextSteps: [
      "Share this invite code with your rival.",
      "Once they join, this duel appears in your Lounge.",
      "Start a round, review the scope together, then study until the match begins.",
    ],
    joinModalTitle: "Join a Rivalry",
    joinModalDescription: "Enter the code your rival shared with you.",
    joining: "Joining...",
    joinRivalry: "Join Rivalry",
    errors: {
      createFailed: "Failed to create rivalry. Please try again.",
      rivalryLimit: "You can only be in 2 rivalries at a time.",
      inviteCodeNotFound: "Invite code not found.",
      ownRivalry: "You can't join your own rivalry!",
      rivalryFull: "This rivalry already has two players.",
      failedToJoinPrefix: "Failed to join:",
    },
    rhythmBadge: "Weekly rhythm",
    rhythmDescription: "The shared weekly pulse for this rivalry.",
    rhythmCountdownHint: (time: string) =>
      `Shared weekly pulse lands at ${time}. If both players want to play, start early.`,
    activeCountLabel: (count: number) => `${count} active`,
    completedCountLabel: (count: number) => `${count} completed`,
  },
  rivalries: {
    eyebrow: "Long Game",
    title: "Rivalry Hub",
    description: "Wins, streaks, milestones, and every showdown live here.",
    noRivalriesTitle: "No rivalries yet",
    noRivalriesDescription:
      "Head to the lounge to create or join your first rivalry.",
    rivalryEnded: "Rivalry ended",
    waitingForRival: "Waiting for rival",
    inviteReady: "Invite ready",
    endedBadge: "Ended",
    openBadge: "Open",
    viewBadge: "View",
    you: "You",
    rivalryMilestone: "Rivalry Milestone",
    firstMilestone: "Start your first showdown to build this rivalry.",
    playedMatchesMilestone: (count: number) =>
      `You've played ${count} matches together.`,
    historyTitle: "Match History",
    historyDescription: "Every showdown, topic, and winner lives here.",
    completedLabel: "Completed",
    noCompletedMatches:
      "No completed matches yet. Your rivalry history will fill this panel.",
    showdownLabel: (roundNumber: number) => `Week ${roundNumber} Showdown`,
    noTopicSelected: "No topic selected",
    winner: "Winner",
    tie: "Tie",
    nobody: "Nobody",
    liveRoundTitle: (roundNumber: number) => `Round ${roundNumber} is live`,
    readyForRoundTitle: (roundNumber: number) =>
      `Ready for Round ${roundNumber}?`,
    readyForRoundDescription:
      "Start a new round whenever you want the next showdown.",
    continueRound: "Continue Round",
    startRound: "Start Round",
    winsLabel: "W / L",
    streakLabel: "Streak",
    rivalryLevel: "Rivalry Level",
    leaveRivalryEyebrow: "Leave Rivalry",
    leaveRivalryTitle: "End this duel",
    leaveRivalryDescription:
      "Leaving keeps your match history, but removes this rivalry from the Lounge and blocks future rounds.",
    youAlreadyLeft: "You already left this rivalry.",
    rivalAlreadyLeft: (name: string) => `${name} already left this rivalry.`,
    finishActiveRound: "Finish the active round before leaving this rivalry.",
    leaveWarning:
      "This rivalry will move to history. It will disappear from the Lounge and can no longer start new rounds.",
    confirmLeave: "Confirm Leave",
    leaving: "Leaving...",
    closeInviteTitle: "Close this invite",
    closeInviteDescription:
      "If you no longer want this duel, you can archive it. The invite code will stop appearing in the Lounge.",
    closeInviteWarning:
      "This rivalry will move to history and stop accepting a joining rival.",
    inviteArchivedTitle: "Rivalry ended before a rival joined",
    inviteArchivedDescription:
      "This invite is archived now, so it no longer appears in the Lounge or accepts new rounds.",
    inviteShareDescription:
      "Share your invite code with a friend to bring this rivalry to life.",
    leaveUnavailableTitle: "Rivalry closed",
    leaveUnavailableDescriptionSelf:
      "You left this rivalry. History stays here, but this duel can no longer start new rounds.",
    leaveUnavailableDescriptionOther: (name: string) =>
      `${name} left this rivalry. History stays here, but this duel can no longer start new rounds.`,
    languageLabel: "Language",
    statusLabel: "Status",
    leaveSessionExpired: "Your session expired. Please sign in again.",
    leaveFailed: "Could not leave this rivalry.",
    rivalryLevels: {
      legendary: "Legendary Nemesis",
      fierce: "Fierce Nemesis",
      serious: "Serious Threat",
      fresh: "Fresh Challenger",
      warmup: "Warm-Up Duel",
    },
  },
  scopes: {
    title: "Exam Scopes",
    description:
      "Review what is in play right now and what you have already conquered.",
    currentScopes: "Current Scopes",
    pastScopes: "Past Scopes",
    noActiveScopes:
      "No active scope right now. Generate a syllabus in a round to see it here.",
    noPastScopes: "Completed rounds will appear here.",
    noSyllabusYet: "No syllabus available yet.",
    activeCountLabel: (count: number) => `${count} active`,
    completedCountLabel: (count: number) => `${count} completed`,
    reviewScope: "Review Scope",
    hideScope: "Hide Scope",
    goToRound: "Go to Round",
    scopeShort: "Scope",
    results: "Results",
    sections: {
      can_do: "Can-Do Goals",
      vocabulary: "Vocabulary",
      grammar: "Grammar",
      expressions: "Expressions",
      listening: "Listening",
    },
  },
  guide: {
    loginEyebrow: "How It Works",
    loginTitle: "Learn by dueling",
    loginDescription:
      "The easiest way to understand ClashLingo is to see the loop once. This is the fast version.",
    pageEyebrow: "How It Works",
    pageTitle: "ClashLingo, explained simply",
    pageDescription:
      "ClashLingo is a weekly 1v1 language duel. You and a friend study the same round, take the exam, compare scores, and keep the rivalry going over time.",
    shortVersionTitle: "The short version",
    shortVersionDescription:
      "One rivalry is one friend. Inside that rivalry, you keep repeating the same round loop: start the round, get the scope, confirm it, study or start early, take the exam, then compare results.",
    bestFirstStepEyebrow: "Best first step",
    bestFirstStepTitle: "Start one rivalry first.",
    bestFirstStepDescription:
      "Once you finish your first round, the rest of the app becomes much easier to understand.",
    loopEyebrow: "The Loop",
    loopTitle: "How a rivalry actually works",
    loopDescription:
      "Creating or joining a rivalry is just the setup. The real product is the weekly loop below.",
    productMapEyebrow: "Product Map",
    productMapTitle: "What each page is for",
    weeklyRhythmEyebrow: "Weekly Rhythm",
    weeklyRhythmTitle: "The countdown is a rhythm, not a lock",
    weeklyRhythmParagraphs: [
      "Your weekly time keeps the duel feeling regular. It tells both players when the rivalry normally comes alive.",
      "But if both players are ready, the match can still start early. ClashLingo should feel like a shared weekly rhythm, not a hard gate.",
    ],
    languageLevelEyebrow: "Language Level",
    languageLevelTitle: "Level helps the AI pitch the round correctly",
    languageLevelParagraphs: [
      "Your default level helps ClashLingo choose the right syllabus and exam difficulty.",
      "If both players study the same language at different levels, the round uses the lower level so the shared scope still works for both sides.",
    ],
    faqEyebrow: "FAQ",
    faqTitle: "Common questions",
    firstTimeSetup: {
      eyebrow: "First time only",
      title: "Create / Join Rivalry",
      description:
        "You only do this when starting with a new friend. After that, the same rivalry becomes your weekly loop.",
    },
    weeklyLoopCenterCompact: "This same round cycle repeats inside each rivalry.",
    weeklyLoopCenterFull: "The same cycle keeps repeating after each round ends.",
    weeklyLoopEyebrow: "Weekly Loop",
    weeklyLoopSteps: [
      {
        key: "start_round",
        title: "Start Round",
        description: "Pick the next weekly topic and open a fresh showdown.",
      },
      {
        key: "get_scope",
        title: "Get Scope",
        description:
          "Generate the study scope for this round's language and level.",
      },
      {
        key: "confirm_together",
        title: "Confirm Together",
        description:
          "Both players lock in the scope before the countdown starts.",
      },
      {
        key: "study_or_start_early",
        title: "Study or Start Early",
        description:
          "Follow the weekly rhythm, or jump in sooner if both players agree.",
      },
      {
        key: "take_exam",
        title: "Take Exam",
        description: "Answer the duel and submit your score for the round.",
      },
      {
        key: "compare_results",
        title: "Compare Results",
        description:
          "See who won, review the scope, and roll back into the next round.",
      },
    ],
    productSurfaces: [
      {
        title: "Lounge",
        description:
          "Countdowns, readiness, and entering the current match.",
      },
      {
        title: "Rivalries",
        description: "Wins, streaks, milestones, and match history.",
      },
      {
        title: "Scopes",
        description: "Study material grouped by language and round.",
      },
      {
        title: "Settings",
        description:
          "Nickname, avatar, language defaults, level, and weekly rhythm.",
      },
    ],
    faqs: [
      {
        question: "Do we have to wait for the countdown to finish?",
        answer:
          "No. The weekly rhythm is a guide, not a hard lock. If both players are ready, the round can start early.",
      },
      {
        question: "What is the difference between Lounge and Rivalries?",
        answer:
          "Lounge is for what is happening now: countdowns, readiness, and entering the match. Rivalries is the long-term history and stats view.",
      },
      {
        question: "When do scopes appear?",
        answer:
          "A scope appears as soon as the syllabus exists for a round. You do not need to wait for the exam to be created.",
      },
      {
        question: "What does language level actually change?",
        answer:
          "It helps ClashLingo choose the right syllabus and exam difficulty. It does not block matchmaking or change scoring rules.",
      },
      {
        question: "Why is a rivalry missing from Lounge?",
        answer:
          "Only active rivalries stay in Lounge. If a rivalry was left, it moves out of Lounge and remains in Rivalries as history.",
      },
    ],
  },
} satisfies TranslationDictionary;
