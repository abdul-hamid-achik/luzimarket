# Luzimarket Deployment Guide

## 🚀 First Time Deployment Steps

### Prerequisites
- Vercel account
- GitHub repository with secrets configured
- Production database (PostgreSQL)
- Stripe account with API keys
- Resend account for emails

### Step 1: Deploy from CLI (First Time)

```bash
# Login to Vercel
vercel login

# Deploy to Vercel (this will create the project)
vercel

# Follow the prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - What's your project's name? luzimarket
# - In which directory is your code located? ./
# - Want to modify settings? N
```

### Step 2: Configure Environment Variables in Vercel Dashboard

After the initial deployment, go to your Vercel dashboard:

1. Navigate to your project
2. Go to Settings → Environment Variables
3. Add the following variables for Production:

```
DATABASE_URL=your_production_postgres_url
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your_nextauth_secret
RESEND_API_KEY=your_resend_api_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

### Step 3: Set up GitHub Secrets

In your GitHub repository, go to Settings → Secrets and variables → Actions, and add:

```
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_vercel_org_id
VERCEL_PROJECT_ID=your_vercel_project_id
DATABASE_URL=same_as_above
NEXTAUTH_URL=same_as_above
NEXTAUTH_SECRET=same_as_above
RESEND_API_KEY=same_as_above
STRIPE_SECRET_KEY=same_as_above
STRIPE_WEBHOOK_SECRET=same_as_above
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=same_as_above
```

To get Vercel tokens:
1. Go to https://vercel.com/account/tokens
2. Create a new token
3. Copy VERCEL_TOKEN

To get org and project IDs:
```bash
# After initial deployment, run:
cat .vercel/project.json
```

### Step 4: Configure Stripe Webhook

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the webhook secret to STRIPE_WEBHOOK_SECRET

### Step 5: Run Database Migrations

```bash
# Connect to your production database and run migrations
npm run db:migrate
```

### Step 6: Deploy Production Build

```bash
# Deploy to production
vercel --prod
```

## 🔄 Continuous Deployment

After initial setup, the GitHub Actions workflow will:
- Automatically deploy to production on push to `main` branch
- Create preview deployments for pull requests
- Run database migrations before each deployment

## 📝 Post-Deployment Checklist

- [ ] Verify environment variables are set correctly
- [ ] Test authentication flow
- [ ] Test Stripe checkout
- [ ] Verify email sending works
- [ ] Check database connectivity
- [ ] Test admin dashboard access
- [ ] Configure custom domain (optional)

## 🚨 Troubleshooting

### Database Connection Issues
- Ensure DATABASE_URL includes `?sslmode=require` for production
- Check IP allowlist in your database provider

### Authentication Issues
- Verify NEXTAUTH_URL matches your deployment URL
- Ensure NEXTAUTH_SECRET is set and consistent

### Stripe Issues
- Verify webhook endpoint URL is correct
- Check webhook secret matches
- Ensure API keys are for the correct environment

### Build Failures
- Check Node version matches (v22)
- Verify all environment variables are set
- Check build logs in Vercel dashboard