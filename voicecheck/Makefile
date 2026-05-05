.PHONY: up down logs backend frontend test clean

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

clean:
	docker-compose down -v && rm -rf backend/uploads backend/.whisper_models frontend/node_modules
