from pymongo import MongoClient
import sys

MONGO_URI = "mongodb://localhost:27017/"
DB_NAME = "career_genome"

try:
    print(f"Attempting to connect to {MONGO_URI}...")
    client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
    client.admin.command('ping')
    print("MongoDB Connected Successfully!")
except Exception as e:
    print(f"MongoDB Connection Error: {e}")
    sys.exit(1)
