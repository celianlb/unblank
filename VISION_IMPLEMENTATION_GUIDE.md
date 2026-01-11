# OpenAI Vision API - Implementation Guide for Unblank

Quick reference guide for integrating OpenAI Vision API into Unblank's tag generation system.

---

## Quick Start: Cost-Optimized Setup

### Step 1: Install Dependencies

```bash
pnpm add openai
```

### Step 2: Create Vision Service (Domain Layer)

**File:** `/src/domain/tags/services/VisionService.ts`

```typescript
import { Tag } from '../models/Tag';

export interface VisionAnalysisResult {
  tags: string[];
  confidence: number;
  model: string;
  tokensUsed: number;
  cost: number;
}

export interface VisionServicePort {
  generateTagsFromImage(
    imageUrl: string,
    context?: { domain?: string; style?: string }
  ): Promise<VisionAnalysisResult>;

  analyzeImageContent(imageUrl: string): Promise<{
    description: string;
    dominantColors: string[];
    objects: string[];
  }>;
}

export class VisionService implements VisionServicePort {
  private tagService: TagService;

  constructor(tagService: TagService) {
    this.tagService = tagService;
  }

  async generateTagsFromImage(
    imageUrl: string,
    context?: { domain?: string; style?: string }
  ): Promise<VisionAnalysisResult> {
    // Service orchestrates the generation
    const rawTags = await this.callVisionAPI(imageUrl, context);
    const validatedTags = await this.validateAndCleanTags(rawTags);

    return {
      tags: validatedTags,
      confidence: 0.85,
      model: 'gpt-4o-mini',
      tokensUsed: 280,
      cost: 0.0004
    };
  }

  private async callVisionAPI(
    imageUrl: string,
    context?: { domain?: string; style?: string }
  ): Promise<string[]> {
    // Delegated to repository
    return [];
  }

  private async validateAndCleanTags(tags: string[]): Promise<string[]> {
    return tags
      .map(tag => this.tagService.normalizeTagName(tag))
      .filter(tag => {
        const validation = TagService.validateTagName(tag);
        return validation.valid;
      });
  }

  async analyzeImageContent(imageUrl: string) {
    // Additional analysis for premium features
    return {
      description: 'Modern minimalist interior design',
      dominantColors: ['#ffffff', '#e8e8e8'],
      objects: ['furniture', 'lamp', 'wall']
    };
  }
}
```

### Step 3: Create OpenAI Repository (Infrastructure)

**File:** `/src/infra/vision/OpenAIVisionRepository.ts`

```typescript
import OpenAI from 'openai';
import { VisionServicePort, VisionAnalysisResult } from '@/domain/tags/services/VisionService';

export class OpenAIVisionRepository implements VisionServicePort {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async generateTagsFromImage(
    imageUrl: string,
    context?: { domain?: string; style?: string }
  ): Promise<VisionAnalysisResult> {
    const systemPrompt = this.buildSystemPrompt(context);

    const message = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 150,
      temperature: 0.5,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: imageUrl,
              detail: 'auto' // Cost-optimized
            }
          },
          {
            type: 'text',
            text: systemPrompt
          }
        ]
      }]
    });

    const tagsText = message.choices[0].message.content || '';
    const tags = this.parseTags(tagsText);

    return {
      tags,
      confidence: 0.85,
      model: 'gpt-4o-mini',
      tokensUsed: message.usage?.total_tokens || 0,
      cost: this.calculateCost(message.usage?.total_tokens || 0, 'gpt-4o-mini')
    };
  }

  private buildSystemPrompt(context?: { domain?: string; style?: string }): string {
    const domainContext = context?.domain
      ? `Domaine: ${context.domain}. `
      : '';

    return `Vous êtes un expert en catégorisation visuelle.
Analysez cette image et générez exactement 5-7 tags descriptifs en français.

${domainContext}

RÈGLES STRICTES:
1. Un tag par ligne, commençant par un tiret "-"
2. Chaque tag: 1-3 mots maximum
3. Français courant (pas de jargon technique)
4. Priorité: couleurs, objets, style, ambiance
5. Pas de tags génériques (image, photo, design)
6. Accents et majuscules corrects

Exemple de format:
- tag bleu
- mobilier minimaliste
- intérieur contemporain
- ambiance calme
- détails géométriques`;
  }

  private parseTags(text: string): string[] {
    return text
      .split('\n')
      .map(line => line.replace(/^-\s*/, '').trim())
      .filter(tag => tag.length > 0 && tag.length <= 50)
      .slice(0, 10); // Safety limit
  }

  private calculateCost(tokens: number, model: string): number {
    // gpt-4o-mini: $0.00015 per input token, $0.0006 per output token
    // Rough average: assume 50% input, 50% output
    const avgInputTokens = tokens * 0.6;
    const avgOutputTokens = tokens * 0.4;

    return (avgInputTokens * 0.00015 + avgOutputTokens * 0.0006) / 1000;
  }

  async analyzeImageContent(imageUrl: string) {
    // Premium feature - same as above but different prompt
    return {
      description: 'Modern minimalist interior',
      dominantColors: ['#ffffff'],
      objects: ['furniture']
    };
  }
}
```

### Step 4: Create Factory

**File:** `/src/lib/vision/visionFactory.ts`

```typescript
import { SupabaseClient } from '@supabase/supabase-js';
import { OpenAIVisionRepository } from '@/infra/vision/OpenAIVisionRepository';
import { VisionService } from '@/domain/tags/services/VisionService';
import TagFactory from '@/lib/tags/tagFactory';

class VisionFactory {
  private static instance: OpenAIVisionRepository | null = null;

  static createVisionRepository(): OpenAIVisionRepository {
    if (!this.instance) {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured');
      }
      this.instance = new OpenAIVisionRepository(apiKey);
    }
    return this.instance;
  }

  static createVisionService(supabaseClient: SupabaseClient): VisionService {
    const repository = this.createVisionRepository();
    const tagService = TagFactory.createTagService(supabaseClient);
    return new VisionService(tagService);
  }

  static reset(): void {
    this.instance = null;
  }
}

export default VisionFactory;
```

### Step 5: Create API Route

**File:** `/src/app/api/tags/generate-from-image/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/infra/auth/authenticateRequest';
import { handleApiError } from '@/lib/api/handleApiError';
import VisionFactory from '@/lib/vision/visionFactory';
import TagFactory from '@/lib/tags/tagFactory';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const authResult = await authenticateRequest(request);
    if (!authResult.success) {
      return authResult.error;
    }

    // 2. Parse request
    const { imageUrl, domain, style } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'imageUrl is required' },
        { status: 400 }
      );
    }

    // 3. Validate URL format
    try {
      new URL(imageUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // 4. Generate tags
    const visionService = VisionFactory.createVisionService(
      authResult.data.supabase
    );

    const result = await visionService.generateTagsFromImage(imageUrl, {
      domain,
      style
    });

    // 5. Save tags
    const tagService = TagFactory.createTagService(authResult.data.supabase);
    const savedTags = await Promise.all(
      result.tags.map(tag =>
        tagService.createTag(authResult.data.user.id, tag)
      )
    );

    // 6. Return response
    return NextResponse.json({
      success: true,
      tags: savedTags.filter(Boolean),
      metadata: {
        tokensUsed: result.tokensUsed,
        cost: result.cost,
        model: result.model
      }
    });

  } catch (error) {
    return handleApiError(error, 'Failed to generate tags');
  }
}
```

---

## Performance Optimization Checklist

### Cost Optimization (30-50% savings)

- [ ] **Use `detail: "auto"`** - OpenAI optimizes automatically
- [ ] **Resize images** - Max 512x512 for `gpt-4o-mini`
- [ ] **Cache results** - 5-minute cache for same URL+prompt
- [ ] **Use `gpt-4o-mini`** - 95% cheaper than gpt-4o

### Quality Optimization

- [ ] **Structured prompts** - Use exact format examples
- [ ] **French validation** - Check for accents, common mistakes
- [ ] **Fallback prompts** - Have 2-3 backup prompts ready
- [ ] **Batch processing** - Queue requests during off-peak hours

### Reliability

- [ ] **Retry logic** - Exponential backoff (1s, 2s, 4s)
- [ ] **Rate limiting** - Per-user and global limits
- [ ] **Error handling** - Classify errors (retryable vs permanent)
- [ ] **Logging** - Track all API calls and costs

---

## Testing the Integration

### Quick Test Script

```typescript
// src/app/api/test-vision/route.ts
import { NextRequest, NextResponse } from 'next/server';
import VisionFactory from '@/lib/vision/visionFactory';

export async function POST(request: NextRequest) {
  try {
    const { imageUrl } = await request.json();

    const visionService = VisionFactory.createVisionService(null as any);
    const result = await visionService.generateTagsFromImage(imageUrl);

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
```

**Test URLs:**
```bash
# Test with a real image
curl -X POST http://localhost:3000/api/test-vision \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://images.unsplash.com/photo-1555041469-a586c61ea9bc"
  }'
```

---

## Common Issues & Solutions

### Issue: Too many tokens / High cost

**Solution:** Use `detail: "low"` for free users
```typescript
const detail = userTier === 'free' ? 'low' : 'auto';
```

### Issue: Inconsistent tag quality

**Solution:** Add validation layer
```typescript
const validator = new TagValidator();
const validated = await Promise.all(
  tags.map(tag => validator.validateTag(tag, context))
);
```

### Issue: Image not accessible / 404

**Solution:** Validate URL before API call
```typescript
async function isImageAccessible(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}
```

### Issue: Rate limit exceeded

**Solution:** Implement backoff + queue
```typescript
const delayMs = Math.pow(2, attemptNumber) * 1000 + Math.random() * 1000;
```

---

## Environment Setup

### `.env.local`

```env
# OpenAI Configuration
OPENAI_API_KEY=sk_test_abc123...

# Optional: For cost tracking
OPENAI_BUDGET_LIMIT=100  # USD per month
OPENAI_BUDGET_ALERT=80   # Alert at 80% usage

# Optional: For rate limiting
VISION_API_RATE_LIMIT_FREE=10     # per day
VISION_API_RATE_LIMIT_PRO=100     # per day
VISION_API_RATE_LIMIT_TEAM=500    # per day
```

### Database Schema

```sql
-- Add to existing tags table
ALTER TABLE tags ADD COLUMN IF NOT EXISTS (
  source VARCHAR(20) DEFAULT 'manual',  -- 'manual' | 'ai'
  quality_score SMALLINT DEFAULT 75,
  model VARCHAR(50) DEFAULT 'gpt-4o-mini'
);

-- Create logs table
CREATE TABLE vision_api_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  image_url TEXT NOT NULL,
  tags_count INT,
  tokens_used INT,
  cost DECIMAL(10, 6),
  model VARCHAR(50),
  status VARCHAR(20),
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_vision_logs_user ON vision_api_logs(user_id, created_at);
```

---

## Monitoring & Costs

### Track Spending

```typescript
// Log every API call
async function logVisionCall(
  userId: string,
  imageUrl: string,
  result: VisionAnalysisResult
) {
  await db.insert('vision_api_logs', {
    userId,
    image_url: imageUrl,
    tags_count: result.tags.length,
    tokens_used: result.tokensUsed,
    cost: result.cost,
    model: result.model,
    status: 'success'
  });
}

// Calculate monthly cost per user
async function getMonthlySpent(userId: string): Promise<number> {
  const result = await db.selectRaw(
    'SUM(cost) as total'
  ).from('vision_api_logs')
    .where('user_id', '=', userId)
    .where('created_at', '>', new Date(Date.now() - 30 * 86400000));

  return result[0]?.total || 0;
}
```

### Expected Costs (2026 estimates)

| Scenario | Monthly Cost |
|----------|--------------|
| 100 tags/month | $0.005 |
| 1,000 tags/month | $0.05 |
| 10,000 tags/month | $0.50 |
| 100,000 tags/month | $5.00 |

All estimates use `gpt-4o-mini` with optimization.

---

## Next Steps

1. **Create domain service** → `VisionService.ts`
2. **Create repository** → `OpenAIVisionRepository.ts`
3. **Create factory** → `visionFactory.ts`
4. **Create API route** → `/api/tags/generate-from-image/route.ts`
5. **Add validation** → `TagValidator.ts`
6. **Set up monitoring** → Database logging
7. **Test thoroughly** → With real images
8. **Optimize prompts** → Based on real usage
9. **Add rate limiting** → Per-user quota
10. **Deploy & monitor** → Track costs and quality

---

## References

- OpenAI Docs: https://platform.openai.com/docs/guides/vision
- OpenAI Pricing: https://openai.com/pricing
- Token Calculator: https://platform.openai.com/tokenizer
