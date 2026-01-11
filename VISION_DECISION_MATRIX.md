# OpenAI Vision API - Decision Matrix & Quick Reference

Quick decision guides for common scenarios in Unblank's tag generation implementation.

---

## Model Selection Decision Tree

```
Need to generate tags from an image?
│
├─ Free user?
│  └─ Use gpt-4o-mini with detail: "low"
│     Cost: ~$0.001-0.003 per image
│     Quality: Good for basic tagging
│
├─ Pro user?
│  └─ Use gpt-4o-mini with detail: "auto"
│     Cost: ~$0.003-0.008 per image
│     Quality: Excellent balance
│
├─ Team user?
│  ├─ Need enhanced analysis?
│  │  └─ Use gpt-4o with detail: "auto"
│  │     Cost: ~$0.008-0.015 per image
│  │     Quality: Premium
│  │
│  └─ Standard tagging?
│     └─ Use gpt-4o-mini with detail: "auto"
│        Cost: ~$0.003-0.008 per image
│        Quality: Excellent
│
└─ Batch processing?
   └─ Use gpt-4o-mini (queue-based)
      Cost: ~$0.002-0.005 per image
      Timing: Process during off-peak hours
```

---

## Error Handling Decision Matrix

| Error Type | HTTP Status | Retry? | Fallback? | User Message |
|-----------|------------|--------|-----------|--------------|
| Rate limit exceeded | 429 | Yes (backoff) | No | "Too many requests, try again in a few minutes" |
| Invalid API key | 401 | No | No | "Server configuration error" |
| Image not accessible | 400 | No | Yes | "Image URL is not accessible" |
| Image too large | 400 | No | Yes | "Image is too large, try a smaller one" |
| Content policy | 400 | No | Yes | "Image violates content policy" |
| Model overloaded | 503 | Yes (backoff) | No | "Service busy, please retry" |
| Network error | 503 | Yes (backoff) | No | "Network error, retrying..." |
| Unknown error | 500 | Yes (once) | Yes | "Failed to generate tags, try again" |

---

## Prompt Selection Decision Matrix

### By Domain

```
interior_design
├─ Must include: meubles, couleurs, ambiance
├─ Temperature: 0.6
└─ Example tags: mobilier minimaliste, bleu doux, intérieur moderne

architecture
├─ Must include: structure, style, matériaux
├─ Temperature: 0.5
└─ Example tags: bâtiment moderne, béton brut, façade géométrique

fashion
├─ Must include: vêtements, couleurs, style
├─ Temperature: 0.7
└─ Example tags: robe épurée, bleu marine, style bohème

art
├─ Must include: technique, style, émotion
├─ Temperature: 0.8
└─ Example tags: peinture abstraite, couleurs vives, textures
```

### By Language Requirement

```
French_Only
├─ Validate: No English words
├─ Check: Accents and grammar
├─ Score: Reject <60
└─ Temperature: 0.5 (consistency)

French_with_Props
├─ Allow: Brand names (Apple, IKEA)
├─ Validate: French descriptions
├─ Score: Accept >50
└─ Temperature: 0.6

Brand_Context
├─ Example: "#NoordLycée" in image
├─ Include: Hashtags and brand terms
├─ Validate: French quality
└─ Temperature: 0.7
```

---

## Image Preprocessing Decision Matrix

| Image Size | Preprocessing | Tokens | Cost | Recommendation |
|-----------|---------------|--------|------|-----------------|
| <256KB | None | 85 | $0.0001 | Direct API call |
| 256KB-1MB | Resize to 512x512 | 150 | $0.0002 | Preprocess first |
| 1MB-5MB | Resize + WebP conversion | 120 | $0.0002 | Always preprocess |
| >5MB | Reject | N/A | $0 | Send error to user |

---

## Caching Strategy Decision Matrix

| Scenario | Cache? | TTL | Key |
|----------|--------|-----|-----|
| Same image URL, same prompt | Yes | 5 min | `${imageUrl}:${promptHash}` |
| Same image URL, different user | Yes | 5 min | Use cached tags |
| User uploads new image | No | N/A | Different URL |
| Image changes externally | No | N/A | Recommend recache |
| Fallback results | No | N/A | Don't cache fallback tags |

---

## Rate Limiting Decision Matrix

### Check Order (most efficient)

```javascript
// 1. Check minute limit (fastest to fail)
if (minuteRequests > limit.perMinute) {
  return 429; // Fast fail
}

// 2. Check hour limit
if (hourRequests > limit.perHour) {
  return 429;
}

// 3. Check daily limit (slowest but most important)
if (dailyRequests > limit.perDay) {
  return 429;
}

// 4. Allow request
return 200;
```

### Retry-After Calculation

```javascript
function getRetryAfter(limitType, attemptNumber) {
  // From Retry-After header if available
  if (headers['retry-after']) {
    return parseRetryAfter(headers['retry-after']);
  }

  // Calculated backoff
  switch(limitType) {
    case 'minute':
      return 60 - (Date.now() % 60000);
    case 'hour':
      return 3600 - (Date.now() % 3600000);
    case 'day':
      return 86400 - (Date.now() % 86400000);
    default:
      return Math.pow(2, attemptNumber) * 1000; // Exponential
  }
}
```

---

## Validation Quality Score Decision Matrix

| Score Range | Action | User Impact |
|-----------|--------|------------|
| 90-100 | Accept | Show as auto-generated |
| 75-89 | Accept + info | Show with "AI-generated" badge |
| 60-74 | Accept + warning | Optional manual review |
| 40-59 | Optional regenerate | Suggest regeneration |
| 0-39 | Reject | Show error, offer manual tagging |

---

## Cost Control Decision Matrix

### Monthly Budget Tracking

```
If cost reaches:
├─ 50% of budget: Enable warnings in logs
├─ 75% of budget: Reduce free tier limits
├─ 90% of budget: Send alert to admin
├─ 100% of budget: Disable for non-premium users
└─ 120% of budget: Emergency throttling (queue all requests)
```

### Per-User Quota Enforcement

```
Free user: $0.10/month
├─ 100 images: ~$0.05 (safe margin)
├─ 150 images: Approaching limit (warn user)
└─ 200 images: Disable until next month

Pro user: $1.00/month
├─ 1000 images: ~$0.50 (safe margin)
├─ 1500 images: Approaching limit (warn user)
└─ 2000 images: Disable until next month

Team user: $5.00/month
├─ Unlimited practical (5000+ images)
└─ Monitor only
```

---

## Prompt Engineering Decision Matrix

### Complexity Level Selection

```
Low Complexity
├─ Simple photos (single subject)
├─ Prompt length: <300 words
├─ Temperature: 0.4-0.5
├─ Cost: ~$0.002 per image
└─ Quality: 85%+

Medium Complexity
├─ Complex scenes (multiple subjects)
├─ Prompt length: 300-500 words
├─ Temperature: 0.5-0.7
├─ Cost: ~$0.004 per image
└─ Quality: 90%+

High Complexity
├─ Artistic or abstract (interpretation needed)
├─ Prompt length: 500+ words
├─ Chain-of-thought reasoning
├─ Temperature: 0.7-0.9
├─ Cost: ~$0.008+ per image
└─ Quality: 95%+
```

### Few-Shot Learning Decision

```
Include examples if:
├─ Domain is specialized (architecture, fashion)
├─ Language is non-English (French)
├─ Consistency is critical
├─ Cost increase <10%
└─ Expected quality gain >5%

Don't include examples if:
├─ Generic image content
├─ Time-sensitive generation
├─ Cost budget is tight
└─ Historical data shows 85%+ quality
```

---

## Integration Point Decision Matrix

### Where to Add Vision API

| Feature | Integration Point | Trigger | Async? |
|---------|-------------------|---------|--------|
| Auto-tag new bookmarks | Before save | URL added | Yes |
| Bulk tag existing | Background job | User button | Yes |
| Tag suggestions | On demand | User popup | No |
| Image analysis | Detail panel | User click | Yes |
| Bulk analysis | Queue job | Admin tool | Yes |

---

## Testing Decision Matrix

### Test Case Selection by Risk Level

```
HIGH RISK (Test thoroughly)
├─ French language validation
├─ Error handling for each error type
├─ Rate limiting enforcement
└─ Cost calculation accuracy

MEDIUM RISK (Standard testing)
├─ Tag quality validation
├─ Fallback mechanisms
├─ Image preprocessing
└─ Caching behavior

LOW RISK (Smoke test)
├─ Happy path (valid image → tags)
├─ UI integration
├─ Analytics logging
└─ Error messages
```

### Performance Benchmark Targets

```
API Response Time
├─ P50: <500ms (50th percentile)
├─ P90: <1s (90th percentile)
├─ P99: <2s (99th percentile)
└─ Max: <5s (timeout)

Tag Quality Metrics
├─ Validation pass rate: >90%
├─ User retention: >85% (tags kept)
├─ Language accuracy: 98%+ French
└─ Domain relevance: >80%

System Reliability
├─ API success rate: >99%
├─ Retry effectiveness: >95%
├─ Cache hit rate: 10-20%
└─ Error recovery: 100%
```

---

## Migration Decision Matrix

### If Adding to Existing Bookmark System

```
Option A: Async Generation (Recommended)
├─ User clicks "Generate tags"
├─ Process runs in background
├─ Tags appear after 1-3 seconds
├─ User is notified
└─ Handles failures gracefully

Option B: On-Save Generation
├─ User saves bookmark
├─ Tags generated automatically
├─ Block until complete (timeout: 2s)
├─ Fallback to manual if timeout
└─ Better UX but slower initial save

Option C: Batch Generation
├─ Cron job runs nightly
├─ Generate tags for new bookmarks
├─ Distribute load, minimize costs
├─ Users see tags next morning
└─ Best for cost optimization
```

---

## A/B Testing Decision Matrix

### What to Test

```
HIGH IMPACT (Test first)
├─ Prompt wording (French examples)
├─ Temperature (0.5 vs 0.7)
├─ Detail level (low vs auto)
└─ Tag count (5 vs 7)

MEDIUM IMPACT (Test second)
├─ Response format
├─ Validation strictness
├─ Fallback mechanisms
└─ UI presentation

LOW IMPACT (Don't test)
├─ Model version
├─ Exact cost calculations
├─ Minor wording changes
└─ Database fields
```

### Test Success Metrics

```
Metric: User Retention (% of tags kept)
├─ Current: Unknown (baseline)
├─ Target: 85%+
├─ Success: >80% of tags not deleted
└─ Minimum sample: 100 users

Metric: Tag Quality Score
├─ Current: Unknown (baseline)
├─ Target: 85+
├─ Success: Mean quality >80
└─ Minimum sample: 1000 tags

Metric: Time to Generate
├─ Current: Unknown (baseline)
├─ Target: <2 seconds
├─ Success: P90 <2s
└─ Minimum sample: 1000 requests
```

---

## Pricing Tier Decision Matrix

### Free Tier Features

```
✓ Auto-tag from images: 10/month
✓ Manual tag creation: Unlimited
✓ Basic validation: Yes
✗ Enhanced quality: No
✗ Tag suggestions: No
✗ AI analysis: No
```

### Pro Tier Features

```
✓ Auto-tag from images: 100/month
✓ Manual tag creation: Unlimited
✓ Basic validation: Yes
✓ Enhanced quality: Yes (gpt-4o-mini auto)
✓ Tag suggestions: Yes
✗ AI analysis: No
✗ Priority processing: No
```

### Team Tier Features

```
✓ Auto-tag from images: 500/month
✓ Manual tag creation: Unlimited
✓ Basic validation: Yes
✓ Enhanced quality: Yes (gpt-4o available)
✓ Tag suggestions: Yes
✓ AI analysis: Yes (detailed)
✓ Priority processing: Yes
✓ Bulk operations: Yes
```

---

## Quick Troubleshooting Guide

### Problem: High API Costs

**First check:**
```
1. Are we using gpt-4o-mini? (not gpt-4o)
2. Is detail="auto"? (not "high")
3. Are we caching results? (5-minute window)
4. Are large images preprocessed? (<512x512)
```

**Quick fixes:**
```
- Switch to gpt-4o-mini: -50% cost
- Use detail="auto": -20% cost
- Implement caching: -15% cost
- Preprocess images: -10% cost
- Batch during off-peak: -5% cost
= Total savings: ~80%
```

### Problem: Poor Tag Quality

**First check:**
```
1. Are we using French examples? (few-shot)
2. Is temperature 0.5-0.7? (too high = inconsistent)
3. Are we validating? (should filter bad tags)
4. Is the image clear? (resolution/quality)
```

**Quick fixes:**
```
- Add French examples to prompt: +10% quality
- Lower temperature to 0.5: +5% consistency
- Add validation layer: +15% effective quality
- Reject blurry images: +10% overall quality
= Total improvement: ~25-30%
```

### Problem: Rate Limiting Failures

**First check:**
```
1. Per-minute limits being hit?
2. Per-hour limits being hit?
3. Per-day limits being hit?
4. Is the user at their tier limit?
```

**Quick fixes:**
```
- Use queue-based processing: Smooth out spikes
- Increase tier limits: If user upgraded
- Add caching: Reduce API calls
- Schedule batch jobs: Run during off-peak
- Notify user: Show remaining quota
```

---

## Decision Support: When to Use What

### When to use `gpt-4o-mini`
- Default choice for tag generation
- Free users
- Standard quality needs
- Cost-conscious deployments
- Batch processing

### When to use `gpt-4o`
- Team tier users (premium)
- Complex image analysis needed
- Marginal quality improvement acceptable
- Budget permits 2x cost increase

### When to use fallback (metadata)
- Vision API fails or rate limited
- Image not accessible
- User is free tier (fallback tier)
- Rapid prototyping/development

### When to use queue/batch
- 10+ images at once
- Off-peak processing acceptable
- Maximum cost optimization needed
- Internal analytics/reporting

### When to skip Vision API
- User prefers manual tags
- Image quality is poor
- User quota exhausted
- System under heavy load

---

## Reference: Environment Variables

```env
# Required
OPENAI_API_KEY=sk_...

# Optional: Cost Controls
VISION_BUDGET_LIMIT_USD=100
VISION_BUDGET_ALERT_PCT=80
VISION_COST_TRACKING=true

# Optional: Rate Limiting
VISION_RATE_LIMIT_FREE_DAY=10
VISION_RATE_LIMIT_PRO_DAY=100
VISION_RATE_LIMIT_TEAM_DAY=500

# Optional: Model Selection
VISION_DEFAULT_MODEL=gpt-4o-mini
VISION_PREMIUM_MODEL=gpt-4o
VISION_DETAIL_LEVEL=auto

# Optional: Features
VISION_CACHING_ENABLED=true
VISION_CACHING_TTL=300
VISION_VALIDATION_ENABLED=true
VISION_AI_QUALITY_CHECK_ENABLED=false
```

---

**Last Updated:** January 8, 2026
**For Implementation Questions:** See VISION_IMPLEMENTATION_GUIDE.md
**For Deep Technical Details:** See RESEARCH_OPENAI_VISION_AND_TAGS.md
