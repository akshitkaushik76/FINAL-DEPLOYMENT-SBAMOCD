# from fastapi import APIRouter, Query, HTTPException

# from services.demand_service import train, get_restock, get_model_info

# router = APIRouter()

# @router.post("/train")
# async def train_demand():
#     try:
#         return await train()
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/restock")
# async def restock(
#     days:   int = Query(default=7,  ge=1, le=15),
#     branch: str = Query(default=None),
# ):
#     try:
#         return await get_restock(days=days, branch_code=branch)
#     except RuntimeError as e:
#         raise HTTPException(status_code=400, detail=str(e))
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/models")
# async def models():
#     return await get_model_info()


# routes/demand.py
from fastapi import APIRouter, Query, HTTPException
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from services.demand_service import train, get_restock, get_model_info, get_status

router = APIRouter()

@router.post("/train")
async def train_demand(
    branch_code:   str = Query(...,  description="Branch code e.g. SUD1-BR-1"),
    business_code: str = Query(None, description="Business code e.g. SUD1"),
):
    try:
        return await train(branch_code=branch_code, business_code=business_code)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/restock")
async def restock(
    branch_code: str = Query(...,        description="Branch code"),
    days:        int = Query(default=7,  ge=1, le=15),
):
    try:
        return await get_restock(days=days, branch_code=branch_code)
    except RuntimeError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/status")
async def status(
    branch_code: str = Query(..., description="Branch code")
):
    try:
        return await get_status(branch_code=branch_code, model_type="demand")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/models")
async def models():
    return await get_model_info()