# services/credit_service.py
# from ml.credit_pipeline import (train_credit_model,
#                                  assess_credit_risk,
#                                  get_high_risk_credits)

# async def train():
#     metrics = await train_credit_model()
#     return {"status": "trained", "metrics": metrics}

# async def assess(credit_code: str):
#     return await assess_credit_risk(credit_code)

# async def high_risk(threshold: float = 0.65, branch_code: str = None):
#     return await get_high_risk_credits(threshold, branch_code)


import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.credit_pipeline import (train_credit_model, assess_credit_risk,
                                  get_high_risk_credits, precheck_credit_risk)
from ml.model_store import get_model_status

async def train(branch_code: str, business_code: str = None):
    metrics = await train_credit_model(branch_code=branch_code)
    return {"status": "trained", "branch_code": branch_code, "metrics": metrics}

async def assess(credit_code: str):
    return await assess_credit_risk(credit_code)

async def high_risk(threshold: float = 0.65, branch_code: str = None):
    return await get_high_risk_credits(threshold, branch_code)

async def precheck(payload: dict):
    return await precheck_credit_risk(payload)

async def get_status(branch_code: str, model_type: str = "credit"):
    model_name = f"{model_type}_model_{branch_code}"
    return await get_model_status(model_name)