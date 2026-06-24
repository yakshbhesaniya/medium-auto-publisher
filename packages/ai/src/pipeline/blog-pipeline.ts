import { AnthropicProvider } from '../providers/anthropic.provider';
import { OpenAIProvider } from '../providers/openai.provider';
import { ResearchAgent } from '../agents/research.agent';
import { OutlineAgent } from '../agents/outline.agent';
import { WriterAgent } from '../agents/writer.agent';
import { HumanizerAgent } from '../agents/humanizer.agent';
import { EditorAgent } from '../agents/editor.agent';
import { SEOAgent } from '../agents/seo.agent';
import { ImageAgent } from '../agents/image.agent';
import {
  BlogMode,
  BlogOutline,
  BlogTone,
  ContentQualityMetrics,
  PipelineStage,
  Research,
  Topic,
} from '@medium-publisher/types';

export interface PipelineProgress {
  stage: PipelineStage;
  progress: number;
  message: string;
}

export interface PipelineResult {
  title: string;
  subtitle: string;
  slug: string;
  markdownContent: string;
  metaDescription: string;
  tags: string[];
  focusKeyword: string;
  outline: BlogOutline;
  research: Omit<Research, 'id' | 'topicId' | 'createdAt' | 'updatedAt'>;
  metrics: ContentQualityMetrics;
  coverImageUrl: string;
  coverImagePrompts: string[];
  coverImageVariants: string[];
  internalLinkSuggestions: unknown[];
  wordCount: number;
  readTimeMinutes: number;
}

export type ProgressCallback = (progress: PipelineProgress) => void | Promise<void>;

export class BlogPipeline {
  private researchAgent: ResearchAgent;
  private outlineAgent: OutlineAgent;
  private writerAgent: WriterAgent;
  private humanizerAgent: HumanizerAgent;
  private editorAgent: EditorAgent;
  private seoAgent: SEOAgent;
  private imageAgent: ImageAgent;

  constructor(
    private onProgress?: ProgressCallback,
  ) {
    // Use Claude for writing (best quality), OpenAI for fast tasks + images
    const claude = new AnthropicProvider(process.env.AI_WRITING_MODEL ?? 'claude-sonnet-4-5');
    const gpt = new OpenAIProvider(process.env.AI_FAST_MODEL ?? 'gpt-4o');

    this.researchAgent = new ResearchAgent(gpt);      // GPT-4o fast for research
    this.outlineAgent = new OutlineAgent(claude);      // Claude for creative outline
    this.writerAgent = new WriterAgent(claude);        // Claude for best writing
    this.humanizerAgent = new HumanizerAgent(claude);  // Claude for humanization
    this.editorAgent = new EditorAgent(claude);        // Claude for editing
    this.seoAgent = new SEOAgent(gpt);                // GPT-4o for SEO
    this.imageAgent = new ImageAgent(new OpenAIProvider('gpt-4o')); // DALL-E for images
  }

  async run(
    topic: Topic,
    mode: BlogMode = 'TECHNICAL_DEEP_DIVE',
    tone: BlogTone = 'PROFESSIONAL',
    generateCoverImage = true,
  ): Promise<PipelineResult> {
    console.log(`\n🚀 Starting Blog Pipeline for: "${topic.title}"`);
    console.log(`   Mode: ${mode} | Tone: ${tone}\n`);

    // ─── Stage 0: Research ───────────────────────────────────────
    await this.progress('research', 5, 'Gathering research and data...');
    const research = await this.researchAgent.research(topic);
    await this.progress('research', 20, 'Research complete');

    // ─── Stage 1: Outline ────────────────────────────────────────
    await this.progress('outline', 25, 'Generating blog outline...');
    const fakeResearch = { ...research, id: '', topicId: topic.id, createdAt: new Date(), updatedAt: new Date() };
    const outline = await this.outlineAgent.generateOutline(topic, fakeResearch, mode, tone);
    await this.progress('outline', 35, `Outline ready: ${outline.sections.length} sections`);

    // ─── Stage 2: Writing ────────────────────────────────────────
    await this.progress('writing', 38, 'Writing blog content...');
    let content = await this.writerAgent.writeFullBlog(outline, fakeResearch, mode, tone);
    await this.progress('writing', 58, 'First draft complete');

    // ─── Stage 3: Humanization ───────────────────────────────────
    await this.progress('humanizing', 60, 'Humanizing content...');
    const aiThreshold = parseInt(process.env.AI_DETECTION_THRESHOLD ?? '60');
    const { content: humanizedContent, metrics } = await this.humanizerAgent.humanize(content, 2);
    content = humanizedContent;
    await this.progress('humanizing', 74, `Humanization done — AI score: ${metrics.aiProbabilityScore}/100`);

    // ─── Stage 4: Read Time Check & Expansion ───────────────────
    const minReadTime = parseFloat(process.env.MIN_READ_TIME_MINUTES ?? '5');
    if (metrics.readTimeMinutes < minReadTime) {
      await this.progress('writing', 76, `Expanding content (${metrics.readTimeMinutes.toFixed(1)}min < ${minReadTime}min)...`);
      content = await this.expandContent(content, outline, fakeResearch, mode, tone);
    }

    // ─── Stage 5: Professional Editing ──────────────────────────
    await this.progress('editing', 80, 'Professional editing pass...');
    content = await this.editorAgent.edit(content, outline.title);
    await this.progress('editing', 88, 'Editing complete');

    // ─── Stage 6: SEO Optimization ──────────────────────────────
    await this.progress('seo', 90, 'Optimizing for SEO...');
    const seoResult = await this.seoAgent.optimize(content, outline.title, topic.keywords ?? []);
    content = seoResult.optimizedContent;
    await this.progress('seo', 94, `SEO done — focus keyword: "${seoResult.focusKeyword}"`);

    // ─── Stage 7: Cover Image ───────────────────────────────────
    let coverImageUrl = '';
    let coverImagePrompts: string[] = [];
    let coverImageVariants: string[] = [];

    if (generateCoverImage) {
      await this.progress('cover_image', 95, 'Generating cover image...');
      try {
        const imageResult = await this.imageAgent.generateCoverImages(
          outline.title,
          research.whatIsIt.slice(0, 200),
          seoResult.tags,
        );
        coverImageUrl = imageResult.imageUrls[0] ?? '';
        coverImagePrompts = imageResult.prompts;
        coverImageVariants = imageResult.imageUrls;
      } catch (err) {
        console.error('Cover image generation failed:', err);
      }
    }

    // ─── Final Metrics ──────────────────────────────────────────
    const finalMetrics = this.humanizerAgent.calculateQualityMetrics(content);
    const words = content.split(/\s+/).filter(w => w.length > 0);

    await this.progress('complete', 100, '✅ Blog generation complete!');

    console.log('\n📊 Final Quality Report:');
    console.log(`   Word Count: ${finalMetrics.wordCount}`);
    console.log(`   Read Time: ${finalMetrics.readTimeMinutes.toFixed(1)} minutes`);
    console.log(`   AI Probability: ${finalMetrics.aiProbabilityScore}/100`);
    console.log(`   Burstiness: ${finalMetrics.burstinessScore.toFixed(2)}`);
    console.log(`   Lexical Richness: ${(finalMetrics.lexicalRichness * 100).toFixed(1)}%`);
    console.log(`   Readability Score: ${finalMetrics.readabilityScore.toFixed(0)}/100\n`);

    return {
      title: outline.title,
      subtitle: outline.subtitle,
      slug: seoResult.slug,
      markdownContent: content,
      metaDescription: seoResult.metaDescription,
      tags: seoResult.tags,
      focusKeyword: seoResult.focusKeyword,
      outline,
      research,
      metrics: finalMetrics,
      coverImageUrl,
      coverImagePrompts,
      coverImageVariants,
      internalLinkSuggestions: seoResult.internalLinkSuggestions,
      wordCount: finalMetrics.wordCount,
      readTimeMinutes: finalMetrics.readTimeMinutes,
    };
  }

  private async expandContent(
    content: string,
    outline: BlogOutline,
    research: Research,
    mode: BlogMode,
    tone: BlogTone,
  ): Promise<string> {
    const expandPrompt = `The following blog post is too short. Expand it to reach at least 1300 words (5 minute read).

Add:
1. A detailed real-world example with specific company/person and outcomes
2. Expand the most important section with 2-3 more paragraphs of depth
3. Add a "Common Mistakes" or "What I've Learned" section with 3-4 practical points
4. Make the FAQ section more detailed

Keep the same writing style and tone. Keep all existing markdown. Just add more quality content.

Current content:
---
${content}
---`;

    return this.ai_fallback_write(expandPrompt);
  }

  private async ai_fallback_write(prompt: string): Promise<string> {
    const claude = new AnthropicProvider();
    return claude.generateText(prompt, { temperature: 0.8, maxTokens: 6000 });
  }

  private async progress(stage: PipelineStage, percent: number, message: string): Promise<void> {
    if (this.onProgress) {
      await this.onProgress({ stage, progress: percent, message });
    }
  }
}
