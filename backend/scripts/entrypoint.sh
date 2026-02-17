#!/bin/sh
set -e

echo "================================================"
echo "   Course Seller — Starting Up"
echo "================================================"

# Step 1: Run database migrations
echo ""
echo "📦 Step 1/3: Running database migrations..."
alembic upgrade head
echo "   ✅ Migrations complete"

# Step 2: Seed initial data
echo ""
echo "🌱 Step 2/3: Seeding initial data..."
python scripts/seed.py
echo "   ✅ Seeding complete"

# Step 3: Start the application
echo ""
echo "🚀 Step 3/3: Starting FastAPI server..."
echo "================================================"
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
