import Anthropic from '@anthropic-ai/sdk';
import { AIProvider, TextGenerationOptions } from './openai.provider';

let anthropicInstance: Anthropic | null = null;

function getAnthropic(): Anthropic {
  if (!anthropicInstance) {
    anthropicInstance = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicInstance;
}

export class AnthropicProvider implements AIProvider {
  private model: string;

  constructor(model = 'claude-sonnet-4-5') {
    this.model = model;
  }

  async generateText(prompt: string, options: TextGenerationOptions = {}): Promise<string> {
    const client = getAnthropic();

    const response = await client.messages.create({
      model: this.model,
      max_tokens: options.maxTokens ?? 8192,
      temperature: options.temperature ?? 0.8,
      ...(options.systemPrompt ? { system: options.systemPrompt } : {}),
      messages: [
        { role: 'user', content: prompt },
      ],
    });

    const block = response.content[0];
    return block.type === 'text' ? block.text : '';
  }

  async generateStructured<T>(prompt: string, options: TextGenerationOptions = {}): Promise<T> {
    const text = await this.generateText(prompt, {
      ...options,
      systemPrompt: (options.systemPrompt ?? '') + '\n\nRespond ONLY with valid JSON. No markdown fences, no preamble.',
    });

    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned) as T;
  }
}
