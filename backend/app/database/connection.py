import os

from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")

client = MongoClient(MONGODB_URL)

database = client[DATABASE_NAME]

users_collection = database["users"]
exams_collection = database["exams"]
questions_collection = database["questions"]
submissions_collection = database["submissions"]
requests_collection = database["requests"]
exam_sessions_collection = database["exam_sessions"]

notifications_collection = database["notifications"]

# Ensure indexes for performance
try:
    exam_sessions_collection.create_index("exam_id")
    exam_sessions_collection.create_index("student_id")
    exam_sessions_collection.create_index("status")
    notifications_collection.create_index("recipient_id")
    notifications_collection.create_index("created_at")
except Exception:
    pass

