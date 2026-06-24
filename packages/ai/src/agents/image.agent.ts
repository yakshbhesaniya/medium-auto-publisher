import { OpenAIProvider } from '../providers/openai.provider';

export interface CoverImageResult {
  prompts: string[];
  imageUrls: string[];
  selectedIndex: number;
}

const IMAGE_STYLES = [
  {
    name: 'Technical Futuristic',
    suffix: 'dark background, glowing neural network nodes, blue and purple neon accents, cinematic lighting, ultra-detailed, 8k, professional tech aesthetic',
  },
  {
    name: 'Minimal Professional',
    suffix: 'clean white background, minimal geometric shapes, modern typography space, subtle gradients, professional, magazine cover quality',
  },
  {
    name: 'Cinematic Abstract',
    suffix: 'dramatic cinematic lighting, abstract data visualization, rich deep colors, photographic quality, award-winning composition',
  },
];

export class ImageAgent {
  constructor(private openai: OpenAIProvider) {}

  async generateCoverImages(blogTitle: string, blogSummary: string, tags: string[]): Promise<CoverImageResult> {
    console.log(`🎨 Image Agent: Generating cover image prompts for "${blogTitle}"`);

    // First, generate 3 creative visual concept prompts
    const conceptPrompt = `You are a creative director for a premium tech publication. Generate 3 DALL-E image prompts for a blog cover image.

Blog title: "${blogTitle}"
Topic summary: ${blogSummary}
Tags: ${tags.join(', ')}

Generate 3 distinct visual concepts. Each should be a metaphorical, visual representation — NOT literal text or charts.

Return JSON:
{
  "prompts": [
    "Visual concept 1: [detailed DALL-E prompt describing the core visual metaphor]",
    "Visual concept 2: [different metaphor, different mood]",
    "Visual concept 3: [abstract/minimalist approach]"
  ]
}

Rules for prompts:
- No text, words, or typography in the image
- Focus on abstract visual metaphors that represent the topic
- Be specific about lighting, color palette, composition
- Make them visually striking and professional
- Medium-friendly (landscape/widescreen format)

Example for "Multi-Agent AI Systems":
"A glowing neural constellation — multiple luminous spheres connected by thin light trails forming an intelligent network. Deep space background with soft purple nebula clouds. Each node pulses with inner light. Cinematic composition, ultra-detailed, photorealistic render."`;

    const conceptResult = await this.openai.generateStructured<{ prompts: string[] }>(conceptPrompt, {
      temperature: 0.9,
      maxTokens: 1000,
    });

    const styleEnhancedPrompts = conceptResult.prompts.map((prompt, i) => {
      const style = IMAGE_STYLES[i % IMAGE_STYLES.length];
      return `${prompt}, ${style.suffix}`;
    });

    console.log(`  Generated ${styleEnhancedPrompts.length} image prompts, generating images...`);

    // Generate first image (most important one) and offer the prompts for others
    // In production, you'd generate all 3, but let's start with 1 to save cost
    const imageUrls: string[] = [];

    try {
      const primaryUrl = await this.openai.generateImage(styleEnhancedPrompts[0], '1792x1024');
      imageUrls.push(primaryUrl);
    } catch (err) {
      console.error('Image generation failed:', err);
      imageUrls.push(''); // Placeholder
    }

    console.log(`✅ Image Agent: Generated ${imageUrls.filter(u => u).length} cover images`);

    return {
      prompts: styleEnhancedPrompts,
      imageUrls,
      selectedIndex: 0,
    };
  }

  async generateAdditionalVariants(prompts: string[]): Promise<string[]> {
    const urls = await Promise.allSettled(
      prompts.slice(1).map(p => this.openai.generateImage(p, '1792x1024')),
    );

    return urls.map(r => (r.status === 'fulfilled' ? r.value : ''));
  }
}
