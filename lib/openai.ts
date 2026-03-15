import OpenAI from 'openai';

const apiKey = process.env.OPENAI_API_KEY || 'placeholder';

export const openai = new OpenAI({ apiKey });

export function isOpenAIConfigured(): boolean {
  return apiKey !== 'placeholder' && apiKey.length > 10;
}
