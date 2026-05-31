import type { Syllabus } from "@/lib/domain-types";
import type { InstructionLanguage } from "@/lib/instruction-content";
import {
  getLocalizedList,
  getLocalizedVocabularyGroups,
} from "@/lib/instruction-content";

function formatList(items: string[]) {
  return items.map((item) => `- ${item}`).join("\n");
}

function formatVocabularyGroups(
  syllabus: Syllabus,
  instructionLanguage: InstructionLanguage
) {
  return getLocalizedVocabularyGroups(syllabus, instructionLanguage)
    .map((group) => `- ${group.label}: ${group.words.join(", ")}`)
    .join("\n");
}

export function buildRivalryPracticePrompt(input: {
  syllabus: Syllabus;
  topic: string;
  targetLanguage: string;
  level?: string | null;
  instructionLanguage: InstructionLanguage;
}) {
  const { syllabus, topic, targetLanguage, level, instructionLanguage } = input;
  const canDo = getLocalizedList(syllabus.can_do, instructionLanguage);
  const grammar = getLocalizedList(syllabus.grammar, instructionLanguage);
  const vocabulary = formatVocabularyGroups(syllabus, instructionLanguage);
  const expressions = syllabus.expressions ?? [];
  const listening = syllabus.listening ?? [];
  const howTested = getLocalizedList(syllabus.how_tested, instructionLanguage);
  const levelLine = level ? `- Level: ${level}\n` : "";

  if (instructionLanguage === "zh-CN") {
    return `你是 ClashLingo 的外语对战练习搭子。请直接带我进入练习，不要先长篇解释。

练习目标：
- 目标语言：${targetLanguage}
${level ? `- 难度：${level}\n` : ""}- 主题：${topic}

我这一轮需要做到：
${formatList(canDo)}

限定词汇：
${vocabulary}

限定语法：
${formatList(grammar)}

限定表达：
${formatList(expressions)}

我可能听到的表达：
${formatList(listening)}

考察方式：
${formatList(howTested)}

练习规则：
1. 从现在开始你只做练习教练，不要解释产品或规则。
2. 一次只出一道题，题目说明用中文，要求我用${targetLanguage}回答。
3. 每题都必须严格围绕上面的 scope，不要加入超纲主题。
4. 我的回答后，请用简短中文反馈：是否自然、哪里错、标准答案或更自然说法。
5. 如果我答得太慢、太长或不像真实对话，请要求我压缩成真实对战里能说出口的一句话。
6. 先从简单反应开始，再逐渐加入追问、听力理解和小变化。

现在直接开始第 1 题。`;
  }

  return `You are my ClashLingo rivalry practice partner. Start the practice immediately; do not give a long explanation first.

Practice target:
- Target language: ${targetLanguage}
${levelLine}- Topic: ${topic}

Can-do goals:
${formatList(canDo)}

Vocabulary limits:
${vocabulary}

Grammar limits:
${formatList(grammar)}

Useful expressions:
${formatList(expressions)}

Likely listening inputs:
${formatList(listening)}

How this should be tested:
${formatList(howTested)}

Practice rules:
1. Act only as my practice coach; do not explain the product or the rules.
2. Ask one prompt at a time. Write the instruction in English, and require my answer in ${targetLanguage}.
3. Keep every prompt strictly inside the scope above. Do not introduce off-scope topics.
4. After my answer, give brief feedback: whether it sounds natural, what is wrong, and a standard or more natural answer.
5. If my answer is too slow, too long, or not conversational, push me toward one sentence I could actually say in a real rivalry match.
6. Start with easy reactions, then gradually add follow-ups, listening checks, and small changes.

Start question 1 now.`;
}
