import { AIProvider } from '../providers/openai.provider';
import { BlogMode, BlogOutline, BlogTone, Research, Topic } from '@medium-publisher/types';

export class OutlineAgent {
  constructor(private ai: AIProvider) {}

  async generateOutline(
    topic: Topic,
    research: Research,
    mode: BlogMode,
    tone: BlogTone,
  ): Promise<BlogOutline> {
    console.log(`📋 Outline Agent: Generating outline for "${topic.title}"`);

    const modeInstructions: Record<BlogMode, string> = {
      TECHNICAL_DEEP_DIVE: 'Deep technical analysis with implementation details, architecture, tradeoffs, and advanced concepts',
      TUTORIAL: 'Step-by-step guide with clear prerequisites, numbered steps, code examples, and expected outcomes',
      OPINION_PIECE: 'Thought-provoking analysis with strong opening argument, supporting evidence, counterarguments, and conclusion',
      CASE_STUDY: 'Real-world story format: context, challenge, solution, results, lessons learned',
      THOUGHT_LEADERSHIP: 'Industry vision piece with bold claims, evidence, predictions, and call-to-action',
      STARTUP_ANALYSIS: 'Business analysis: market opportunity, product analysis, competitive landscape, growth strategy',
    };

    const toneInstructions: Record<BlogTone, string> = {
      PROFESSIONAL: 'Authoritative, precise, formal but accessible. Like a senior engineer writing for peers.',
      CASUAL: 'Friendly and conversational. Like explaining to a smart colleague over coffee.',
      FOUNDER: 'First-person, vulnerable, experience-based. Like a founder sharing hard-won lessons.',
      EDUCATOR: 'Patient, structured, pedagogically sound. Like a great university professor.',
      TECHNICAL_EXPERT: 'Deep, precise, assumes domain knowledge. No hand-holding.',
    };

    const keyInsights = research.keyInsights.join('\n- ');
    const gaps = research.gaps.join('\n- ');

    const prompt = `You are a professional blog strategist for Medium. Generate a compelling blog outline.

TOPIC: ${topic.title}
MODE: ${mode} — ${modeInstructions[mode]}
TONE: ${tone} — ${toneInstructions[tone]}

KEY RESEARCH INSIGHTS:
- ${keyInsights}

CONTENT GAPS TO FILL:
- ${gaps}

Generate a JSON outline with this exact structure:
{
  "title": "Compelling, specific title (not clickbait, not generic). Under 70 characters.",
  "subtitle": "One sentence subtitle that adds context. Under 120 characters.",
  "sections": [
    {
      "heading": "Section heading",
      "level": 2,
      "keyPoints": ["point 1", "point 2", "point 3"],
      "targetWords": 250,
      "type": "intro"
    }
  ],
  "estimatedWordCount": 2200
}

Section type options: "intro" | "main" | "example" | "faq" | "conclusion" | "cta"

Structure requirements:
1. Hook/intro section (200-250 words, type: "intro")
2. 4-6 main content sections (200-350 words each, type: "main")
3. 1-2 practical example sections (200-300 words, type: "example")
4. FAQ section with 4-5 questions (200-250 words, type: "faq")  
5. Conclusion (150-200 words, type: "conclusion")
6. CTA section (100-150 words, type: "cta")

Total target: 1800-2500 words (6-10 minute read)

Title rules:
- Specific and concrete (include numbers/specifics when natural)
- No "The Ultimate Guide to" or "Everything You Need to Know"
- No "Revolutionizing" or "Game-changing"
- Must genuinely describe what the reader will learn`;

    const outline = await this.ai.generateStructured<BlogOutline>(prompt, {
      temperature: 0.6,
      maxTokens: 3000,
    });

    console.log(`✅ Outline Agent: Generated ${outline.sections.length} sections, ~${outline.estimatedWordCount} words`);
    return outline;
  }
}
