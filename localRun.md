How to Run Locally
Prerequisites

# Install these first if not already installed
brew install ffmpeg           # Required for audio validation
brew install node             # For frontend
# Python 3.11 is needed for backend
Run the Backend

cd voicecheck/backend

# Activate the existing venv (already created)
source .venv/bin/activate

# Install deps (if not done)
pip install -r requirements.txt

# Start the server (the .env is already configured)
uvicorn main:app --reload --port 8000
The backend .env is already fully wired with real keys (OpenAI, Supabase, Stripe test keys, Clerk).

Run the Frontend

cd voicecheck/frontend
npm install       # first time only
npm run dev       # starts at http://localhost:5173
Or use Docker (runs both together)

cd voicecheck
make up           # docker-compose up --build
Testing Stripe Locally
The test Stripe keys are already in voicecheck/backend/.env. You need two extra steps:

Step 1 — Install and login to Stripe CLI:


brew install stripe/stripe-cli/stripe
stripe login
Step 2 — Forward webhooks to your local server (in a separate terminal):


stripe listen --forward-to http://localhost:8000/api/billing/webhook
This gives you a fresh whsec_... webhook secret to put in the .env — the one in .env right now is the one from a previous session, update it with whatever stripe listen outputs.

Step 3 — Test checkout flow:

Open http://localhost:5173 in browser, sign in via Clerk
Go to /account (Billing page)
Click Upgrade to Starter or Upgrade to Pro
In Stripe's test checkout, use card: 4242 4242 4242 4242, any expiry/CVC
Watch the webhook terminal — you'll see customer.subscription.created fire
The user's plan column in the DB will update to starter or pro
Other test cards:

Card	Behaviour
4242 4242 4242 4242	Payment succeeds
4000 0000 0000 0002	Card declined
4000 0000 0000 9995	Insufficient funds
4000 0025 0000 3155	3D Secure (authentication required)
