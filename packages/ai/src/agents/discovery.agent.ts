import { AIProvider } from '../providers/openai.provider';

export interface ProposedBlog {
  title: string;
  description: string;
}

export interface TopicProposal {
  type: 'SINGLE' | 'PLAYLIST';
  reasoning: string;
  playlistTitle?: string;
  blogs: ProposedBlog[];
}

export class DiscoveryAgent {
  constructor(private provider: AIProvider) {}

  async evaluateTopic(title: string, description?: string): Promise<TopicProposal> {
    const systemPrompt = `You are an expert Content Strategist and SEO Planner for a technical blog.
Your job is to analyze a topic idea and determine the best content architecture.

If the topic is narrow, specific, or focused (e.g., "How to center a div in CSS"), propose a SINGLE blog post.
If the topic is broad, complex, or foundational (e.g., "How to build a SaaS", "Mastering React"), propose a PLAYLIST (a series of 2 to 5 blog posts that logically progress).

Respond ONLY with valid JSON matching this schema:
{
  "type": "SINGLE" | "PLAYLIST",
  "reasoning": "Explanation of why this architecture was chosen",
  "playlistTitle": "The overarching title (only if type is PLAYLIST)",
  "blogs": [
    {
      "title": "Proposed Blog Title",
      "description": "Brief summary of what this specific blog will cover"
    }
  ]
}`;

    const prompt = `Evaluate the following topic:
Title: ${title}
${description ? `Description: ${description}` : ''}`;

    return this.provider.generateStructured<TopicProposal>(prompt, {
      systemPrompt,
      temperature: 0.7,
      maxTokens: 1500,
    });
  }
}
