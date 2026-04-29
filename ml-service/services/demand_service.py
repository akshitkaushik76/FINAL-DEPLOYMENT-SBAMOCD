# services/demand_service.py
# from ml.demand_pipeline import train_demand_model, predict_restock
# from ml.model_store import list_models

# async def train():
#     metrics = await train_demand_model()
#     return {"status": "trained", "metrics": metrics}

# async def get_restock(days: int, branch_code: str = None):
#     return await predict_restock(days=days, branch_code=branch_code)

# async def get_model_info():
#     models = await list_models()
#     return models

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.demand_pipeline import train_demand_model, predict_restock
from ml.model_store import list_models, get_model_status

async def train(branch_code: str, business_code: str = None):
    metrics = await train_demand_model(branch_code=branch_code)
    return {"status": "trained", "branch_code": branch_code, "metrics": metrics}

async def get_restock(days: int, branch_code: str):
    return await predict_restock(days=days, branch_code=branch_code)

async def get_status(branch_code: str, model_type: str = "demand"):
    model_name = f"{model_type}_model_{branch_code}"
    return await get_model_status(model_name)

async def get_model_info():
    models = await list_models()
    return models