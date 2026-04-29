import os
import sys
from pathlib import Path

# ←←← ADD THIS BLOCK AT THE TOP OF main.py
sys.path.insert(0, str(Path(__file__).parent))
# ←←←


from fastapi import FastAPI
from contextlib import asynccontextmanager
from database import connect_db, close_db
from routes import demand, credit

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()

app = FastAPI(title="ML Service", lifespan=lifespan)

app.include_router(demand.router, prefix="/demand", tags=["Demand"])
app.include_router(credit.router, prefix="/credit", tags=["Credit"])

@app.get("/health")
async def health():
    from database import get_db
    db = get_db()
    collections = await db.list_collection_names()
    return {
        "status": "ok",
        "collections": collections
    }