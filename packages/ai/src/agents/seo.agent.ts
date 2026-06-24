import { AIProvider } from '../providers/openai.provider';

export interface SEOResult {
  optimizedContent: string;
  metaDescription: string;
  tags: string[];
  focusKeyword: string;
  slug: string;
  internalLinkSuggestions: Array<{
    anchorText: string;
    context: string;
    suggestedTopic: string;
  }>;
}

export class SEOAgent {
  constructor(private ai: AIProvider) {}

  async optimize(content: string, title: string, keywords: string[]): Promise<SEOResult> {
    console.log(`🔍 SEO Agent: Optimizing for search`);

    const prompt = `You are an SEO expert who specializes in Medium and content marketing. Optimize this blog post for discoverability and engagement.

Title: "${title}"
Target keywords: ${keywords.join(', ')}

Tasks:
1. Identify the single best focus keyword from the list
2. Ensure the focus keyword appears naturally in:
   - The first paragraph (if not already)
   - At least 2-3 subheadings (rewrite headings if needed)
   - Naturally throughout the body (2-3% density max)
3. Write a compelling meta description (150-160 chars, include focus keyword)
4. Suggest 5 relevant Medium tags (short, specific, searchable)
5. Generate a URL-friendly slug
6. Suggest 3 internal link opportunities (places in the content where linking to related articles would be natural)

Return JSON:
{
  "optimizedContent": "the full optimized blog content with all markdown preserved",
  "metaDescription": "150-160 char meta description",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "focusKeyword": "the primary keyword",
  "slug": "url-friendly-slug",
  "internalLinkSuggestions": [
    {
      "anchorText": "text that would be hyperlinked",
      "context": "the sentence where this link appears",
      "suggestedTopic": "what article to link to"
    }
  ]
}

Content to optimize:
---
${content}
---`;

    const result = await this.ai.generateStructured<SEOResult>(prompt, {
      temperature: 0.4,
      maxTokens: content.split(' ').length * 4,
    });

    console.log(`✅ SEO Agent: Focus keyword "${result.focusKeyword}", ${result.tags.length} tags`);
    return result;
  }
}
