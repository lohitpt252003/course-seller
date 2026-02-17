"""
Seed script — populates the database with initial data.
Run after migrations: python scripts/seed.py

Creates:
  - Default admin user (admin@courseseller.com / admin123)
  - Default categories (Programming, Design, Business, etc.)
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from sqlalchemy import inspect
from app.database import SessionLocal, engine
from app.models.user import User
from app.models.category import Category
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

CATEGORIES = [
    {"name": "Programming", "description": "Learn to code in various languages and frameworks"},
    {"name": "Web Development", "description": "Build modern websites and web applications"},
    {"name": "Data Science", "description": "Analyze data and build machine learning models"},
    {"name": "Design", "description": "UI/UX, graphic design, and creative skills"},
    {"name": "Business", "description": "Entrepreneurship, marketing, and management"},
    {"name": "DevOps", "description": "Cloud, CI/CD, containerization, and infrastructure"},
    {"name": "Mobile Development", "description": "Build iOS and Android applications"},
    {"name": "Cybersecurity", "description": "Protect systems and networks from threats"},
]

ADMIN_USER = {
    "email": "admin@courseseller.com",
    "password": "admin123",
    "name": "Platform Admin",
    "role": "admin",
}

DEMO_TEACHER = {
    "email": "teacher@courseseller.com",
    "password": "teacher123",
    "name": "Demo Teacher",
    "role": "teacher",
}


def seed():
    # Check if tables exist
    inspector = inspect(engine)
    if "users" not in inspector.get_table_names():
        print("❌ Tables not found. Run migrations first: alembic upgrade head")
        sys.exit(1)

    db = SessionLocal()
    try:
        created = {"users": 0, "categories": 0}

        # ----- Seed Admin User -----
        existing = db.query(User).filter(User.email == ADMIN_USER["email"]).first()
        if not existing:
            admin = User(
                email=ADMIN_USER["email"],
                password_hash=pwd_context.hash(ADMIN_USER["password"]),
                name=ADMIN_USER["name"],
                role=ADMIN_USER["role"],
            )
            db.add(admin)
            created["users"] += 1
            print(f"  ✅ Created admin: {ADMIN_USER['email']} (password: {ADMIN_USER['password']})")
        else:
            print(f"  ⏭️  Admin already exists: {ADMIN_USER['email']}")

        # ----- Seed Demo Teacher -----
        existing = db.query(User).filter(User.email == DEMO_TEACHER["email"]).first()
        if not existing:
            teacher = User(
                email=DEMO_TEACHER["email"],
                password_hash=pwd_context.hash(DEMO_TEACHER["password"]),
                name=DEMO_TEACHER["name"],
                role=DEMO_TEACHER["role"],
            )
            db.add(teacher)
            created["users"] += 1
            print(f"  ✅ Created teacher: {DEMO_TEACHER['email']} (password: {DEMO_TEACHER['password']})")
        else:
            print(f"  ⏭️  Teacher already exists: {DEMO_TEACHER['email']}")

        # ----- Seed Categories -----
        for cat_data in CATEGORIES:
            existing = db.query(Category).filter(Category.name == cat_data["name"]).first()
            if not existing:
                cat = Category(**cat_data)
                db.add(cat)
                created["categories"] += 1
                print(f"  ✅ Created category: {cat_data['name']}")
            else:
                print(f"  ⏭️  Category already exists: {cat_data['name']}")

        db.commit()

        print(f"\n🎉 Seed complete: {created['users']} users, {created['categories']} categories created")

    except Exception as e:
        db.rollback()
        print(f"❌ Seed failed: {e}")
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    print("🌱 Running seed script...")
    seed()
