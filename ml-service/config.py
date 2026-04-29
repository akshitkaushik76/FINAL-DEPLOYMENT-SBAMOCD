from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME   = os.getenv("DB_NAME", "l_msme_operations")

COLLECTIONS = {
    "sales":   "productsaletransactions",
    "credit":  "credittransactions",
    "models":  "ml_models",          # stores trained model binaries
}