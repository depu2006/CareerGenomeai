from pymongo import MongoClient

# Connect to MongoDB
try:
    client = MongoClient("mongodb://localhost:27017/")
    db = client["career_genome"]
    
    # List Collections
    collections = db.list_collection_names()
    print("\n📦 Database: career_genome")
    print(f"📂 Collections ({len(collections)}): {collections}\n")

    # Show Data from each Collection
    for col_name in collections:
        print(f"--- 📄 Collection: {col_name} ---")
        count = db[col_name].count_documents({})
        print(f"   Total Documents: {count}")
        docs = list(db[col_name].find().sort("date", -1).limit(3)) # Show latest 3
        if not docs:
            print("   (Empty)")
        for doc in docs:
            print(f"   {doc}")
        print("\n")

except Exception as e:
    print(f"Error: {e}")
