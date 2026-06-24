import { AIProvider } from '../providers/openai.provider';
import { Research, Topic } from '@medium-publisher/types';

export class ResearchAgent {
  constructor(private ai: AIProvider) {}

  async research(topic: Topic): Promise<Omit<Research, 'id' | 'topicId' | 'createdAt' | 'updatedAt'>> {
    console.log(`🔬 Research Agent: Starting research on "${topic.title}"`);

    const prompt = `You are an expert research analyst. Your job is to conduct deep research on the given topic and produce structured, factually rich research notes.

TOPIC: ${topic.title}
CATEGORY: ${topic.category ?? 'General'}
KEYWORDS: ${topic.keywords?.join(', ') ?? topic.title}

Conduct thorough research and return a JSON object with this exact structure:
{
  "whatIsIt": "A clear, precise explanation of the topic. No fluff. 2-3 concise paragraphs.",
  "whyItMatters": "Why this topic matters RIGHT NOW. Include real-world impact. 2 paragraphs.",
  "currentTrends": "What is happening in this space in 2024-2025. Specific, not vague. 2-3 paragraphs.",
  "statistics": [
    { "fact": "specific stat or data point", "source": "source name", "year": 2024 }
  ],
  "realExamples": [
    { "company": "company name or person", "description": "what they did", "outcome": "result or impact" }
  ],
  "faqs": [
    { "question": "common question beginners ask", "answer": "direct, practical answer" }
  ],
  "gaps": ["gap in existing content #1", "gap #2", "gap #3"],
  "references": [
    { "title": "reference title", "url": "url if known", "author": "author" }
  ],
  "contrarian": "A nuanced counterpoint or underappreciated perspective on this topic. 1 paragraph.",
  "keyInsights": ["key insight 1", "key insight 2", "key insight 3", "key insight 4", "key insight 5"]
}

Rules:
- Include at least 5 statistics
- Include at least 3 real examples  
- Include at least 5 FAQs
- Include at least 3 content gaps
- Be specific and factual
- No generic filler content`;

    const research = await this.ai.generateStructured<Omit<Research, 'id' | 'topicId' | 'createdAt' | 'updatedAt' | 'rawNotes' | 'competingUrls'>>(prompt, {
      temperature: 0.4,
      maxTokens: 6000,
    });

    console.log(`✅ Research Agent: Completed research on "${topic.title}"`);
    return {
      ...research,
      competingUrls: [],
      rawNotes: JSON.stringify(research),
    };
  }
}
