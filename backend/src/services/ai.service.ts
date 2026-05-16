import OpenAI from 'openai';
import { config } from '../config/index.js';

const getClient = (): OpenAI | null => {
  if (!config.openai.apiKey) return null;
  return new OpenAI({ apiKey: config.openai.apiKey });
};

const CATEGORY_PRICE_RANGES: Record<string, { min: number; max: number }> = {
  Electronics: { min: 10, max: 3000 },
  Vehicles: { min: 500, max: 50000 },
  Furniture: { min: 20, max: 2000 },
  Clothing: { min: 5, max: 500 },
  Books: { min: 1, max: 200 },
  Sports: { min: 10, max: 1500 },
  Collectibles: { min: 5, max: 10000 },
};

const CONDITION_MULTIPLIERS: Record<string, number> = {
  NEW: 1.0,
  LIKE_NEW: 0.85,
  GOOD: 0.7,
  FAIR: 0.5,
  POOR: 0.3,
};

function mockDescription(category: string, condition: string): { title: string; description: string } {
  const c = category || 'Item';
  const cond = condition || 'GOOD';
  const condLabels: Record<string, string> = {
    NEW: 'Brand New',
    LIKE_NEW: 'Like New',
    GOOD: 'Well-Maintained',
    FAIR: 'Fair Condition',
    POOR: 'For Parts/Repair',
  };
  const label = condLabels[cond] || 'Pre-owned';
  return {
    title: `${label} ${c}`,
    description: `A ${label.toLowerCase()} ${c.toLowerCase()} in great shape. Perfect for anyone looking for a quality ${c.toLowerCase()} at a great price.`,
  };
}

function mockPriceSuggestion(
  title: string,
  category: string,
  condition: string
): { suggestedPrice: number; minPrice: number; maxPrice: number; explanation: string } {
  const range = CATEGORY_PRICE_RANGES[category] || { min: 5, max: 500 };
  const multiplier = CONDITION_MULTIPLIERS[condition] || 0.7;
  const mid = (range.min + range.max) / 2;
  const suggested = Math.round(mid * multiplier);
  const minPrice = Math.round(range.min * multiplier);
  const maxPrice = Math.round(range.max * multiplier);
  return {
    suggestedPrice: suggested,
    minPrice,
    maxPrice,
    explanation: `Based on the category "${category || 'General'}" and condition "${condition}", the estimated fair market value is between $${minPrice} and $${maxPrice}.`,
  };
}

function mockChatReply(message: string): string {
  const msg = message.toLowerCase();
  if (msg.includes('price') || msg.includes('cost') || msg.includes('how much')) {
    return 'Prices on Tradly are set by individual sellers. You can browse listings to compare prices or make an offer on items with "Best Offer" enabled.';
  }
  if (msg.includes('ship') || msg.includes('shipping') || msg.includes('delivery')) {
    return 'Shipping and delivery arrangements are handled between buyers and sellers on Tradly. We recommend discussing shipping details in the chat before completing a transaction.';
  }
  if (msg.includes('return') || msg.includes('refund')) {
    return 'Returns and refunds are managed between the buyer and seller. We recommend inspecting items in person when possible and discussing return policies before purchase.';
  }
  if (msg.includes('safe') || msg.includes('scam') || msg.includes('trust')) {
    return 'Safety is our priority on Tradly. Always communicate through our platform, meet in safe public places for in-person transactions, and check user reviews and trust scores before completing a sale.';
  }
  if (msg.includes('post') || msg.includes('list') || msg.includes('sell') || msg.includes('create')) {
    return 'To list a product, click the "Sell" button, add clear photos, write a detailed description, set a fair price, and choose the right category. Make sure your listing follows our community guidelines!';
  }
  return `That's a great question! On Tradly, you can browse products by category, chat with sellers, make offers, and buy or sell items locally. Could you provide more details so I can help you better?`;
}

export async function generateProductDescription(
  imageUrls: string[],
  category: string,
  condition: string
): Promise<{ title: string; description: string }> {
  const client = getClient();
  if (!client) {
    return mockDescription(category, condition);
  }

  try {
    const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
      {
        type: 'text',
        text: `You are a product listing assistant. Analyze the provided product images and generate:
1. A concise, SEO-friendly title (max 80 characters)
2. A detailed description (2-4 sentences) highlighting visible features, condition, and appeal

The product category is: ${category || 'Unknown'}
The condition is: ${condition || 'Unknown'}

Respond in JSON format: { "title": "...", "description": "..." }`,
      },
      ...imageUrls.map(
        (url): OpenAI.Chat.Completions.ChatCompletionContentPart => ({
          type: 'image_url',
          image_url: { url },
        })
      ),
    ];

    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: content }],
      max_tokens: 500,
      temperature: 0.7,
    });

    const text = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(text.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim());
    return {
      title: parsed.title || mockDescription(category, condition).title,
      description: parsed.description || mockDescription(category, condition).description,
    };
  } catch {
    return mockDescription(category, condition);
  }
}

export async function suggestFairPrice(
  title: string,
  description: string,
  category: string,
  condition: string
): Promise<{ suggestedPrice: number; minPrice: number; maxPrice: number; explanation: string }> {
  const client = getClient();
  if (!client) {
    return mockPriceSuggestion(title, category, condition);
  }

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a pricing expert for a marketplace. Based on the product details, suggest a fair market price range. Respond in JSON format: { "suggestedPrice": number, "minPrice": number, "maxPrice": number, "explanation": "string" }',
        },
        {
          role: 'user',
          content: `Title: ${title}\nDescription: ${description}\nCategory: ${category}\nCondition: ${condition}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.5,
    });

    const text = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(text.replace(/```json\s*/gi, '').replace(/```\s*$/g, '').trim());
    return {
      suggestedPrice: parsed.suggestedPrice ?? mockPriceSuggestion(title, category, condition).suggestedPrice,
      minPrice: parsed.minPrice ?? mockPriceSuggestion(title, category, condition).minPrice,
      maxPrice: parsed.maxPrice ?? mockPriceSuggestion(title, category, condition).maxPrice,
      explanation: parsed.explanation || mockPriceSuggestion(title, category, condition).explanation,
    };
  } catch {
    return mockPriceSuggestion(title, category, condition);
  }
}

export async function chatResponse(
  messages: { role: string; content: string }[],
  context?: any
): Promise<string> {
  const client = getClient();
  if (!client) {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    return mockChatReply(lastUserMsg?.content || '');
  }

  try {
    const systemPrompt = `You are TradlyAI, a helpful assistant for the Tradly marketplace. You help users find products, explain features, suggest categories, answer FAQs, and guide them through posting products. Be concise, friendly, and helpful. Only answer questions related to the marketplace.${
      context ? `\n\nCurrent context:\n${JSON.stringify(context, null, 2)}` : ''
    }`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({
          role: m.role as 'user' | 'assistant' | 'system',
          content: m.content,
        })),
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    return response.choices[0]?.message?.content || mockChatReply(messages[messages.length - 1]?.content || '');
  } catch {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    return mockChatReply(lastUserMsg?.content || '');
  }
}
