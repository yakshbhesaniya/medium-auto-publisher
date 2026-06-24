import { AIProvider } from '../providers/openai.provider';
import { BlogMode, BlogOutline, BlogTone, OutlineSection, Research } from '@medium-publisher/types';

export class WriterAgent {
  constructor(private ai: AIProvider) {}

  async writeFullBlog(
    outline: BlogOutline,
    research: Research,
    mode: BlogMode,
    tone: BlogTone,
  ): Promise<string> {
    console.log(`✍️  Writer Agent: Writing ${outline.sections.length} sections`);

    // Write sections in parallel (with concurrency limit)
    const CONCURRENCY = 3;
    const sections: string[] = [];

    for (let i = 0; i < outline.sections.length; i += CONCURRENCY) {
      const batch = outline.sections.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map((section, idx) =>
          this.writeSection(section, outline, research, mode, tone, i + idx === 0),
        ),
      );
      sections.push(...results);
    }

    // Assemble the full markdown document
    const markdown = [
      `# ${outline.title}`,
      ``,
      `*${outline.subtitle}*`,
      ``,
      ...sections,
    ].join('\n\n');

    console.log(`✅ Writer Agent: Complete — ${markdown.split(' ').length} words`);
    return markdown;
  }

  private async writeSection(
    section: OutlineSection,
    outline: BlogOutline,
    research: Research,
    mode: BlogMode,
    tone: BlogTone,
    isFirst: boolean,
  ): Promise<string> {
    const statistics = research.statistics.slice(0, 3)
      .map(s => `${s.fact} (${s.source ?? 'various sources'})`)
      .join('\n');

    const examples = research.realExamples.slice(0, 2)
      .map(e => `${e.company ?? 'Example'}: ${e.description}`)
      .join('\n');

    const systemPrompt = `You are a professional writer for Medium — one of the world's best blogging platforms. You write content that consistently earns $500-2000/month because readers LOVE your work.

Your writing style:
- Varies sentence length dramatically. Short punchy sentences. Then longer ones that pull the reader into a thought and keep them engaged until the very end.
- Uses real examples, not hypothetical ones
- Includes your own opinions and nuanced takes — not just facts
- Talks to the reader like a smart person, never talks down
- Never uses: "In today's fast-paced world", "Let's dive in", "revolutionizing", "seamless", "cutting-edge", "furthermore", "in conclusion", "game-changing", "comprehensive guide", "unlock potential", "leverage", "landscape", "transformative"
- Uses occasional rhetorical questions to engage readers
- Mentions edge cases and tradeoffs — not just the happy path
- Starts paragraphs in different ways — not always with a noun
- Occasionally uses first-person perspective

Mode: ${mode}
Tone: ${tone}`;

    const faqContent = section.type === 'faq'
      ? `\n\nFAQs to answer:\n${research.faqs.slice(0, 5).map(f => `Q: ${f.question}`).join('\n')}`
      : '';

    const prompt = `Write the "${section.heading}" section of this blog post.

Blog title: ${outline.title}
Section type: ${section.type}
Target word count: ${section.targetWords} words

Key points to cover:
${section.keyPoints.map(p => `- ${p}`).map(p => p).join('\n')}

Relevant research:
${isFirst ? `Topic context: ${research.whatIsIt.slice(0, 300)}` : ''}
Statistics: ${statistics}
Real examples: ${examples}${faqContent}

Contrarian angle (weave in if relevant): ${research.contrarian ?? 'N/A'}

Write ONLY the section content in markdown. Use ## for the section heading.
Do not include any intro like "Here is the section:" — just write the content directly.
Make it ${section.targetWords} words, not more, not less. Quality over length.`;

    return this.ai.generateText(prompt, {
      systemPrompt,
      temperature: 0.85,
      maxTokens: section.targetWords * 2,
    });
  }
}
