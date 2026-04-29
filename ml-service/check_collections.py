# check_collections.py
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGO_URI, DB_NAME

async def check():
    client = AsyncIOMotorClient(MONGO_URI)
    db     = client[DB_NAME]
    cols   = await db.list_collection_names()
    print("Collections in DB:")
    for c in sorted(cols):
        count = await db[c].count_documents({})
        seeded_count = await db[c].count_documents({"_seeded": True})
        print(f"  {c:40s} total={count}  seeded={seeded_count}")
    client.close()

asyncio.run(check())