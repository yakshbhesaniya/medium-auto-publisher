import OpenAI from 'openai';

export interface TextGenerationOptions {
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIProvider {
  generateText(prompt: string, options?: TextGenerationOptions): Promise<string>;
  generateStructured<T>(prompt: string, options?: TextGenerationOptions): Promise<T>;
}

let openaiInstance: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiInstance) {
    openaiInstance = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiInstance;
}

export class OpenAIProvider implements AIProvider {
  private model: string;

  constructor(model = 'gpt-4o') {
    this.model = model;
  }

  async generateText(prompt: string, options: TextGenerationOptions = {}): Promise<string> {
    const client = getOpenAI();
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (options.systemPrompt) {
      messages.push({ role: 'system', content: options.systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const response = await client.chat.completions.create({
      model: this.model,
      messages,
      temperature: options.temperature ?? 0.8,
      max_tokens: options.maxTokens ?? 4096,
    });

    return response.choices[0]?.message?.content ?? '';
  }

  async generateStructured<T>(prompt: string, options: TextGenerationOptions = {}): Promise<T> {
    const text = await this.generateText(prompt, {
      ...options,
      systemPrompt: (options.systemPrompt ?? '') + '\n\nAlways respond with valid JSON only. No markdown, no explanation.',
    });

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as T;
  }

  async generateImage(prompt: string, size: '1024x1024' | '1792x1024' | '1024x1792' = '1792x1024'): Promise<string> {
    const client = getOpenAI();
    const response = await client.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality: 'hd',
      style: 'vivid',
    });

    return response?.data?.[0]?.url ?? '';
  }
}
