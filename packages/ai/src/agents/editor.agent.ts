import { AIProvider } from '../providers/openai.provider';

export class EditorAgent {
  constructor(private ai: AIProvider) {}

  async edit(content: string, title: string): Promise<string> {
    console.log(`✏️  Editor Agent: Running professional editing pass`);

    const prompt = `You are a professional editor at a top-tier tech publication. Your job is to do a final editing pass on this blog post.

Blog title: "${title}"

Editing checklist:
1. Fix any grammatical errors or awkward phrasing
2. Ensure the narrative flows naturally from section to section — add transition sentences between sections if abrupt
3. Make sure the hook (first paragraph) is compelling enough to make people keep reading
4. Check that the conclusion doesn't start with "In conclusion" — if it does, rewrite it
5. Ensure the CTA at the end is specific and actionable (not generic "follow me")
6. Remove any redundant sentences that repeat earlier points
7. If any section feels thin, add 1-2 sentences of depth
8. Make sure headers are interesting — not just topic labels ("How It Works" → "How This Actually Works in Production")

Important: Keep the author's voice and style. Don't over-sanitize. A few imperfections make it human.
Keep all markdown formatting intact.

Return ONLY the edited content. No commentary.

Content:
---
${content}
---`;

    const edited = await this.ai.generateText(prompt, {
      temperature: 0.5,
      maxTokens: content.split(' ').length * 3,
    });

    console.log(`✅ Editor Agent: Editing complete`);
    return edited;
  }
}
