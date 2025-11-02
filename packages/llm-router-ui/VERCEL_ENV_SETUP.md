# Vercel Environment Variables Setup

## Quick Fix for Deployment Error

**Error:** `Environment Variable "OPENAI_API_KEY" references Secret "openai-api-key", which does not exist`

**Solution:** Add environment variables directly in Vercel Dashboard (not as secrets)

---

## Step-by-Step Setup

### 1. Go to Vercel Dashboard

Visit: https://vercel.com/dashboard

### 2. Select Your Project

Click on `llm-router-ui` (or your project name)

### 3. Add Environment Variables

**Navigate to:** Settings → Environment Variables

**Add Variable 1:**
```
Key: OPENAI_API_KEY
Value: sk-proj-xxxxxxxxxxxxx (your actual OpenAI API key)
Environments: 
  ✓ Production
  ✓ Preview  
  ✓ Development
```

**Add Variable 2:**
```
Key: ANTHROPIC_API_KEY
Value: sk-ant-xxxxxxxxxxxxx (your actual Anthropic API key)
Environments:
  ✓ Production
  ✓ Preview
  ✓ Development
```

### 4. Save and Redeploy

**Option A: Automatic (Recommended)**
- Commit and push the updated `vercel.json`
- Vercel will automatically redeploy

**Option B: Manual**
- Go to **Deployments** tab
- Find the failed deployment
- Click **"..."** menu
- Click **"Redeploy"**

---

## Verification

### Check Environment Variables Are Set

1. Go to Settings → Environment Variables
2. You should see:
   ```
   OPENAI_API_KEY         Production, Preview, Development
   ANTHROPIC_API_KEY      Production, Preview, Development
   ```

### Check Deployment Logs

1. Go to Deployments tab
2. Click on the latest deployment
3. Check build logs - should see:
   ```
   ✓ Building llm-router...
   ✓ Building llm-router-ui...
   ✓ Deployment successful
   ```

---

## What Changed

### Before (Incorrect)
```json
{
  "env": {
    "OPENAI_API_KEY": "@openai-api-key",
    "ANTHROPIC_API_KEY": "@anthropic-api-key"
  }
}
```
❌ This references secrets that don't exist

### After (Correct)
```json
{
  "buildCommand": "...",
  "installCommand": "..."
}
```
✅ Environment variables set directly in Vercel Dashboard

---

## Important Notes

### Security
- ✅ Environment variables in Vercel Dashboard are encrypted
- ✅ Not exposed in build logs
- ✅ Only accessible during build and runtime

### Don't Commit API Keys
- ❌ Never commit API keys to git
- ❌ Never put them in `vercel.json`
- ✅ Always use Vercel Dashboard or CLI

### For Local Development
Create `.env.local` in `packages/llm-router-ui/`:
```bash
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

Add to `.gitignore`:
```
.env.local
.env*.local
```

---

## Troubleshooting

### Issue: "API key not found" at runtime

**Check:**
1. Environment variables are set for correct environment (Production/Preview)
2. Variable names match exactly (case-sensitive)
3. Redeploy after adding variables

### Issue: Still getting secret error

**Solution:**
1. Remove the `env` section from `vercel.json` completely
2. Commit and push
3. Add variables in Vercel Dashboard
4. Redeploy

---

## Next Steps

1. ✅ Remove `env` section from `vercel.json` (done)
2. ✅ Commit and push changes
3. ✅ Add environment variables in Vercel Dashboard
4. ✅ Redeploy and verify

**Your deployment should now succeed!** 🚀
