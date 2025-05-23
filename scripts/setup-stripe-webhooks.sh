#!/bin/bash

echo "🚀 Setting up Stripe Webhook Testing for Luzimarket..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Stripe CLI is installed
echo "🔍 Checking Stripe CLI installation..."
if command -v stripe &> /dev/null; then
    echo -e "${GREEN}✅ Stripe CLI is installed${NC}"
    stripe --version
else
    echo -e "${RED}❌ Stripe CLI is not installed${NC}"
    echo ""
    echo "Please install Stripe CLI first:"
    echo "📖 https://stripe.com/docs/stripe-cli"
    echo ""
    echo "Quick install options:"
    echo "  macOS: brew install stripe/stripe-cli/stripe"
    echo "  Linux: See documentation for your distribution"
    echo "  Windows: Use Scoop or download binary"
    exit 1
fi

echo ""

# Check if user is logged in to Stripe CLI
echo "🔐 Checking Stripe CLI authentication..."
if stripe config --list &> /dev/null; then
    echo -e "${GREEN}✅ Stripe CLI is authenticated${NC}"
else
    echo -e "${YELLOW}⚠️ Stripe CLI is not authenticated${NC}"
    echo ""
    echo "Please log in to Stripe CLI:"
    echo "  stripe login"
    echo ""
    echo "This will open your browser to authenticate with your Stripe account."
    exit 1
fi

echo ""

# Check if .env file exists and has required Stripe keys
echo "🔧 Checking environment configuration..."
if [ -f ".env" ]; then
    echo -e "${GREEN}✅ .env file found${NC}"
    
    # Check for required Stripe environment variables
    if grep -q "STRIPE_SECRET_KEY=" .env && grep -q "STRIPE_WEBHOOK_SECRET=" .env; then
        echo -e "${GREEN}✅ Stripe keys found in .env${NC}"
    else
        echo -e "${YELLOW}⚠️ Missing Stripe keys in .env file${NC}"
        echo ""
        echo "Please add the following to your .env file:"
        echo "  STRIPE_SECRET_KEY=sk_test_your_secret_key_here"
        echo "  STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here"
        echo ""
        echo "You can find these in your Stripe Dashboard:"
        echo "📖 https://dashboard.stripe.com/test/apikeys"
    fi
else
    echo -e "${RED}❌ .env file not found${NC}"
    echo ""
    echo "Please create a .env file in the project root with your Stripe keys."
    exit 1
fi

echo ""

# Install dependencies
echo "📦 Installing Stripe SDK..."
cd apps/backend
if npm list stripe &> /dev/null; then
    echo -e "${GREEN}✅ Stripe SDK already installed${NC}"
else
    npm install stripe
    echo -e "${GREEN}✅ Stripe SDK installed${NC}"
fi

cd ../frontend
if npm list @stripe/stripe-js @stripe/react-stripe-js &> /dev/null; then
    echo -e "${GREEN}✅ Stripe frontend libraries already installed${NC}"
else
    npm install @stripe/stripe-js @stripe/react-stripe-js
    echo -e "${GREEN}✅ Stripe frontend libraries installed${NC}"
fi

cd ../..

echo ""

# Create tmp directory for webhook secrets
echo "📁 Setting up temporary directories..."
mkdir -p tmp
echo -e "${GREEN}✅ Temporary directories created${NC}"

echo ""

# Test webhook endpoint
echo "🧪 Testing webhook endpoint..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/webhooks/stripe -X POST -H "Content-Type: application/json" -d '{}' | grep -q "400\|404"; then
    echo -e "${GREEN}✅ Webhook endpoint is accessible${NC}"
else
    echo -e "${YELLOW}⚠️ Webhook endpoint not accessible (server may not be running)${NC}"
    echo "Start the backend server with: npm run dev:backend"
fi

echo ""
echo -e "${BLUE}🎉 Stripe webhook setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Start your development servers:"
echo "   ${YELLOW}npm run dev:backend${NC} (in one terminal)"
echo "   ${YELLOW}npm run dev:frontend${NC} (in another terminal)"
echo ""
echo "2. Run Playwright tests with Stripe webhook integration:"
echo "   ${YELLOW}npm run test:e2e -- stripe-webhook-integration.spec.js${NC}"
echo ""
echo "3. For manual webhook testing, start Stripe CLI listener:"
echo "   ${YELLOW}stripe listen --forward-to localhost:8000/api/webhooks/stripe${NC}"
echo ""
echo "4. Trigger test events:"
echo "   ${YELLOW}stripe trigger payment_intent.succeeded${NC}"
echo ""
echo "📖 For more information, see the Stripe documentation:"
echo "   https://stripe.com/docs/webhooks/test"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}" 