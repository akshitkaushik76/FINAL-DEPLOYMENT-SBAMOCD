# # ml/model_store.py
# import io
# import joblib
# from datetime import datetime
# from bson import Binary
# from database import get_db
# from config import COLLECTIONS

# async def save_model(name: str, model_obj: object, metrics: dict):
#     """
#     Serialises model to bytes and upserts into MongoDB.
#     Only one document per model name is kept — zero disk usage.
#     """
#     buf = io.BytesIO()
#     joblib.dump(model_obj, buf)
#     buf.seek(0)
#     model_bytes = Binary(buf.read())

#     db  = get_db()
#     doc = {
#         "name":        name,
#         "model_binary": model_bytes,
#         "metrics":     metrics,
#         "trained_at":  datetime.utcnow(),
#         "version":     datetime.utcnow().strftime("%Y%m%d_%H%M%S"),
#     }
#     # Upsert — replaces old model, no accumulation
#     await db[COLLECTIONS["models"]].replace_one(
#         {"name": name}, doc, upsert=True
#     )
#     print(f"[ModelStore] Saved '{name}' to MongoDB.")

# async def load_model(name: str):
#     """
#     Loads model from MongoDB binary back into memory.
#     Returns (model_obj, metadata_dict) or (None, None) if not found.
#     """
#     db  = get_db()
#     doc = await db[COLLECTIONS["models"]].find_one({"name": name})
#     if not doc:
#         return None, None

#     buf   = io.BytesIO(doc["model_binary"])
#     model = joblib.load(buf)
#     meta  = {
#         "trained_at": doc["trained_at"],
#         "version":    doc["version"],
#         "metrics":    doc.get("metrics", {}),
#     }
#     return model, meta

# async def list_models():
#     """Returns metadata of all stored models (no binary data)."""
#     db   = get_db()
#     docs = await db[COLLECTIONS["models"]].find(
#         {}, {"name": 1, "version": 1, "trained_at": 1, "metrics": 1, "_id": 0}
#     ).to_list(length=100)
#     # Convert datetime to string for JSON serialization
#     for doc in docs:
#         if "trained_at" in doc:
#             doc["trained_at"] = str(doc["trained_at"])
#     return docs


# # add this function to existing model_store.py

# async def get_model_status(name: str) -> dict:
#     """Check if a model exists without loading the binary."""
#     db  = get_db()
#     doc = await db[COLLECTIONS["models"]].find_one(
#         {"name": name},
#         {"name": 1, "version": 1, "trained_at": 1, "metrics": 1, "_id": 0}
#     )
#     if not doc:
#         return {"model_exists": False, "name": name}
#     return {
#         "model_exists": True,
#         "name":         doc["name"],
#         "version":      doc.get("version"),
#         "trained_at":   str(doc.get("trained_at")),
#         "metrics":      doc.get("metrics", {}),
#     }

# ml/model_store.py
import io
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import joblib
from datetime import datetime
from bson import Binary

from config import COLLECTIONS

async def save_model(name: str, model_obj: object, metrics: dict):
    from database import get_db
    db  = get_db()
    
    buf = io.BytesIO()
    joblib.dump(model_obj, buf)
    buf.seek(0)
    model_bytes = Binary(buf.read())

    doc = {
        "name":         name,
        "model_binary": model_bytes,
        "metrics":      metrics,
        "trained_at":   datetime.utcnow(),
        "version":      datetime.utcnow().strftime("%Y%m%d_%H%M%S"),
    }
    await db[COLLECTIONS["models"]].replace_one(
        {"name": name}, doc, upsert=True
    )
    print(f"[ModelStore] Saved '{name}' to MongoDB.")

async def load_model(name: str):
    from database import get_db
    db  = get_db()
    
    if db is None:
        print(f"[ModelStore] ERROR: db is None when loading '{name}'")
        return None, None
    
    doc = await db[COLLECTIONS["models"]].find_one({"name": name})
    if not doc:
        print(f"[ModelStore] Model '{name}' not found in MongoDB.")
        return None, None

    buf   = io.BytesIO(doc["model_binary"])
    model = joblib.load(buf)
    meta  = {
        "trained_at": doc["trained_at"],
        "version":    doc["version"],
        "metrics":    doc.get("metrics", {}),
    }
    print(f"[ModelStore] Loaded '{name}' successfully.")
    return model, meta

async def get_model_status(name: str) -> dict:
    from database import get_db
    db  = get_db()
    
    if db is None:
        return {"model_exists": False, "name": name, "error": "DB not connected"}
    
    doc = await db[COLLECTIONS["models"]].find_one(
        {"name": name},
        {"name": 1, "version": 1, "trained_at": 1, "metrics": 1, "_id": 0}
    )
    if not doc:
        return {"model_exists": False, "name": name}
    return {
        "model_exists": True,
        "name":         doc["name"],
        "version":      doc.get("version"),
        "trained_at":   str(doc.get("trained_at")),
        "metrics":      doc.get("metrics", {}),
    }

async def list_models():
    from database import get_db
    db   = get_db()
    
    if db is None:
        return []
    
    docs = await db[COLLECTIONS["models"]].find(
        {}, {"name": 1, "version": 1, "trained_at": 1, "metrics": 1, "_id": 0}
    ).to_list(length=100)
    for doc in docs:
        if "trained_at" in doc:
            doc["trained_at"] = str(doc["trained_at"])
    return docs