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
    copyPracticePrompt: "Copy Practice Prompt",
    practicePromptCopied: "Practice Prompt Copied",
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
    somethingWentWrongTitle: "Something went wrong",
    somethingWentWrongDescription:
      "The app hit a temporary issue. Try again, or go back to the start page.",
    tryAgain: "Try again",
    goHome: "Go home",
    pageNotFoundTitle: "This page is not available",
    pageNotFoundDescription:
      "The link may be old, or the page may have moved. Start from the scenario map or sign in again.",
  },
  landing: {
    languageToggleLabel: "Website Language",
    eyebrow: "Language practice that starts in real situations",
    title: "ClashLingo",
    description:
      "Clear scenario stages on your own, then challenge a friend whenever you want some competition.",
    primaryCta: "Start learning",
    secondaryCta: "Sign in",
    guideCta: "How it works",
    scenarioSignalTitle: "Scenario Map",
    scenarioSignalDescription:
      "Pick a real-life situation, read the scope, answer timed questions, and clear the stage at 80% accuracy.",
    friendSignalTitle: "Play with friends",
    friendSignalDescription:
      "Create a rivalry, generate a shared scope, take the exam, and compare results over time.",
    mapPreviewTitle: "Cafe stage 1",
    mapPreviewStage: "Timed clash",
    mapPreviewScope: "Scope ready",
    mapPreviewReport: "Standard answers after every run",
    pathsEyebrow: "Two ways to practice",
    pathsTitle: "Practice solo first, challenge a friend when you want.",
    pathsDescription:
      "Start from Scenarios to practice on your own. Rivalries are there whenever you want a weekly competition with a friend.",
    scenarioPathTitle: "Scenario quests",
    scenarioPathDescription:
      "A domain map, four-stage scenarios, AI-generated bilingual scope, timed practice, and durable progress.",
    rivalryPathTitle: "Friend rivalries",
    rivalryPathDescription:
      "A shared syllabus, weekly rhythm, optional early start, exam results, and long-term match history.",
    readinessEyebrow: "What you get",
    readinessTitle: "Everything you need to start practicing today.",
    readinessItems: [
      "Jump straight into a real-life scenario.",
      "Turn any scope into a practice prompt for your favorite AI chat.",
      "Your progress is saved and waiting when you come back.",
    ],
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
      scenarios: "Scenario Quests",
      lounge: "Battle Hub",
      rivalries: "Rivalries",
      scopes: "Battle Scope",
      settings: "Settings",
    },
    friendsGroupLabel: "With Friends",
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
    instructionLanguage: "Instruction Language",
    instructionLanguageHint:
      "This controls the explanation language used in scopes, exams, and review content. It does not change the target language you are studying.",
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
      "Start a rivalry with a friend and keep coming back each week to see who is learning faster.",
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
    roundCooldownTitle: "Next round unlocks soon",
    roundCooldownDescription: (time: string) =>
      `This rivalry can only open one new round every 24 hours. The next round unlocks after ${time}.`,
    roundCooldownButton: "Locked for now",
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
  newRound: {
    loading: "Loading...",
    back: "Back",
    title: "New Round",
    description:
      "Pick a topic, choose the default study window, and challenge your rival.",
    targetLevelDescription: (language: string, level: string) =>
      `This round will target ${language} at ${level} level.`,
    cooldownTitle: "One round per rivalry every 24 hours.",
    cooldownDescription: (time: string) =>
      `You can open the next round after ${time}.`,
    topicLabel: "Topic",
    topicPlaceholder: "e.g. At the Café, Ordering Food...",
    topicSuggestions: [
      "At the Café",
      "Ordering Food",
      "Travel & Directions",
      "Shopping & Prices",
      "Greetings & Introductions",
      "At the Hotel",
      "Weather & Seasons",
      "Family & Relationships",
    ],
    defaultWindowLabel: "Default Study Window",
    defaultWindowHint: (days: number) =>
      `By default, the exam unlocks after ${days} days. If you both want in sooner, you can still start early from the round.`,
    prizeLabel: "Prize / Stake",
    optional: "(optional)",
    prizePlaceholder: "e.g. Loser buys boba",
    errorTitle: "Could not create this round yet.",
    createRound: "Create Round",
    creatingRound: "Creating...",
    errors: {
      cooldownWithTime: (time: string) =>
        `This rivalry can start the next round after ${time}.`,
      cooldownNoTime: "This rivalry already started a round in the last 24 hours.",
      rivalryEnded: "This rivalry has ended and cannot start new rounds.",
      sessionExpired: "Your session expired. Please sign in again.",
      activeRoundExists: "Finish the active round before starting a new one.",
      createFailed: "Failed to create round.",
    },
  },
  round: {
    back: "Back",
    roundLabel: (roundNumber: number) => `Round ${roundNumber}`,
    topicSelectionTitle: (roundNumber: number) => `Round ${roundNumber}`,
    topicSelectionDescription:
      "Generate the scope for this round, then set the default study rhythm in motion.",
    labels: {
      topic: "Topic",
      language: "Language",
      defaultWindow: "Default Window",
      level: "Level",
      prize: "Prize",
    },
    daysValue: (days: number) => `${days} days`,
    scopeReadyHint:
      "Once the scope is ready, both players confirm it and the default study countdown begins. You can still start early later if you both want to.",
    generateScope: "Generate Scope",
    generatingScope: "Generating...",
    reviewConfirmTitle: "Review & Confirm",
    reviewConfirmDescription:
      "Both players confirm the scope first, then the default study countdown begins.",
    examScope: "Exam Scope",
    canDoObjectives: "Can-Do Objectives",
    confirmationStatus: "Confirmation Status",
    you: "You",
    rival: "Rival",
    ready: "Ready",
    pending: "Pending",
    confirmScope: "Confirm Scope",
    lockedInWaiting:
      "You're locked in. Waiting for your rival to confirm the scope...",
    defaultStudyWindowBadge: "Default Study Window",
    countdownDescription:
      "This is your default study rhythm. If both players are ready, you can start the exam early.",
    syncingExamStart: "Syncing the exam start...",
    studyMaterialTitle: "Your Study Material",
    studyMaterialDescription: (topic: string, language: string) =>
      `Topic: ${topic} • ${language}`,
    studyMaterialHint:
      "Study using your preferred tools and methods. The syllabus tells you what to learn — how you learn is up to you.",
    earlyStartTitle: "Start Early If You Both Want In",
    earlyStartDescription:
      "Weekly timing is just the default rhythm. Tap ready here if you want to jump into the exam before the countdown ends.",
    readyNow: "Ready Now",
    stillStudying: "Still Studying",
    starting: "Starting...",
    waitingForRival: "Waiting for rival...",
    readyToStartEarly: "Ready to Start Early",
    retryStartExam: "Try Start Again",
    stake: "Stake",
    examReadyTitle: "Exam is Ready",
    examReadyDescription:
      "The exam is unlocked. As soon as both players are ready, it goes live.",
    readyToEnterExam: "Ready to Enter Exam",
    examLiveTitle: "Exam is Live!",
    examLiveDescription: "Head to the exam page and give it your best shot!",
    goToExam: "Go to Exam",
    roundCompleteTitle: "Round Complete!",
    viewResults: "View Results",
    errors: {
      generateScopeFailed: "Failed to generate the scope. Please try again.",
      saveReadyFailed: "Failed to save your ready state.",
      refreshReadyFailed: "Failed to refresh the latest ready state.",
      unlockExamFailed: "Failed to unlock the exam early.",
      startExamFailed: "Failed to start the exam.",
    },
  },
  exam: {
    loading: "Loading exam...",
    answeredCount: (count: number, total: number) =>
      `${count}/${total} answered`,
    submit: "Submit",
    questionCounter: (current: number, total: number) =>
      `Q${current} of ${total}`,
    questionTypes: {
      mcq: "Multiple Choice",
      fitb: "Fill in the Blank",
      translation: "Translation",
    },
    flagged: "Flagged",
    flag: "Flag",
    fitbPlaceholder: "Type your answer...",
    translationPlaceholder: "Write your translation...",
    previous: "Previous",
    next: "Next",
    submitConfirmTitle: "Submit Exam?",
    submitProgress: (answered: number, total: number) =>
      `You've answered ${answered} of ${total} questions.`,
    unansweredWarning: (count: number) =>
      `${count} questions are unanswered.`,
    goBack: "Go Back",
    submitExam: "Submit",
    submitting: "Submitting...",
    errors: {
      submitFailed: "Failed to submit your exam. Please try again.",
    },
  },
  guide: {
    loginEyebrow: "How It Works",
    loginTitle: "Learn by scenarios, compete with friends",
    loginDescription:
      "Start with solo scenarios. Add friend rivalries when you want a weekly score comparison.",
    pageEyebrow: "How It Works",
    pageTitle: "ClashLingo, explained simply",
    pageDescription:
      "ClashLingo has two ways to practice: a solo Scenario Map for real-life situations, and friend rivalries for weekly competition.",
    shortVersionTitle: "The short version",
    shortVersionDescription:
      "Start from Scenarios when you want to learn now. Use Rivalries when you and a friend want a shared scope, a weekly rhythm, and a score comparison.",
    bestFirstStepEyebrow: "Best first step",
    bestFirstStepTitle: "Open the Scenario Map first.",
    bestFirstStepDescription:
      "Pick one real situation, clear stage 1, and the rest of the product becomes easier to understand.",
    loopEyebrow: "Friend rivalries",
    loopTitle: "How a friend rivalry works",
    loopDescription:
      "Rivalries are there whenever you want a shared weekly challenge with a friend.",
    productMapEyebrow: "Product Map",
    productMapTitle: "What each page is for",
    pathOverviewEyebrow: "Learning paths",
    pathOverviewTitle: "Two ways to practice, one clear starting point",
    pathOverviewDescription:
      "Start from Scenarios to practice on your own. Rivalries keep the friend-vs-friend workflow for when you want to compete.",
    pathCards: [
      {
        title: "Scenario Map",
        description:
          "Choose a real situation, learn the scoped material, answer timed questions, and clear stages by accuracy.",
      },
      {
        title: "With Friends",
        description:
          "Share a syllabus with a friend, follow a weekly rhythm, take the exam, and compare results.",
      },
    ],
    scenarioQuestEyebrow: "Scenario quests",
    scenarioQuestTitle: "How solo stages work",
    scenarioQuestDescription:
      "Each scenario has four stages. A generated battle pack gives you the bilingual scope, the timed run, and the report material.",
    scenarioQuestSteps: [
      {
        key: "choose_scene",
        title: "Choose a scene",
        description:
          "Start from a real situation such as a cafe, airport, or workplace.",
      },
      {
        key: "read_scope",
        title: "Read the scope",
        description:
          "Review can-do goals, vocabulary, grammar, expressions, and how the stage will test you.",
      },
      {
        key: "run_clash",
        title: "Answer timed prompts",
        description:
          "The clash run scores speed, accuracy, and expression quality, then shows standard answers for self-check.",
      },
      {
        key: "clear_stage",
        title: "Clear at 80%",
        description:
          "A stage clears when accuracy is at least 80%. Clearing advances your durable progress and unlocks the next stage.",
      },
    ],
    practicePromptTitle: "Copy Practice Prompt",
    practicePromptDescription:
      "Scenario scopes and rivalry scopes can be copied into an external AI chat. The prompt starts practice immediately, stays inside the scope, asks one item at a time, and gives short corrections.",
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
      eyebrow: "Where to start",
      title: "Open Scenario Map",
      description:
        "Practice can start without a friend. Create or join a rivalry later when you want shared competition.",
    },
    weeklyLoopCenterCompact: "Friend rivalries follow this weekly rhythm.",
    weeklyLoopCenterFull: "This weekly rhythm repeats after each rivalry round ends.",
    weeklyLoopEyebrow: "Weekly Rhythm",
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
        title: "Scenarios",
        description:
          "The main solo quest map: real situations, four-stage progress, timed runs, and unlocks.",
      },
      {
        title: "Lounge",
        description:
          "Countdowns, readiness, and entering the current friend match.",
      },
      {
        title: "Rivalries",
        description: "Wins, streaks, milestones, and match history.",
      },
      {
        title: "Scopes",
        description:
          "Reusable study material grouped by language, scenario, or round.",
      },
      {
        title: "Settings",
        description:
          "Nickname, avatar, language defaults, level, and weekly rhythm.",
      },
    ],
    faqs: [
      {
        question: "Where should a new learner start?",
        answer:
          "Start from Scenarios. The map gives a direct learning path without needing a friend first.",
      },
      {
        question: "How does a scenario stage clear?",
        answer:
          "A stage clears when your run reaches at least 80% accuracy. Speed and quality still show in the report, but accuracy unlocks progress.",
      },
      {
        question: "Do friend rivalries have to wait for the countdown?",
        answer:
          "No. The weekly rhythm is a guide, not a hard lock. If both players are ready, the round can start early.",
      },
      {
        question: "What is the difference between Lounge and Rivalries?",
        answer:
          "Lounge is for what is happening now: countdowns, readiness, and entering the match. Rivalries is the long-term history and stats view.",
      },
      {
        question: "When do rivalry scopes appear?",
        answer:
          "A scope appears as soon as the syllabus exists for a round. You do not need to wait for the exam to be created.",
      },
      {
        question: "What is Copy Practice Prompt for?",
        answer:
          "It turns the current scope into a prompt you can paste into an external AI chat for immediate, one-question-at-a-time practice.",
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
  scenarios: {
    pageEyebrow: "Scenario Map",
    pageTitle: "Pick a real situation, then level up inside it.",
    pageDescription:
      "ClashLingo vNext grows around real scenarios instead of generic weekly topics. Day one shows the whole map, then depth unlocks in layers.",
    pageHint:
      "Every scenario follows the same four-stage ladder: survive, react, compete, then dominate.",
    domainTabsLabel: "Domains",
    statusCountLabel: (count: number) => `${count} scenarios`,
    domainStartedScenarios: (count: number) => `${count} started`,
    domainClearedStages: (count: number) => `${count} stages cleared`,
    launchStatuses: {
      full: "Full",
      partial: "Partial",
      coming_soon: "Coming Soon",
    },
    launchStatusDescriptions: {
      full: "Fully playable from start to finish.",
      partial: "Open to play, with deeper stages still on the way.",
      coming_soon: "On the map already, but not open yet.",
    },
    backToMap: "Back to Scenarios",
    domainLabel: "Domain",
    templateLabel: "Template",
    openScenario: "Open Scenario",
    startScenario: "Start",
    continueScenario: "Continue",
    previewScenario: "Preview",
    chooseStageTitle: "Choose your stage",
    chooseStageDescription:
      "Every scenario uses the same four-stage ladder so users get stronger inside one real situation, not just across random topics.",
    stageLabel: (stage: number) => `Stage ${stage}`,
    stageNames: {
      survive: "Survive",
      react: "React",
      compete: "Compete",
      dominate: "Dominate",
    },
    stageReady: "Ready to play",
    stageLocked: "Coming soon",
    stageComingSoon: "Coming soon",
    stageNodeLabels: {
      completed: "Cleared",
      current: "Current",
      open: "Open",
      locked: "Locked",
    },
    openStageBriefing: "Open Briefing",
    briefingNext: "Open to see the briefing",
    noOpenStages: "No stages open yet",
    progressCleared: (completed: number, total: number) =>
      `Cleared ${completed}/${total}`,
    progressCurrentStage: (stage: number) => `Current: Stage ${stage}`,
    progressStartAt: (stage: number) => `Start at Stage ${stage}`,
    progressPreviewOnly: "Preview only for now",
    scopeFirstTitle: "Scope first, battle second",
    scopeFirstDescription:
      "You start with a quick briefing: review the scenario, your can-do goals, and the language moves, then choose Clash or Exam mode.",
    modePreviewTitle: "Modes after the briefing",
    modePreviewDescription:
      "Clash Mode is the fast, timed practice. Exam Mode is a calmer, more structured checkpoint.",
    modes: {
      clash: "Clash Mode",
      exam: "Exam Mode",
      practice: "Practice Mode",
    },
    comingSoonTitle: "More scenarios on the way",
    comingSoonDescription:
      "Every scenario is visible from the start. Some are fully playable now, some open one stage first, and others are on the way.",
    playableNowTitle: "Playable now",
    previewLaneTitle: "Preview lane",
    backToScenario: "Back to Scenario",
    briefingEyebrow: "Battle Briefing",
    briefingDescription:
      "Review the scenario scope first, then choose whether to enter Clash Mode or the more structured Exam mode.",
    briefingSummaryTitle: "What this battle is training",
    briefingCanDoTitle: "Can-do goals",
    briefingVocabularyTitle: "Vocabulary groups",
    briefingGrammarTitle: "Grammar patterns",
    briefingExpressionsTitle: "Useful expressions",
    briefingFollowUpsTitle: "Common follow-ups",
    briefingBattleRulesTitle: "Battle rules",
    briefingHowTestedTitle: "How you're tested",
    briefingTargetLanguageLabel: "Target Language",
    briefingLevelLabel: "Level",
    briefingQuestionMixLabel: "Question Mix",
    briefingQuestionMixValue: (quickCount: number, freeCount: number) =>
      `${quickCount} quick · ${freeCount} free response`,
    briefingTimerLabel: "Per-question timers",
    briefingTimerValue: (
      multipleChoiceSec: number,
      fillBlankSec: number,
      freeResponseSec: number
    ) =>
      `MCQ ${multipleChoiceSec}s · Fill ${fillBlankSec}s · Free ${freeResponseSec}s`,
    briefingChooseModeTitle: "Choose your lane",
    briefingChooseModeDescription:
      "Clash Mode is the fast battle path. Exam Mode stays here as a more structured checkpoint.",
    startClashMode: "Start Clash Mode",
    startExamMode: "Start Exam Mode",
    openExamMode: "Open Exam Mode",
    practiceLater: "Practice Later",
    unavailableStageTitle: "This stage is not live yet",
    unavailableStageDescription:
      "This stage isn't open yet. It's visible on the map so you can see what's coming — check back soon.",
    battleGenerating: "Generating this battle pack...",
    battleGenerateError:
      "Couldn't generate this battle pack. Go back and try again.",
    examLaneEyebrow: "Structured Checkpoint",
    examLaneTitle: "Take the stage exam before you climb",
    examLaneDescription:
      "Exam Mode uses the same scenario scope but removes the live opponent pressure. The goal here is cleaner recall, steadier phrasing, and a more structured mastery check.",
    examStartHint:
      "Start when you're ready for a quieter run. You still answer against the clock, but the report focuses on your own control instead of a score race.",
    examStructuredNote:
      "Use this lane when you want a cleaner checkpoint before the next rematch.",
    examCurrentScoreLabel: "Current checkpoint score",
    examProgressLabel: "Questions graded",
    battleLiveEyebrow: "Live Clash",
    battleLiveTitle: "Café battle is now in play",
    battleLiveDescription:
      "The battle runs on timer pressure and mixed question types. Each question shows the standard answer afterward so you can self-check, plus a real battle report at the end.",
    battleStart: "Start Battle",
    battleStartHint:
      "Start when you're ready. The timer starts on the first question, and you can check your answer against the standard one after each.",
    battleQuestionCounter: (current: number, total: number) =>
      `Question ${current} / ${total}`,
    battleTimerLabel: "Time left",
    battleScoreLabel: "Current score",
    battleReactionLabel: "Self-check note",
    battleCurrentPackLabel: "Current pack",
    battleSkillLabel: "Skill tags",
    battleSubmit: "Lock Answer",
    battleTimeout: "Time's up",
    battleFillBlankPlaceholder: "Type the missing word or phrase...",
    battleFreeResponsePlaceholder: "Type your short answer...",
    battleQuestionTypes: {
      multiple_choice: "Multiple Choice",
      fill_blank: "Fill in the Blank",
      short_free_response: "Short Free Response",
    },
    battleReportEyebrow: "Battle Report",
    battleReportTitle: "The clash is scored",
    battleReportDescription:
      "Your battle report for this scenario run: your score breakdown, the standard answer for every question, and an obvious next move.",
    battleReportMissingTitle: "No battle report yet",
    battleReportMissingDescription:
      "Finish a battle first, then the report will land here with your score race and practice cue.",
    examReportEyebrow: "Exam Report",
    examReportTitle: "The checkpoint is graded",
    examReportDescription:
      "This exam report focuses on your own control: total score, strongest answers, and the exact skill that should be tightened before the next battle.",
    examReportMissingTitle: "No exam report yet",
    examReportMissingDescription:
      "Finish an exam run first, then the checkpoint report will land here with your score and practice cue.",
    battleScoreBreakdownTitle: "Score breakdown",
    battleFastestAnswerTitle: "Fastest answer",
    battleBestSentenceTitle: "Best sentence",
    battleWeakPointTitle: "Weak point",
    battleQuestionReviewTitle: "Question review",
    battleQuestionReviewEmpty: "No answered questions yet.",
    battleRematch: "Rematch",
    examRetry: "Retake Exam",
    battleBackToBriefing: "Back to Briefing",
    battleBackToScenarios: "Back to Scenarios",
    battleNoAnswer: "No answer",
    battleYourAnswerLabel: "Your answer",
    battleStandardAnswerLabel: "Standard answer",
    battleOutcomeClearedTitle: "Stage cleared!",
    battleOutcomeFailedTitle: "Not cleared yet",
    battleOutcomeAccuracy: (correct, total, percent) =>
      `${correct}/${total} correct · ${percent}% accuracy`,
    battleOutcomeClearedHint: (percent) =>
      `You hit the ${percent}% accuracy needed to clear this stage.`,
    battleOutcomeFailedHint: (percent) =>
      `Reach ${percent}% accuracy to clear this stage. Review the standard answers and try again.`,
  },
  results: {
    loading: "Loading results...",
    reportEyebrow: "Round Report",
    victory: "Victory",
    tie: "Tie Game",
    defeat: "Defeat",
    waitingEyebrow: "Submission Locked",
    waitingTitle: "Your score is in",
    waitingDescription:
      "You submitted your exam. We will refresh this page as soon as your rival finishes.",
    you: "You",
    rival: "Rival",
    wonBy: (points: number) => `You won by ${points} pts`,
    lostBy: (points: number) => `You lost by ${points} pts`,
    tiedAt: (score: number) => `Tied at ${score}`,
    prizeWon: (prize: string) => `You won! Rival owes you: ${prize}`,
    prizeTied: "It's a tie — no prize this round!",
    prizeLost: (prize: string) => `You lost! You owe: ${prize}`,
    shareEyebrow: "Share Card",
    shareTitle: "Turn this round into a battle card",
    shareDescription:
      "Share the result, copy a caption, or download a card for your chat.",
    shareButton: "Share Result",
    copyCaption: "Copy Caption",
    captionCopied: "Caption Copied",
    downloadCard: "Download Card",
    cardDownloaded: "Card Downloaded",
    waitingShareHint: "Share tools unlock once both players submit.",
    stats: {
      round: "Round",
      language: "Language",
      topic: "Topic",
      score: "Score",
      accuracy: "Accuracy",
      delta: "Delta",
      perfect: "Perfect Answers",
    },
    noTopic: "No topic selected",
    deltaEven: "Even",
    deltaAhead: (points: number) => `+${points} ahead`,
    deltaBehind: (points: number) => `${points} behind`,
    perfectValue: (count: number, total: number) => `${count}/${total}`,
    studyMaterial: "Study Material",
    questionReview: "Question Review",
    yourAnswer: "Your Answer",
    correctAnswer: "Correct Answer",
    noAnswer: "(no answer)",
    questionTypes: {
      mcq: "Multiple Choice",
      fitb: "Fill in the Blank",
      translation: "Translation",
    },
    difficultyTitle: "How was the difficulty?",
    tooEasy: "Too Easy",
    justRight: "Just Right",
    tooHard: "Too Hard",
    feedbackThanks: "Thanks for your feedback!",
    backToRivalryHub: "Back to Rivalry Hub",
    backToLounge: "Lounge",
  },
} satisfies TranslationDictionary;
