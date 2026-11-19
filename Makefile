.PHONY: dev backend frontend validate
dev:
	@start powershell -NoExit -Command "cd backend; python -m uvicorn app.main:app --reload"
	@start powershell -NoExit -Command "cd frontend; npm run dev"
backend:
	cd backend && python -m uvicorn app.main:app --reload
frontend:
	cd frontend && npm run dev
validate:
	cd backend && python scripts/validate_schemes.py
