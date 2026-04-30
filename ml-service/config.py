from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME   = os.getenv("DB_NAME", "msme-db")

if not MONGO_URI:
    raise ValueError("MONGODB ENVIRONMENT IS NOT SET")

COLLECTIONS = {
    "sales":   "productsaletransactions",
    "credit":  "credittransactions",
    "models":  "ml_models",          # stores trained model binaries
}