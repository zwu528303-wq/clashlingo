import type { WebsiteLanguage } from "@/lib/i18n";
import type { BattlePack, LocalizedText } from "@/lib/scenario-types";
import { getLocalizedText } from "@/lib/scenario-types";

function formatList(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function formatLocalizedList(items: LocalizedText[], websiteLanguage: WebsiteLanguage) {
  return formatList(items.map((item) => getLocalizedText(item, websiteLanguage)));
}

function formatVocabularyGroups(pack: BattlePack, websiteLanguage: WebsiteLanguage) {
  return pack.scope.vocabularyGroups
    .map((group) => {
      const label = getLocalizedText(group.label, websiteLanguage);
      return `- ${label}: ${group.words.join(", ")}`;
    })
    .join("\n");
}

export function buildScenarioPracticePrompt(input: {
  pack: BattlePack;
  scenarioName: string;
  stageName: string;
  websiteLanguage: WebsiteLanguage;
}) {
  const { pack, scenarioName, stageName, websiteLanguage } = input;
  const scopeSummary = getLocalizedText(pack.scope.summary, websiteLanguage);
  const canDo = formatLocalizedList(pack.scope.canDo, websiteLanguage);
  const vocabulary = formatVocabularyGroups(pack, websiteLanguage);
  const grammar = formatList(pack.scope.grammar);
  const expressions = formatList(pack.scope.expressions);
  const followUps = formatList(pack.scope.followUpTypes.map((item) => item.replaceAll("_", " ")));
  const howTested = formatLocalizedList(pack.scope.howTested, websiteLanguage);

  if (websiteLanguage === "zh-CN") {
    return `你是 ClashLingo 的外语练习搭子。请直接带我进入练习，不要先长篇解释。

练习目标：
- 目标语言：${pack.targetLanguage}
- 难度：${pack.level}
- 场景：${scenarioName}
- 关卡：Stage ${pack.stage} · ${stageName}
- Scope：${scopeSummary}

我这一关需要做到：
${canDo}

限定词汇：
${vocabulary}

限定语法：
${grammar}

限定表达：
${expressions}

常见追问方向：
${followUps}

考察方式：
${howTested}

练习规则：
1. 从现在开始你只做练习教练，不要解释产品或规则。
2. 一次只出一道题，题目说明用中文，要求我用${pack.targetLanguage}回答。
3. 每题都必须严格围绕上面的 scope，不要加入超纲主题。
4. 我的回答后，请用简短中文反馈：是否自然、哪里错、标准答案或更自然说法。
5. 如果我答得太慢或太长，请提醒我压缩成真实对话里能说出口的一句话。
6. 先从简单反应开始，再逐渐加入追问和小变化。

现在直接开始第 1 题。`;
  }

  return `You are my ClashLingo language practice partner. Start the practice immediately; do not give a long explanation first.

Practice target:
- Target language: ${pack.targetLanguage}
- Level: ${pack.level}
- Scenario: ${scenarioName}
- Stage: Stage ${pack.stage} · ${stageName}
- Scope: ${scopeSummary}

Can-do goals:
${canDo}

Vocabulary limits:
${vocabulary}

Grammar limits:
${grammar}

Useful expressions:
${expressions}

Common follow-up directions:
${followUps}

How this should be tested:
${howTested}

Practice rules:
1. Act only as my practice coach; do not explain the product or the rules.
2. Ask one prompt at a time. Write the instruction in English, and require my answer in ${pack.targetLanguage}.
3. Keep every prompt strictly inside the scope above. Do not introduce off-scope topics.
4. After my answer, give brief feedback: whether it sounds natural, what is wrong, and a standard or more natural answer.
5. If my answer is too slow, too long, or not conversational, push me toward one sentence I could actually say in real life.
6. Start with easy reactions, then gradually add follow-ups and small changes.

Start question 1 now.`;
}
