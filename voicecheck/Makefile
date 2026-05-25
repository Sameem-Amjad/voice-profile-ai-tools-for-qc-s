.PHONY: up down logs backend frontend test clean webhook

up:
	docker-compose up --build

down:
	docker-compose down

logs:
	docker-compose logs -f

backend:
	cd backend && uvicorn main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

test:
	cd backend && pytest

webhook:
	@echo "Starting Stripe webhook listener — copy the whsec_... secret into backend/.env as STRIPE_WEBHOOK_SECRET"
	stripe listen --forward-to localhost:8000/api/billing/webhook

clean:
	docker-compose down -v && rm -rf backend/uploads backend/.whisper_models frontend/node_modules
