import type {
  LocalizedText,
  Scenario,
  ScenarioDomain,
  ScenarioDomainDefinition,
  ScenarioTemplate,
  StageDefinition,
  StageNumber,
} from "@/lib/scenario-types";

function t(en: string, zhCN: string): LocalizedText {
  return { en, "zh-CN": zhCN };
}

export const SCENARIO_DOMAIN_ORDER: ScenarioDomain[] = [
  "life",
  "social",
  "school",
  "work",
];

export const SCENARIO_DOMAINS: ScenarioDomainDefinition[] = [
  {
    key: "life",
    name: t("Life", "生活"),
    description: t(
      "Everyday requests, errands, and survival moments in the real world.",
      "真实生活里的日常请求、办事场景和生存对话。"
    ),
  },
  {
    key: "social",
    name: t("Social", "社交"),
    description: t(
      "Conversations that live or die on natural reactions and chemistry.",
      "靠自然反应和互动氛围撑起来的社交对话。"
    ),
  },
  {
    key: "school",
    name: t("School", "学校"),
    description: t(
      "Classroom, campus, and academic moments where you have to think fast.",
      "课堂、校园和学术场景里需要快速反应的表达。"
    ),
  },
  {
    key: "work",
    name: t("Work", "工作"),
    description: t(
      "Professional situations where clarity, pace, and confidence matter.",
      "在职场语境里，清晰度、节奏感和自信都很重要。"
    ),
  },
];

export const SCENARIO_TEMPLATE_LABELS: Record<ScenarioTemplate, LocalizedText> =
  {
    request: t("Request", "请求"),
    social: t("Social", "社交"),
    problem: t("Problem", "问题处理"),
    task: t("Task", "任务表达"),
  };

export const SCENARIO_STAGE_DEFINITIONS: StageDefinition[] = [
  {
    stage: 1,
    name: "survive",
    summary: t(
      "Give a basic correct response and stay afloat.",
      "先给出基本正确的反应，稳住局面。"
    ),
    goals: [
      t("Understand the core move in this scenario.", "先看懂这个场景最核心的动作。"),
      t("Produce one short correct answer under light pressure.", "在轻压力下说出一句正确短答。"),
    ],
  },
  {
    stage: 2,
    name: "react",
    summary: t(
      "Handle common follow-ups with more speed and confidence.",
      "更快、更稳地接住常见追问。"
    ),
    goals: [
      t("Respond to common follow-up questions without freezing.", "遇到常见追问时不要卡住。"),
      t("Build slightly fuller answers while keeping pace.", "在保持速度的同时把答案说得更完整。"),
    ],
  },
  {
    stage: 3,
    name: "compete",
    summary: t(
      "Answer under pressure, handle changes, and push back when needed.",
      "在压力下答题、处理变化，并在需要时顶住场面。"
    ),
    goals: [
      t("Stay clear when the situation shifts.", "场景变化时还能把话说明白。"),
      t("Hold up against a more aggressive opponent rhythm.", "在更有压迫感的对手节奏下也能稳住。"),
    ],
  },
  {
    stage: 4,
    name: "dominate",
    summary: t(
      "Respond quickly, naturally, and with flexible control.",
      "做到反应快、表达自然、临场控制更灵活。"
    ),
    goals: [
      t("Use richer language without losing speed.", "用更丰富的表达，同时不丢速度。"),
      t("Handle nuanced requests or turns naturally.", "自然应对更细微的需求和对话转折。"),
    ],
  },
];

export const SCENARIOS: Scenario[] = [
  {
    slug: "cafe",
    name: t("Café", "咖啡馆"),
    domain: "life",
    template: "request",
    summary: t(
      "Order, customize, and fix a simple café interaction without freezing.",
      "围绕点单、改单和追问，稳稳打完一场咖啡馆对话。"
    ),
    launchStatus: "full",
    availableStages: [1, 2],
  },
  {
    slug: "restaurant",
    name: t("Restaurant", "餐厅"),
    domain: "life",
    template: "request",
    summary: t(
      "Handle menus, order changes, and table-side follow-ups at dinner pace.",
      "围绕菜单、改单和桌边追问，打好餐厅对话。"
    ),
    launchStatus: "full",
    availableStages: [1, 2],
  },
  {
    slug: "shopping",
    name: t("Shopping", "购物"),
    domain: "life",
    template: "request",
    summary: t(
      "Ask for sizes, colors, prices, and changes while staying quick and polite.",
      "在问尺码、颜色、价格和换货时保持又快又礼貌。"
    ),
    launchStatus: "partial",
    availableStages: [1],
  },
  {
    slug: "hotel",
    name: t("Hotel", "酒店"),
    domain: "life",
    template: "request",
    summary: t(
      "Check in, ask for room help, and react to hospitality follow-ups.",
      "围绕入住、房间需求和酒店追问做出快速反应。"
    ),
    launchStatus: "partial",
    availableStages: [1],
  },
  {
    slug: "airport",
    name: t("Airport", "机场"),
    domain: "life",
    template: "problem",
    summary: t(
      "Navigate travel pressure when a request turns into a small problem.",
      "在旅行压力下处理请求和小问题。"
    ),
    launchStatus: "partial",
    availableStages: [1],
  },
  {
    slug: "doctor-visit",
    name: t("Doctor Visit", "看医生"),
    domain: "life",
    template: "problem",
    summary: t(
      "Describe symptoms, clarify concerns, and stay composed in a clinic setting.",
      "在诊室里说明症状、补充细节并稳住表达。"
    ),
    launchStatus: "coming_soon",
    availableStages: [],
  },
  {
    slug: "small-talk",
    name: t("Small Talk", "闲聊"),
    domain: "social",
    template: "social",
    summary: t(
      "Start, answer, and keep a light conversation moving without awkward pauses.",
      "开启、接住并延续一段不尴尬的轻社交对话。"
    ),
    launchStatus: "full",
    availableStages: [1, 2],
  },
  {
    slug: "first-date",
    name: t("First Date", "第一次约会"),
    domain: "social",
    template: "social",
    summary: t(
      "Balance curiosity, warmth, and natural follow-ups on a first date.",
      "在第一次约会里兼顾好奇、自然和礼貌互动。"
    ),
    launchStatus: "coming_soon",
    availableStages: [],
  },
  {
    slug: "party",
    name: t("Party", "聚会"),
    domain: "social",
    template: "social",
    summary: t(
      "Jump into fast-moving party conversations and keep your footing.",
      "在节奏更快的聚会对话里稳住自己的表达。"
    ),
    launchStatus: "coming_soon",
    availableStages: [],
  },
  {
    slug: "texting",
    name: t("Texting", "发消息"),
    domain: "social",
    template: "social",
    summary: t(
      "Practice short-form back-and-forth replies that still feel natural.",
      "练习简短却自然的来回消息回复。"
    ),
    launchStatus: "coming_soon",
    availableStages: [],
  },
  {
    slug: "roommate-conversation",
    name: t("Roommate Conversation", "室友日常交流"),
    domain: "social",
    template: "social",
    summary: t(
      "Handle everyday roommate conversation without sounding robotic.",
      "在日常室友交流里说得自然，不像背课文。"
    ),
    launchStatus: "partial",
    availableStages: [1],
  },
  {
    slug: "roommate-conflict",
    name: t("Roommate Conflict", "室友冲突"),
    domain: "social",
    template: "problem",
    summary: t(
      "Explain the issue, push back politely, and keep control in a tense exchange.",
      "在紧张对话里把问题说清楚、礼貌顶回去，并稳住节奏。"
    ),
    launchStatus: "full",
    availableStages: [1, 2],
  },
  {
    slug: "classroom-participation",
    name: t("Classroom Participation", "课堂参与"),
    domain: "school",
    template: "task",
    summary: t(
      "Jump into class moments quickly with short, clear academic responses.",
      "在课堂场景里快速给出简洁清楚的学术回应。"
    ),
    launchStatus: "coming_soon",
    availableStages: [],
  },
  {
    slug: "classmate-small-talk",
    name: t("Classmate Small Talk", "同学闲聊"),
    domain: "school",
    template: "social",
    summary: t(
      "Handle low-pressure school conversation before class, after class, or between tasks.",
      "围绕课前课后和作业间隙的校园闲聊做自然互动。"
    ),
    launchStatus: "full",
    availableStages: [1, 2],
  },
  {
    slug: "office-hours",
    name: t("Office Hours", "答疑时间"),
    domain: "school",
    template: "task",
    summary: t(
      "Ask sharper questions and explain what you need help with.",
      "把问题问得更清楚，也把自己卡住的地方说明白。"
    ),
    launchStatus: "partial",
    availableStages: [1],
  },
  {
    slug: "group-project",
    name: t("Group Project", "小组项目"),
    domain: "school",
    template: "task",
    summary: t(
      "Coordinate tasks, explain progress, and react inside a group workflow.",
      "在小组协作里分工、说明进度并接住反馈。"
    ),
    launchStatus: "partial",
    availableStages: [1],
  },
  {
    slug: "presentation",
    name: t("Presentation", "做展示"),
    domain: "school",
    template: "task",
    summary: t(
      "Present clearly and keep control when attention is on you.",
      "在别人都看着你的时候，依然把展示讲清楚。"
    ),
    launchStatus: "coming_soon",
    availableStages: [],
  },
  {
    slug: "asking-professor-questions",
    name: t("Asking Professor Questions", "向教授提问"),
    domain: "school",
    template: "task",
    summary: t(
      "Ask direct academic questions without losing clarity or politeness.",
      "礼貌又直接地向教授提问，不把自己说乱。"
    ),
    launchStatus: "coming_soon",
    availableStages: [],
  },
  {
    slug: "interview",
    name: t("Interview", "面试"),
    domain: "work",
    template: "task",
    summary: t(
      "Introduce yourself, answer pressure questions, and keep structure under scrutiny.",
      "在面试压力下做自我介绍、回答问题并保持结构清楚。"
    ),
    launchStatus: "full",
    availableStages: [1, 2],
  },
  {
    slug: "meeting",
    name: t("Meeting", "会议"),
    domain: "work",
    template: "task",
    summary: t(
      "Share updates, react to input, and stay sharp in a professional room.",
      "在会议场景里汇报、回应并保持表达利落。"
    ),
    launchStatus: "coming_soon",
    availableStages: [],
  },
  {
    slug: "client-call",
    name: t("Client Call", "客户通话"),
    domain: "work",
    template: "task",
    summary: t(
      "Clarify client needs and keep professional control over the conversation.",
      "在客户对话里问清需求并保持专业掌控力。"
    ),
    launchStatus: "coming_soon",
    availableStages: [],
  },
  {
    slug: "team-update",
    name: t("Team Update", "团队更新"),
    domain: "work",
    template: "task",
    summary: t(
      "Summarize progress quickly and answer what is blocked or changing.",
      "快速说明进度，也能解释卡点和变化。"
    ),
    launchStatus: "coming_soon",
    availableStages: [],
  },
  {
    slug: "workplace-small-talk",
    name: t("Workplace Small Talk", "职场闲聊"),
    domain: "work",
    template: "social",
    summary: t(
      "Handle casual workplace conversation without sounding stiff or too formal.",
      "在职场闲聊里自然回应，不生硬也不过度正式。"
    ),
    launchStatus: "partial",
    availableStages: [1],
  },
];

export function getScenarioBySlug(slug: string) {
  return SCENARIOS.find((scenario) => scenario.slug === slug) ?? null;
}

export function getScenariosForDomain(domain: ScenarioDomain) {
  return SCENARIOS.filter((scenario) => scenario.domain === domain);
}

export function getScenarioDomainMeta(domain: ScenarioDomain) {
  return SCENARIO_DOMAINS.find((item) => item.key === domain) ?? null;
}

export function getStageDefinition(stage: StageNumber) {
  return SCENARIO_STAGE_DEFINITIONS.find((item) => item.stage === stage) ?? null;
}

export function isScenarioStageAvailable(
  scenario: Scenario,
  stage: StageNumber
) {
  return scenario.availableStages.includes(stage);
}

export function buildBattlePackCacheKey(input: {
  scenarioSlug: string;
  stage: StageNumber;
  targetLanguage: string;
  level: string;
  templateVersion: string;
}) {
  return [
    input.scenarioSlug,
    `stage-${input.stage}`,
    input.targetLanguage.toLowerCase(),
    input.level.toLowerCase(),
    input.templateVersion,
  ].join("-");
}
