from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGO_URI, DB_NAME

client = None
db     = None

async def connect_db():
    global client, db
    client = AsyncIOMotorClient(MONGO_URI)
    db     = client[DB_NAME]
    print(f"[DB] Connected to {DB_NAME}")

async def close_db():
    if client:
        client.close()

def get_db():
    return db