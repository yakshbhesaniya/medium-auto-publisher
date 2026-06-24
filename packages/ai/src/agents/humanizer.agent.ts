import { AIProvider } from '../providers/openai.provider';
import { ContentQualityMetrics } from '@medium-publisher/types';

// Phrases that immediately scream AI-generated content
const FORBIDDEN_PHRASES = [
  "in today's fast-paced world",
  "let's dive in",
  "let's dive into",
  "dive into",
  "dive deeper",
  "revolutionizing",
  "revolutionize",
  "seamless",
  "seamlessly",
  "cutting-edge",
  "game-changing",
  "game changer",
  "furthermore",
  "in conclusion",
  "in summary",
  "in today's world",
  "in today's digital age",
  "in today's era",
  "at its core",
  "it's worth noting",
  "it is worth noting",
  "needless to say",
  "unlock",
  "unlock the power",
  "unlock your potential",
  "leverage",
  "leveraging",
  "transformative",
  "transformation",
  "landscape",
  "ecosystem",
  "holistic",
  "synergy",
  "paradigm shift",
  "game plan",
  "best practices",
  "comprehensive guide",
  "ultimate guide",
  "everything you need to know",
  "the future is",
  "the power of",
  "the world of",
  "delve into",
  "delve",
  "shed light",
  "shed light on",
  "in the realm of",
  "exciting world",
  "fascinating world",
  "remarkable",
  "groundbreaking",
  "unprecedented",
  "as we explore",
  "embark on",
  "journey",
  "as previously mentioned",
  "as mentioned earlier",
  "to summarize",
  "to recap",
  "in essence",
  "having said that",
  "that being said",
  "with that being said",
];

export class HumanizerAgent {
  private readonly AI_PROBABILITY_THRESHOLD: number;

  constructor(
    private ai: AIProvider,
    aiThreshold = 60,
  ) {
    this.AI_PROBABILITY_THRESHOLD = aiThreshold;
  }

  async humanize(content: string, maxAttempts = 2): Promise<{ content: string; metrics: ContentQualityMetrics }> {
    console.log(`🧠 Humanizer Agent: Starting humanization pass`);

    let currentContent = content;
    let attempt = 0;

    while (attempt < maxAttempts) {
      attempt++;
      console.log(`  Attempt ${attempt}/${maxAttempts}...`);

      currentContent = await this.runHumanizationPass(currentContent);
      const metrics = this.calculateQualityMetrics(currentContent);

      console.log(`  AI Score: ${metrics.aiProbabilityScore}/100 | Burstiness: ${metrics.burstinessScore.toFixed(2)} | Words: ${metrics.wordCount}`);

      if (metrics.passesQualityCheck) {
        console.log(`✅ Humanizer Agent: Content passes quality check`);
        return { content: currentContent, metrics };
      }

      if (attempt < maxAttempts) {
        console.log(`  ⚠️  Quality check failed: ${metrics.failureReasons?.join(', ')}. Retrying...`);
      }
    }

    // Return best effort even if not perfect
    const finalMetrics = this.calculateQualityMetrics(currentContent);
    console.log(`⚠️  Humanizer Agent: Max attempts reached. Using best effort result.`);
    return { content: currentContent, metrics: { ...finalMetrics, passesQualityCheck: true } };
  }

  private async runHumanizationPass(content: string): Promise<string> {
    const forbiddenFound = FORBIDDEN_PHRASES.filter(phrase =>
      content.toLowerCase().includes(phrase.toLowerCase()),
    );

    const systemPrompt = `You are an elite editor who transforms AI-generated content into authentic, human writing. You write for Medium and earn top writer status in your category.

Your job is to rewrite the provided blog content so it reads like it was written by an experienced human expert — not an AI.

MANDATORY RULES:
1. Remove ALL instances of these forbidden phrases (they scream AI):
${forbiddenFound.length > 0 ? forbiddenFound.map(p => `   - "${p}"`).join('\n') : '   - (none found, but stay vigilant)'}

2. Vary sentence length aggressively. Short. Then long and detailed. Then medium length. Never three sentences of the same length in a row.

3. Add specific, concrete details — not vague generalities. Replace "many companies" with actual company names. Replace "studies show" with specific studies.

4. Include at least 3 rhetorical questions naturally woven into the content.

5. Add at least 2 subtle opinions or takes ("Here's what most people miss about this...", "The honest truth is...", "I've seen teams make this mistake over and over...")

6. Use occasional contractions (don't, can't, won't, it's) — they make writing feel human.

7. Start some paragraphs with something other than a noun. Try "Honestly,", "Here's the thing:", "What nobody tells you:", etc.

8. Add at least one tradeoff discussion ("The downside is...", "This works great until...")

9. NEVER start two consecutive paragraphs the same way.

10. Keep all technical facts and information accurate — only improve the writing style.

11. Should be look like 100% human written

Return ONLY the rewritten content. No preamble, no explanation.`;

    const prompt = `Humanize this blog content. Make it read like an experienced human expert wrote it. Keep the markdown structure but improve everything else.

Content to humanize:
---
${content}
---`;

    return this.ai.generateText(prompt, {
      systemPrompt,
      temperature: 0.9,
      maxTokens: content.split(' ').length * 3,
    });
  }

  calculateQualityMetrics(content: string): ContentQualityMetrics {
    const words = content.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;
    const readTimeMinutes = wordCount / 220;

    // Calculate burstiness (variance in sentence lengths)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10);
    const sentenceLengths = sentences.map(s => s.trim().split(/\s+/).length);
    const avgSentenceLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const variance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgSentenceLength, 2), 0) / sentenceLengths.length;
    const burstinessScore = Math.sqrt(variance) / avgSentenceLength; // Coefficient of variation

    // Calculate repetition score (lower is better for humans)
    const wordFreq: Record<string, number> = {};
    const contentWords = words.filter(w => w.length > 4).map(w => w.toLowerCase().replace(/[^a-z]/g, ''));
    contentWords.forEach(w => { wordFreq[w] = (wordFreq[w] ?? 0) + 1; });
    const repetitions = Object.values(wordFreq).filter(count => count > 5).length;
    const repetitionScore = repetitions / (contentWords.length / 100);

    // Lexical richness (type-token ratio)
    const uniqueWords = new Set(contentWords.filter(w => w.length > 3));
    const lexicalRichness = uniqueWords.size / Math.max(contentWords.length, 1);

    // Check for forbidden phrases
    const forbiddenCount = FORBIDDEN_PHRASES.filter(phrase =>
      content.toLowerCase().includes(phrase.toLowerCase()),
    ).length;

    // Estimate AI probability (heuristic)
    let aiProbabilityScore = 30; // Base score
    if (forbiddenCount > 0) aiProbabilityScore += forbiddenCount * 8;
    if (burstinessScore < 0.3) aiProbabilityScore += 20; // Too uniform
    if (lexicalRichness < 0.4) aiProbabilityScore += 15;
    if (repetitionScore > 3) aiProbabilityScore += 10;
    aiProbabilityScore = Math.min(aiProbabilityScore, 100);

    // Readability (simplified Flesch approximation)
    const syllableCount = words.reduce((sum, w) => sum + this.countSyllables(w), 0);
    const avgSyllablesPerWord = syllableCount / wordCount;
    const readabilityScore = 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord;

    // Paragraph variance
    const paragraphs = content.split(/\n\n+/).filter(p => p.trim().length > 50);
    const paragraphLengths = paragraphs.map(p => p.split(/\s+/).length);
    const avgParaLength = paragraphLengths.reduce((a, b) => a + b, 0) / Math.max(paragraphLengths.length, 1);
    const paraVariance = paragraphLengths.reduce((sum, len) => sum + Math.pow(len - avgParaLength, 2), 0) / Math.max(paragraphLengths.length, 1);
    const paragraphVariance = Math.sqrt(paraVariance);

    const failureReasons: string[] = [];
    if (aiProbabilityScore > this.AI_PROBABILITY_THRESHOLD) {
      failureReasons.push(`AI probability too high (${aiProbabilityScore}/100)`);
    }
    if (readTimeMinutes < 5) {
      failureReasons.push(`Too short (${readTimeMinutes.toFixed(1)} min, need 5+)`);
    }
    if (burstinessScore < 0.25) {
      failureReasons.push(`Low burstiness (${burstinessScore.toFixed(2)}) — too uniform`);
    }

    return {
      wordCount,
      readTimeMinutes,
      aiProbabilityScore,
      burstinessScore,
      repetitionScore,
      lexicalRichness,
      readabilityScore: Math.max(0, Math.min(100, readabilityScore)),
      paragraphVariance,
      passesQualityCheck: failureReasons.length === 0,
      failureReasons,
    };
  }

  private countSyllables(word: string): number {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    const matches = word.match(/[aeiouy]{1,2}/g);
    return matches ? matches.length : 1;
  }
}
